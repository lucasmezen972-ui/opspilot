interface Logger {
  info: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  trace: (message: any, ...args: any[]) => void;
}

const isNodeEnvironment =
  typeof process !== 'undefined' && process.versions?.node;

function createLogger(): Logger {
  const logLevel = isNodeEnvironment
    ? (process.env.LOG_LEVEL ?? 'warn')
    : typeof __DEV__ !== 'undefined' && __DEV__
      ? 'debug'
      : 'warn';

  const levels = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };
  const threshold = levels[logLevel as keyof typeof levels] ?? levels.warn;
  const shouldLog = (level: keyof typeof levels) => levels[level] >= threshold;
  const usePrefix = !isNodeEnvironment;

  return {
    info: shouldLog('info')
      ? usePrefix
        ? console.log.bind(console, '[INFO]')
        : console.log.bind(console)
      : () => {},
    error: shouldLog('error')
      ? usePrefix
        ? console.error.bind(console, '[ERROR]')
        : console.error.bind(console)
      : () => {},
    warn: shouldLog('warn')
      ? usePrefix
        ? console.warn.bind(console, '[WARN]')
        : console.warn.bind(console)
      : () => {},
    debug: shouldLog('debug')
      ? usePrefix
        ? console.log.bind(console, '[DEBUG]')
        : console.log.bind(console)
      : () => {},
    trace: shouldLog('trace')
      ? usePrefix
        ? console.log.bind(console, '[TRACE]')
        : console.log.bind(console)
      : () => {},
  };
}

export const logger: Logger = createLogger();
