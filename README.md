<div align="center">
  <h1>🚀 SnerdMQ Node.js SDK</h1>
  <p>The official Node.js & TypeScript SDK for SnerdMQ – A C-speed, zero-dependency background job engine.</p>

  [![npm version](https://img.shields.io/npm/v/snerdmq-node)](https://www.npmjs.com/package/snerdmq-node)
  [![License](https://img.shields.io/npm/l/snerdmq-node)](https://github.com/greyhands2/snerdmq-node/blob/main/LICENSE)
</div>

This is the official Node.js client for **SnerdMQ**. It acts as a lightweight, elegant wrapper over the underlying Rust background daemon. It handles all JSON-RPC communication, standard I/O piping, and event loop orchestration so you can write background jobs natively in JavaScript or TypeScript.

## ✨ Features
- **Zero Rust Required**: Our post-install script automatically downloads the pre-compiled C-speed Rust binary for your OS.
- **Native TypeScript**: Written in 100% TypeScript. Enjoy full autocomplete and strict type checking out of the box.
- **Zero Config**: No redis, no databases, no ports. Just start enqueuing jobs.

## 📦 Installation

```bash
npm install snerdmq-node
```

> **Note:** During installation, the SDK will automatically reach out to GitHub to download the correct SnerdMQ binary for your operating system (`macos`, `linux`, or `windows`). 

---

## ⚡ Quickstart

Using the SDK is incredibly simple. Initialize the queue, register your async handlers, and start enqueuing jobs!

```typescript
import { SnerdQueue } from 'snerdmq-node';

// 1. Initialize the daemon in the background
const queue = new SnerdQueue();

// 2. Register your background job logic
queue.registerHandler('send_email', async (data) => {
    console.log(`Sending email to ${data.to}...`);
    // ... your logic here (e.g., hitting SendGrid API)
});

// 3. Enqueue a job from anywhere in your codebase
queue.enqueue({
    id: `email-${Date.now()}`,
    type: 'send_email',
    data: { to: 'john@wick.com', subject: 'Continental Update' },
    maxRetries: 3
});

// 4. (Optional) Safely kill the daemon when your Node app exits
process.on('SIGINT', () => {
    queue.shutdown();
    process.exit(0);
});
```

---

## 🌍 Advanced: Distributed Scaling

By default, the SDK spins up the Rust daemon which writes the queue to a local file (`.snerdata/tasks/tasks.log`). 

If you have multiple Node.js servers running behind a load balancer and want them to share the exact same queue, simply mount a **Shared Network Drive** (like AWS EFS or NFS) to all of your servers and pass the shared path into the `SnerdQueue` options:

```typescript
import { SnerdQueue } from 'snerdmq-node';

// All 10 of your Node.js servers point to the exact same shared file!
// SnerdMQ's native OS file-locking guarantees zero data corruption.
const queue = new SnerdQueue({
    storagePath: '/mnt/aws-efs-shared-drive/snerd_tasks.log'
});
```

*Built with ❤️ for John Wick tier engineering.*
