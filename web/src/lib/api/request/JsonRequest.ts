import {
    METHOD_DELETE,
    METHOD_GET,
    STATUS_REQUEST_ERROR,
    STATUS_SERVER_ERROR,
} from '$lib/api/constants';
import type {HttpMethod} from '$lib/interfaces/http';
import type KeyVal from '$lib/interfaces/keyVal';
import RequestError from '$lib/errors/RequestError';
import ServerError from '$lib/errors/ServerError';
import type {RawResponse} from '$lib/interfaces/api';
import type Request from '$lib/api/request/Request';

interface RequestParams {
    resource: RequestInfo;
    init: RequestInit;
}

export default class JsonRequest implements Request<never> {
    private readonly uri: string;
    private readonly method: HttpMethod;
    private readonly headers: KeyVal<string>;
    private params: KeyVal;
    private formData?: FormData;

    public constructor(uri: string, method: HttpMethod = METHOD_GET) {
        this.uri = uri;
        this.method = method;
        this.params = {};
        this.headers = {};
    }

    public setParams(params: {}): this {
        this.params = {...this.params, ...params};
        return this;
    }

    public setParam(name: string, value: unknown): this {
        this.params[name] = value;
        return this;
    }

    public setFormData(formData: FormData): this {
        this.formData = formData;
        return this;
    }

    public setHeader(name: string, value: string): this {
        this.headers[name] = value;
        return this;
    }

    public setAuthHeader(token: string): this {
        this.headers.Authorization = `Bearer ${token}`;
        return this;
    }

    public async send(): Promise<never> {
        const {resource, init} = this.prepareRequest();

        const response = await this.doSend(resource, init);
        if (response.status >= STATUS_REQUEST_ERROR) {
            throw new RequestError(
                `Request to ${this.uri} ended with an error (response status ${response.status})`,
                response.status,
                response.payload,
            );
        }

        return response.payload as never;
    }

    private async doSend(resource: RequestInfo, init: RequestInit): Promise<RawResponse<object>> {
        return fetch(resource, init).then(async response => {
            if (response.status >= STATUS_SERVER_ERROR) {
                throw new ServerError(
                    `Request to ${this.uri} ended with status ${response.status}`,
                );
            }

            return response.json().then(payload => ({
                status: response.status,
                payload,
            }));
        });
    }

    private prepareRequest(): RequestParams {
        return {
            resource: this.getFullUrl(),
            init: {
                method: this.method,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    ...(typeof this.formData === 'undefined' && {
                        'Content-Type': 'application/json',
                    }),
                    ...this.headers,
                },
                ...(this.method !== METHOD_GET &&
                    this.method !== METHOD_DELETE && {
                        body: this.formData ?? JSON.stringify(this.params),
                    }),
            },
        };
    }

    private getFullUrl(): string {
        let fullUrl = this.uri;

        if (this.method === METHOD_GET || this.method === METHOD_DELETE) {
            const paramString = this.getParamString();
            if (paramString.length > 0) {
                fullUrl = `${fullUrl}?${paramString}`;
            }
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
