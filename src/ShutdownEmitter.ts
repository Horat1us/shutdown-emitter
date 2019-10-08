import { EventEmitter } from "events";
import { ShutdownListener, ShutdownListenerCallback } from "./ShutdownListener";

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
        this.config = Object.freeze({
            ...ShutdownEmitterDefaultConfig,
            ...config,
        });
        this.subscribe();
    }

    public addListener(listener: ShutdownListener): void {
        this.events.on(this.config.eventName, listener);
    }

    public removeListener(listener: ShutdownListener): void {
        this.events.off(this.config.eventName, listener);
    }

    protected get isShutdownState(): boolean {
        return this.timeoutHandle !== undefined;
    }

    protected get isEventsHandled(): boolean {
        return this.events.listenerCount(this.config.eventName) === 0;
    }

    private subscribe(): void {
        this.config.signals.forEach((signal): void => {
            const listener = () => {
                console.log(`[shutdown] ${signal}`);
                this.timeoutHandle = setTimeout(this.handleTimeoutReached, this.config.timeout);
                this.events.emit(this.config.eventName, this.handleListenerShutdown, signal);
                this.handleListenerShutdown();
            };
            process.on(signal, listener);
        });
    }

    private exit(): void {
        console.log(`[shutdown] exit ${this.exitCode}`);
        process.exit(this.exitCode);
    }

    private handleTimeoutReached = () => {
        console.error(`[shutdown] timeout ${this.config.timeout}`);
        process.exit(1);
    };

    private handleListenerShutdown = (error?: any, listener?: ShutdownListenerCallback) => {
        if (listener) {
            this.events.off(this.config.eventName, listener);
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
