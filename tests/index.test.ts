import { SnerdQueue } from '../src/index';
import * as path from 'path';
import * as fs from 'fs';

// Helper to clear the local test db before running
const DB_PATH = path.join(__dirname, '..', '.snerdata', 'tasks', 'tasks.log');
function wipeTestDb() {
    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
    }
}

describe('SnerdQueue Orchestrator Integration', () => {
    let queue: SnerdQueue;

    beforeAll(() => {
        wipeTestDb();
        
        // Point to the compiled Rust binary in the sibling snerdmq directory
        const binPath = path.join(__dirname, '..', '..', 'snerdmq', 'target', 'debug', 'snerdmq');
        queue = new SnerdQueue({
            binaryPath: binPath
        });
    });

    afterAll(() => {
        queue.shutdown();
    });

    it('should successfully execute a registered task', async () => {
        // 1. Create a promise that resolves when the handler finishes
        const jobCompleted = new Promise<void>((resolve) => {
            queue.registerHandler('test_notification', async (data) => {
                expect(data.user_id).toBe('john_wick');
                expect(data.message).toBe('Baba Yaga');
                resolve();
            });
        });

        // 2. Enqueue the task
        queue.enqueue({
            id: 'jest-job-1',
            type: 'test_notification',
            data: { user_id: 'john_wick', message: 'Baba Yaga' }
        });

        // 3. Wait for the handler to actually run (SDK to receive stdout from Rust)
        // Jest will automatically fail this test if the promise times out!
        await jobCompleted;
    });
});
