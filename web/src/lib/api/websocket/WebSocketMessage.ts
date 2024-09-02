export const WSSendInputMessageType = 'input';
export const WSSuccessMessageType = 'success';
export const WSErrorMessageType = 'error';
export const WSProcessPingMessageType = 'processPing';
export const WSCancelMessageType = 'cancel';
export const WSProgressMessageType = 'progress';

export class WebSocketMessage<T = unknown> {
    public type: string;
    public payload: T;

    public constructor(type: string, payload: T) {
        this.type = type;
        this.payload = payload;
    }
}
