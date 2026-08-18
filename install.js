const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const child_process = require('child_process');

const REPO = 'speed-nerd/snerdmq';
// TODO: When you actually publish a release to GitHub, bump this version!
const VERSION = 'v0.1.1'; 

const PLATFORM_MAP = {
    'darwin': 'macos',
    'linux': 'linux',
    'win32': 'windows'
};

const ARCH_MAP = {
    'x64': 'x64',
    'arm64': 'arm64'
};

const platform = PLATFORM_MAP[os.platform()];
const arch = ARCH_MAP[os.arch()];

if (!platform || !arch) {
    console.error(`[Snerd] Unsupported platform/arch: ${os.platform()} ${os.arch()}`);
    console.log('[Snerd] You must manually compile and provide the snerdmq binary path.');
    process.exit(0);
}

const ext = platform === 'windows' ? '.exe' : '';
const binaryName = `snerdmq-${platform}-${arch}${ext}`;
const downloadUrl = `https://github.com/${REPO}/releases/download/${VERSION}/${binaryName}`;

const binDir = path.join(__dirname, 'bin');
const binDest = path.join(binDir, `snerdmq${ext}`);

if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

console.log(`[Snerd] Downloading pre-compiled engine from GitHub: ${binaryName}...`);

https.get(downloadUrl, (response) => {
    // If we get a 302 redirect, follow it!
    if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, handleStream).on('error', handleError);
    } else {
        handleStream(response);
    }
}).on('error', handleError);

function handleStream(response) {
    if (response.statusCode === 404) {
        console.warn(`\n[Snerd] WARN: Binary not found at ${downloadUrl}`);
        console.warn(`[Snerd] (This is expected if you haven't published a GitHub Release yet)`);
        console.warn(`[Snerd] Please provide binaryPath manually when initializing SnerdQueue.\n`);
        process.exit(0);
    }

    const file = fs.createWriteStream(binDest);
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        if (platform !== 'windows') {
            child_process.execSync(`chmod +x "${binDest}"`);
        }
        console.log(`[Snerd] Successfully installed Snerd Engine!`);
    });
}

function handleError(err) {
    console.error(`[Snerd] Failed to download binary: ${err.message}`);
}
