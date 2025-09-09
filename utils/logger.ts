// Conditional logger that works in both Node.js and client environments
interface Logger {
  info: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  trace: (message: any, ...args: any[]) => void;
}

// Check if we're in a Node.js environment
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

let logger: Logger;

if (isNodeEnvironment) {
  // Server-side: Use pino
  try {
    const pino = require('pino');
    logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      formatters: {
        level(label: string) {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  } catch (error) {
    // Fallback to console if pino fails to load
    logger = {
      info: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      debug: console.log.bind(console),
      trace: console.log.bind(console),
    };
  }
} else {
  // Client-side: Use console-based logger
  const logLevel = 'info'; // Default log level for client
  const shouldLog = (level: string) => {
    const levels = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };
    return levels[level as keyof typeof levels] >= levels[logLevel as keyof typeof levels];
  };

  logger = {
    info: shouldLog('info') ? console.log.bind(console, '[INFO]') : () => {},
    error: shouldLog('error') ? console.error.bind(console, '[ERROR]') : () => {},
    warn: shouldLog('warn') ? console.warn.bind(console, '[WARN]') : () => {},
    debug: shouldLog('debug') ? console.log.bind(console, '[DEBUG]') : () => {},
    trace: shouldLog('trace') ? console.log.bind(console, '[TRACE]') : () => {},
  };
}

export { logger };