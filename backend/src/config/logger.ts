/**
 * Logger Configuration
 *
 * Winston logger setup with console and file transports.
 * Provides structured logging with timestamps and metadata.
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  // Include error stack trace if present
  if (metadata.stack) {
    msg += `\n${metadata.stack}`;
  }

  // Include additional metadata if present
  const metaStr =
    Object.keys(metadata).filter((key) => key !== 'stack').length > 0
      ? `\n${JSON.stringify(metadata, null, 2)}`
      : '';

  return msg + metaStr;
});

// Determine log level from environment variable
const logLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
  exitOnError: false,
});

// In production, also log to files
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

export default logger;
