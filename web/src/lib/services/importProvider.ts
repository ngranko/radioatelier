import {getNonce} from '$lib/api/nonce';
import {WebSocketConnection} from '$lib/api/websocket/WebSocketConnection';
import {
    WebSocketMessage,
    WSCancelMessageType,
    WSErrorMessageType,
    WSProcessPingMessageType,
    WSProgressMessageType,
    WSSendInputMessageType,
    WSSuccessMessageType,
} from '$lib/api/websocket/WebSocketMessage';
import config from '$lib/config';
import WebSocketError from '$lib/errors/WebSocketError';
import type {
    ImportDisconnectHandler,
    ImportErrorHandler,
    ImportMappings,
    ImportProgressHandler,
    ImportSuccessHandler,
    WSMessagePayload,
    WSSendInputMessagePayload,
} from '$lib/interfaces/import';

export class ImportProvider {
    private connection: WebSocketConnection;
    private successHandler?: ImportSuccessHandler;
    private errorHandler?: ImportErrorHandler;
    private disconnectHandler?: ImportDisconnectHandler;
    private progressHandler?: ImportProgressHandler;
    private timeout?: number;
    private isStarted = false;
    private isFinished = false;

    public constructor() {
        this.connection = new WebSocketConnection('');
    }

    public isRunning(): boolean {
        return this.isStarted && !this.isFinished;
    }

    public setErrorHandler(handler: ImportErrorHandler) {
        this.errorHandler = handler;
    }

    public setDisconnectHandler(handler: ImportDisconnectHandler) {
        this.disconnectHandler = handler;
    }

    public setSuccessHandler(handler: ImportSuccessHandler) {
        this.successHandler = handler;
    }

    public setProgressHandler(handler: ImportProgressHandler) {
        this.progressHandler = handler;
    }

    public async start(id: string, separator: string, mappings: ImportMappings) {
        this.connection = new WebSocketConnection(`wss://${document.location.host}/api/import`);

        const response = await getNonce();
        this.connection.setParam('token', response.data.nonce);

        this.connection.setOpenHandler(() => {
            this.isStarted = true;
            this.connection.sendMessage<WSSendInputMessagePayload>(WSSendInputMessageType, {
                id,
                separator,
                mappings,
            });
        });

        this.connection.setMessageHandler(message => this.routeMessage(message));

        this.connection.setErrorHandler(() => {
            if (this.errorHandler) {
                this.errorHandler(
                    new WebSocketMessage<WSMessagePayload>(WSErrorMessageType, {
                        type: 'error',
                        total: 0,
                        successful: 0,
                        percentage: 0,
                        error: 'Generic WebSocket error',
                    }),
                );
            }
        });

        this.connection.setCloseHandler(() => {
            if (this.isFinished) {
                this.stopIdleTimeout();
            } else {
                this.isFinished = true;
                this.handleIdleTimeoutReached();
            }
        });

        this.connection.connect();
        this.startIdleTimeout();
    }

    public cancel() {
        this.disconnectHandler = undefined;
        this.connection.sendMessage<{}>(WSCancelMessageType, {});
        this.stopIdleTimeout();
    }

    public closeConnection() {
        this.connection.closeConnection();
        this.stopIdleTimeout();
    }

    private routeMessage(message: WebSocketMessage) {
        switch (message.type) {
            case WSSuccessMessageType:
                this.isFinished = true;
                if (this.successHandler) {
                    this.successHandler(message as WebSocketMessage<WSMessagePayload>);
                    this.closeConnection();
                }
                break;
            case WSErrorMessageType:
                this.isFinished = true;
                if (this.errorHandler) {
                    this.errorHandler(message as WebSocketMessage<WSMessagePayload>);
                }
                break;
            case WSProgressMessageType:
                if (this.progressHandler) {
                    this.progressHandler(message as WebSocketMessage<WSMessagePayload>);
                }
                break;
            case WSProcessPingMessageType:
                console.log('processPing');
                this.resetIdleTimeout();
                break;
            default:
                throw new WebSocketError(`Unknown message type: ${message.type}`);
        }
    }

    private startIdleTimeout() {
        this.resetIdleTimeout();
    }

    private resetIdleTimeout() {
        this.stopIdleTimeout();
        this.timeout = window.setTimeout(
            () => this.handleIdleTimeoutReached(),
            config.importIdleTimeout,
        );
    }

    private stopIdleTimeout() {
        if (this.timeout) {
            window.clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }

    private handleIdleTimeoutReached() {
        console.log('idle timeout reached, closing websocket');
        this.closeConnection();

        if (this.disconnectHandler) {
            this.disconnectHandler();
        }
    }
}
