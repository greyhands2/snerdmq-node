export interface SnerdQueueOptions {
    binaryPath?: string;
    storagePath?: string;
}
export interface EnqueueOptions {
    id: string;
    type: string;
    data: any;
    maxRetries?: number;
    retryAfterHours?: number;
}
export type TaskHandler = (data: any) => Promise<void>;
export declare class SnerdQueue {
    private engine;
    private handlers;
    private isShuttingDown;
    constructor(options?: SnerdQueueOptions);
    private setupEventLoop;
    private handleEngineMessage;
    private send;
    registerHandler(taskType: string, handler: TaskHandler): void;
    enqueue(options: EnqueueOptions): void;
    shutdown(): void;
}
//# sourceMappingURL=index.d.ts.map