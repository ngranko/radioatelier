import type KeyVal from '$lib/interfaces/keyVal';
import {WebSocketMessage} from '$lib/api/websocket/WebSocketMessage';
import WebSocketError from '$lib/errors/WebSocketError';

interface RawMessage<T = undefined> {
    type: string;
    payload: T;
}

export class WebSocketConnection {
    private connection?: WebSocket;
    private readonly uri: string;
    private params: KeyVal;
    private openHandler?: (event: Event) => void;
    private messageHandler?: (message: WebSocketMessage) => void;
    private errorHandler?: (event: Event) => void;
    private closeHandler?: (event: Event) => void;

    public constructor(uri: string) {
        this.uri = uri;
        this.params = {};
    }

    public setParams(params: {}): this {
        this.params = {...this.params, ...params};
        return this;
    }

    public setParam(name: string, value: unknown): this {
        this.params[name] = value;
        return this;
    }

    public setOpenHandler(handler: (event: Event) => void) {
        this.openHandler = handler;
    }

    public setMessageHandler(handler: (message: WebSocketMessage) => void) {
        this.messageHandler = handler;
    }

    public setErrorHandler(handler: (event: Event) => void) {
        this.errorHandler = handler;
    }

    public setCloseHandler(handler: (event: Event) => void) {
        this.closeHandler = handler;
    }

    public connect() {
        if (typeof this.connection !== 'undefined') {
            throw new WebSocketError('This connection is already established');
        }

        this.connection = new WebSocket(this.getFullUrl());

        if (typeof this.openHandler !== 'undefined') {
            this.connection.onopen = this.openHandler;
        }

        this.connection.onmessage = (event: MessageEvent<string>) => {
            const rawMessage = JSON.parse(event.data) as RawMessage;
            const message = new WebSocketMessage(rawMessage.type, rawMessage.payload);
            if (this.messageHandler) {
                this.messageHandler(message);
            }
        };

        this.connection.onerror = event => {
            // only handle error on an open socket, because otherwise it happened on our side
            // (probably, because I couldn't send something) and it should be handled by the disconnect handler
            if (
                this.connection &&
                this.connection.readyState === this.connection.OPEN &&
                this.errorHandler
            ) {
                this.errorHandler(event);
            }
        };

        if (typeof this.closeHandler !== 'undefined') {
            this.connection.onclose = this.closeHandler;
        }
    }

    public sendMessage<T = undefined>(type: string, payload: T) {
        const message = new WebSocketMessage(type, payload);
        if (typeof this.connection === 'undefined') {
            throw new WebSocketError('Cannot send a message through a closed websocket');
        }

        this.connection.send(JSON.stringify(message));
    }

    public closeConnection() {
        if (typeof this.connection === 'undefined') {
            return;
        }

        this.connection.close();
        this.connection = undefined;
    }

    private getFullUrl(): string {
        let fullUrl = this.uri;

        const paramString = this.getParamString();
        if (paramString.length > 0) {
            fullUrl = `${fullUrl}?${paramString}`;
        }
        return fullUrl;
    }

    private getParamString(): string {
        let result = '';

        for (const key of Object.keys(this.params)) {
            if (typeof this.params[key] === 'undefined') {
                continue;
            }

            result = `${result}&${key}=${this.params[key]}`;
        }

        return result.substring(1);
    }
}
