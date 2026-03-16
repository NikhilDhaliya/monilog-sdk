import fs from 'fs';
import path from 'path';
import { sendSlackNotification } from './slack.js';

interface MonitorOptions {
    slackWebhookUrl?: string;
    logFilePath?: string;
    monitorStatusCodes?: number[]; // Specific status codes to monitor
    maxLogSize?: number; // Max size in bytes (default 5MB)
    maxFiles?: number; // Max number of rotated files to keep (default 2)
}

export function monitor(options: MonitorOptions = {}) {
    const logFilePath = options.logFilePath || path.join(process.cwd(), 'logs.txt');
    const slackWebhookUrl = options.slackWebhookUrl;
    const monitorStatusCodes = options.monitorStatusCodes || [];

    const maxLogSize = options.maxLogSize || 5 * 1024 * 1024; // 5MB default
    const maxFiles = options.maxFiles || 2;

    const rotateLogs = (filePath: string) => {
        try {
            if (!fs.existsSync(filePath)) return;
            const stats = fs.statSync(filePath);
            if (stats.size < maxLogSize) return;

            // Rotate existing files
            for (let i = maxFiles - 1; i >= 1; i--) {
                const oldFile = `${filePath}.${i}`;
                const newFile = `${filePath}.${i + 1}`;
                if (fs.existsSync(oldFile)) {
                    if (i + 1 > maxFiles) {
                        fs.unlinkSync(oldFile);
                    } else {
                        fs.renameSync(oldFile, newFile);
                    }
                }
            }

            // Rename current file to .1
            if (maxFiles > 0) {
                fs.renameSync(filePath, `${filePath}.1`);
            } else {
                fs.unlinkSync(filePath);
            }
        } catch (err: any) {
            console.error('[monilog-sdk] Log rotation failed:', err.message);
        }
    };

    return (req: any, res: any, next: any) => {
        const start = Date.now();

        // Capture the original end function
        const originalEnd = res.end;

        res.end = function (chunk: any, encoding: any) {
            const duration = Date.now() - start;
            const logEntry = {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.originalUrl || req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                // Robust IP detection for Express 4/5
                ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
            };

            const logString = JSON.stringify(logEntry) + '\n';

            //  Check for rotation and then Append to logs file
            try {
                const logDir = path.dirname(logFilePath);
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                rotateLogs(logFilePath);
                fs.appendFileSync(logFilePath, logString);
            } catch (err: any) {
                console.error('[monilog-sdk] Error writing to log file:', err.message);
            }

            //  Check for 400s, 500s or specific status codes
            const isError = res.statusCode >= 400 && res.statusCode < 600;
            const isMonitored = Array.isArray(monitorStatusCodes) && monitorStatusCodes.includes(res.statusCode);

            if (isError || isMonitored) {
                if (slackWebhookUrl) {
                    sendSlackNotification(slackWebhookUrl, {
                        title: `Monitor Alert: ${res.statusCode}`,
                        ...logEntry
                    });
                } else {
                    console.warn('[monilog-sdk] Alert triggered but no slackWebhookUrl provided.');
                }
            }

            // Call the original end function
            originalEnd.apply(res, arguments);
        };

        next();
    };
}
