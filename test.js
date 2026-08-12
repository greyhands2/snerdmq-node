const { SnerdQueue } = require('./dist/index.js');
const path = require('path');

async function run() {
    // We use the compiled rust binary from snerdmq directory for testing
    const queue = new SnerdQueue({
        binaryPath: path.join(__dirname, '..', 'snerdmq', 'target', 'debug', 'snerdmq')
    });

    console.log('[Test] SDK Initialized.');

    queue.registerHandler('welcome_email', async (data) => {
        console.log(`[Test] ✉️ Sending welcome email to: ${data.email}`);
        await new Promise(r => setTimeout(r, 500));
        console.log(`[Test] ✅ Email sent successfully!`);
    });

    console.log('[Test] Enqueuing job...');
    queue.enqueue({
        id: 'job-777',
        type: 'welcome_email',
        data: { email: 'john@wick.com' },
        maxRetries: 3
    });

    // Let it run for 3 seconds then shutdown
    setTimeout(() => {
        console.log('[Test] Shutting down queue...');
        queue.shutdown();
        process.exit(0);
    }, 3000);
}

run();
