import winston from 'winston';

/**
 * Log levels:
 * - error: Critical errors that need immediate attention
 * - warn: Warning messages for potentially harmful situations
 * - info: Informational messages about application flow
 * - debug: Detailed debugging information
 */

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const contextStr = context ? `[${context}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
  })
);

// Custom format for file output (JSON for easier parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return 'info';
  } else if (env === 'test') {
    return 'error'; // Quiet during tests
  }
  return 'debug'; // Verbose in development
};

// Create the Winston logger instance
const winstonLogger = winston.createLogger({
  levels: logLevels,
  level: getLogLevel(),
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport for errors (production only)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: fileFormat,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: fileFormat,
          }),
        ]
      : []),
  ],
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

/**
 * Logger interface with context support
 */
interface LoggerContext {
  context?: string;
  [key: string]: any;
}

/**
 * Enhanced logger with context support and structured logging
 */
export const logger = {
  /**
   * Log debug message (verbose, development only)
   */
  debug(message: string, meta?: LoggerContext): void {
    winstonLogger.debug(message, meta);
  },

  /**
   * Log info message (general application flow)
   */
  info(message: string, meta?: LoggerContext): void {
    winstonLogger.info(message, meta);
  },

  /**
   * Log warning message (potentially harmful situations)
   */
  warn(message: string, meta?: LoggerContext): void {
    winstonLogger.warn(message, meta);
  },

  /**
   * Log error message (critical errors)
   */
  error(message: string, meta?: LoggerContext): void {
    winstonLogger.error(message, meta);
  },

  /**
   * Create a child logger with a specific context
   * Useful for adding consistent context to all logs in a module
   * 
   * @example
   * const moduleLogger = logger.child('ExtractController');
   * moduleLogger.info('Processing started'); // Will include [ExtractController] in logs
   */
  child(context: string) {
    return {
      debug: (message: string, meta?: Record<string, any>) =>
        this.debug(message, { context, ...meta }),
      info: (message: string, meta?: Record<string, any>) =>
        this.info(message, { context, ...meta }),
      warn: (message: string, meta?: Record<string, any>) =>
        this.warn(message, { context, ...meta }),
      error: (message: string, meta?: Record<string, any>) =>
        this.error(message, { context, ...meta }),
    };
  },
};

// Export the Winston instance for advanced use cases
export const winstonInstance = winstonLogger;

// Export default for convenience
export default logger;
