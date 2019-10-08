import { EventEmitter } from "events";
import { ShutdownListener, ShutdownListenerCallback } from "./ShutdownListener";

const signals: Array<NodeJS.Signals> = [ 'SIGINT', 'SIGTERM', 'SIGQUIT' ];
const eventName = 'shutdown';
const timeout = 10000;


export interface ShutdownEmitterConfig {
    signals: Array<NodeJS.Signals>;
    eventName: string;
    timeout: number;
}

export const ShutdownEmitterDefaultConfig = Object.freeze<ShutdownEmitterConfig>({
    signals: [ 'SIGINT', 'SIGTERM', 'SIGQUIT' ],
    eventName: 'shutdown',
    timeout: 10000,
});

export class ShutdownEmitter {
    public readonly config: Readonly<ShutdownEmitterConfig>;

    protected events: EventEmitter = new EventEmitter();
    protected timeoutHandle: NodeJS.Timeout | undefined;
    protected exitCode: number = 0;

    constructor(config: Partial<ShutdownEmitterConfig> = {}) {
        this.subscribe();
        this.config = Object.freeze({
            ...ShutdownEmitterDefaultConfig,
            ...config,
        });
    }

    public addListener(listener: ShutdownListener): void {
        this.events.on(eventName, listener);
    }

    public removeListener(listener: ShutdownListener): void {
        this.events.off(eventName, listener);
    }

    protected get isShutdownState(): boolean {
        return this.timeoutHandle !== undefined;
    }

    protected get isEventsHandled(): boolean {
        return this.events.listenerCount(eventName) === 0;
    }

    private subscribe(): void {
        signals.forEach((signal) => process.on(signal, () => {
            console.log(`[shutdown] ${signal}`);
            this.timeoutHandle = setTimeout(this.handleTimeoutReached, timeout);
            this.events.emit(eventName, this.handleListenerShutdown, signal);
            this.handleListenerShutdown();
        }));
    }

    private exit(): void {
        console.log(`[shutdown] exit ${this.exitCode}`);
        process.exit(this.exitCode);
    }

    private handleTimeoutReached = () => {
        console.error(`[shutdown] timeout ${timeout}`);
        process.exit(1);
    };

    private handleListenerShutdown = (error?: any, listener?: ShutdownListenerCallback) => {
        if (listener) {
            this.events.off(eventName, listener);
        }

        if (error) {
            console.error(`[shutdown]`, error);
            this.exitCode -= 1;
        }
        if (this.isShutdownState && this.isEventsHandled) {
            return this.exit();
        }
    };
}
