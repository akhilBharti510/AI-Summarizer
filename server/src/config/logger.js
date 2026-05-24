import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './env.js';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, ...rest }) => {
  const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
  return `${ts} ${level} ${stack || message}${meta}`;
});

// In production (Railway/Vercel-style platforms) the container filesystem is
// ephemeral and stdout is captured by the platform — file transports just waste
// disk and disappear on every redeploy. Local/dev keeps the rotating files for
// inspection.
const transports = [new winston.transports.Console()];
if (!env.isProd) {
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
  );
}

export const logger = winston.createLogger({
  level: env.isProd ? 'info' : 'debug',
  defaultMeta: { service: 'ai-summarizer-api' },
  format: combine(timestamp(), errors({ stack: true }), env.isProd ? json() : combine(colorize(), devFormat)),
  transports,
  exitOnError: false,
});

// Morgan stream
export const httpLogStream = {
  write: (message) => logger.http ? logger.http(message.trim()) : logger.info(message.trim()),
};
