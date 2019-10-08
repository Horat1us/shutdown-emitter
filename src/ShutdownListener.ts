export interface ShutdownListener {
    (done: ShutdownListenerCallback): void;
}

export interface ShutdownListenerCallback {
    (error: any | undefined, listener: ShutdownListener): void
}

export interface ShutdownCallback {
    (error?: Error | null): any;
}
export interface ShutdownCallbackRequest {
    (callback: ShutdownCallback): any;
}
export const ShutdownCallbackListener = (
    request: ShutdownCallbackRequest
): ShutdownListener => {
    const listener = (done: ShutdownListenerCallback) => request((error) => done(
        ((undefined !== error) && (null !== error)) ? error : undefined,
        listener
    ));
    return listener;
};

export interface ShutdownPromise extends Promise<any> {
}
export interface ShutdownPromiseRequest {
    (): ShutdownPromise;
}
export const ShutdownPromiseListener = (
    request: ShutdownPromiseRequest,
): ShutdownListener => {
    const listener = (done: ShutdownListenerCallback) => request()
            .catch((error) => done(error, listener))
            .then(() => done(undefined, listener));

    return listener;
};
