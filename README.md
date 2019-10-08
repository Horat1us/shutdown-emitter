# Node.JS Shutdown Emitter

Handling graceful application services shutdown.

## Install
```bash
npm i shutdown-emitter
```

## Usage

### Promisified Service
Handle graceful shutdown for service with promisified connection and disconnection methods.


```typescript
import { ShutdownEmitter, ShutdownPromiseListener } from "./src";

declare const abstractService: {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
};
declare const shutdownEmitter: ShutdownEmitter;

abstractService
    .connect()
    .then(() => {
        const shutdownListener = ShutdownPromiseListener(abstractService.connect);
        shutdownEmitter.addListener(shutdownListener);
    });
```

### Callback Service
Handle graceful shutdown for service with callback-based connection and disconnection methods.

```typescript
import express from "express";
import { ShutdownEmitter, ShutdownCallbackListener } from "./src";

declare const abstractService: {
    connect(cb: () => void): void;
    disconnect(cb: (err?: Error) => void): void;
};
declare const shutdownEmitter: ShutdownEmitter;

abstractService.connect(() => {
    const shutdownListener = ShutdownCallbackListener(abstractService.disconnect);
    shutdownListener.addListener(shutdownListener);
});
``` 

### Redis Connection
```typescript
import { RedisClient } from "redis";
import { ShutdownEmitter, ShutdownCallbackListener } from "./src";

declare const redis: RedisClient;
declare const shutdownEmitter: ShutdownEmitter;

shutdownEmitter.addListener(ShutdownCallbackListener(redis.quit));
```

### Express Application
```typescript
import express from "express";
import { ShutdownEmitter, ShutdownCallbackListener } from "./src";

declare const app: express.Application;
declare const shutdownEmitter: ShutdownEmitter;

const server = app.listen(() => shutdownEmitter.addListener(ShutdownCallbackListener(server.close)));
```
