"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnerdQueue = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
class SnerdQueue {
    engine;
    handlers = new Map();
    isShuttingDown = false;
    constructor(options) {
        let binPath = options?.binaryPath;
        if (!binPath) {
            // Attempt to use the downloaded binary from postinstall
            const ext = os.platform() === 'win32' ? '.exe' : '';
            binPath = path.join(__dirname, '..', 'bin', `snerdmq${ext}`);
        }
        if (!fs.existsSync(binPath)) {
            throw new Error(`[Snerd] Binary not found at ${binPath}. Ensure it is compiled or installed.`);
        }
        const args = [];
        if (options?.storagePath) {
            args.push(options.storagePath);
        }
        this.engine = (0, child_process_1.spawn)(binPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
        if (!this.engine.stdin || !this.engine.stdout || !this.engine.stderr) {
            throw new Error('[Snerd] Failed to initialize standard I/O pipes with the engine.');
        }
        this.setupEventLoop();
        // Graceful shutdown
        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
        process.on('exit', this.shutdown.bind(this));
    }
    setupEventLoop() {
        let buffer = '';
        this.engine.stdout.on('data', (data) => {
            buffer += data.toString();
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);
                if (!line)
                    continue;
                try {
                    const msg = JSON.parse(line);
                    this.handleEngineMessage(msg);
                }
                catch (e) {
                    // Ignore non-JSON stdout (e.g., Rust logs or warnings)
                }
            }
        });
        this.engine.stderr.on('data', (data) => {
            console.error(`[Snerd Engine Error]: ${data.toString().trim()}`);
        });
        this.engine.on('close', (code) => {
            if (!this.isShuttingDown) {
                console.warn(`[Snerd] Engine process terminated unexpectedly with code ${code}.`);
            }
        });
    }
    async handleEngineMessage(msg) {
        if (msg.action === 'execute') {
            const handler = this.handlers.get(msg.task_type);
            if (!handler) {
                this.send({ action: 'result', task_id: msg.task_id, status: 'error', error_msg: 'No handler registered for this task type.' });
                return;
            }
            try {
                const parsedData = typeof msg.task_data === 'string' ? JSON.parse(msg.task_data) : msg.task_data;
                await handler(parsedData);
                this.send({ action: 'result', task_id: msg.task_id, status: 'success' });
            }
            catch (error) {
                this.send({ action: 'result', task_id: msg.task_id, status: 'error', error_msg: error.message || 'Unknown error during execution.' });
            }
        }
        else if (msg.action === 'max_retries_reached') {
            console.warn(`[Snerd] Dead Letter Queue: Task ${msg.task_id} (${msg.task_type}) permanently failed after max retries.`);
        }
    }
    send(msg) {
        if (this.engine.stdin && !this.isShuttingDown) {
            this.engine.stdin.write(JSON.stringify(msg) + '\n');
        }
    }
    registerHandler(taskType, handler) {
        this.handlers.set(taskType, handler);
        this.send({ action: 'register', task_type: taskType });
    }
    enqueue(options) {
        this.send({
            action: 'enqueue',
            task_id: options.id,
            task_type: options.type,
            task_data: JSON.stringify(options.data),
            max_retries: options.maxRetries ?? 3,
            retry_after_hours: options.retryAfterHours ?? 0.0
        });
    }
    shutdown() {
        if (this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        this.engine.kill('SIGINT');
    }
}
exports.SnerdQueue = SnerdQueue;
//# sourceMappingURL=index.js.map