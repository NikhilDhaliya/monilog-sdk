# Monilog SDK

[![npm version](https://img.shields.io/npm/v/monilog-sdk.svg)](https://www.npmjs.com/package/monilog-sdk)
[![license](https://img.shields.io/npm/l/monilog-sdk.svg)](https://github.com/NikhilDhaliya/monilog-sdk/blob/main/LICENSE)

A high-performance, middleware-based logger SDK for Node.js applications. **Monilog** automatically monitors your backend logs, handles log rotation, and provides real-time Slack alerting for critical errors.

## Quick Start

### Installation

```bash
npm install monilog-sdk
```

### Basic Usage (Express)

Integrate Monilog into your Express application in just a few lines of code:

```javascript
import express from 'express';
import { monitor } from 'monilog-sdk';

const app = express();

app.use(monitor({
  slackWebhookUrl: 'https://hooks.slack.com/services/YOUR_WEBHOOK_URL',
  logFilePath: './logs/app.log',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
}));

app.get('/', (req, res) => {
  res.send('Monilog is active!');
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Key Features

-   **Zero-Config Monitoring**: Automatically captures method, URL, status code, duration, and client IP.
-   **Smart Log Rotation**: Built-in log rotation to prevent disk space exhaustion (5MB default).
-   **Real-time Alerts**: Instant Slack notifications for `4xx` and `5xx` errors.
-   **Selective Monitoring**: Track specific status codes that matter to your business logic.
-   **Robust & Lightweight**: Minimal dependencies (only `axios`) and designed for low overhead.

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `slackWebhookUrl` | `string` | `undefined` | Your Slack incoming webhook URL for alerts. |
| `logFilePath` | `string` | `./logs.txt` | Path where logs will be stored. |
| `monitorStatusCodes` | `number[]` | `[]` | Additional status codes to trigger Slack alerts. |
| `maxLogSize` | `number` | `5242880` | Max size in bytes before rotation (5MB). |
| `maxFiles` | `number` | `2` | Number of rotated log files to keep. |

## Development

1. **Clone the repo**: `git clone https://github.com/NikhilDhaliya/monilog-sdk.git`
2. **Install deps**: `npm install`
3. **Build**: `npm run build`
4. **Test**: `cd test-app && node app.js`

## License

Distributed under the ISC License. See `LICENSE` for more information.
