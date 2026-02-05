/**
 * Production-ready logging utility for TaskFlow
 * Provides structured logging with levels, context, and optional remote sending
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Environment check
const isDevelopment = process.env.NODE_ENV === "development";
const isServer = typeof window === "undefined";

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level (can be configured via env)
const MIN_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? "debug" : "info");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ];

  if (entry.context) {
    const contextParts: string[] = [];
    if (entry.context.userId) contextParts.push(`user=${entry.context.userId}`);
    if (entry.context.action) contextParts.push(`action=${entry.context.action}`);
    if (entry.context.resource) contextParts.push(`resource=${entry.context.resource}`);
    if (entry.context.resourceId) contextParts.push(`id=${entry.context.resourceId}`);
    if (entry.context.duration !== undefined) contextParts.push(`duration=${entry.context.duration}ms`);
    if (contextParts.length > 0) {
      parts.push(`| ${contextParts.join(" ")}`);
    }
  }

  return parts.join(" ");
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: isDevelopment ? error.stack : undefined,
        }
      : undefined,
  };
}

function outputLog(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const formatted = formatLogEntry(entry);

  // Console output with appropriate method
  switch (entry.level) {
    case "debug":
      console.debug(formatted, entry.context?.metadata || "");
      break;
    case "info":
      console.info(formatted, entry.context?.metadata || "");
      break;
    case "warn":
      console.warn(formatted, entry.context?.metadata || "");
      break;
    case "error":
      console.error(formatted, entry.error || "", entry.context?.metadata || "");
      break;
  }

  // In production, you could send to external logging service
  // Example: sendToLoggingService(entry);
}

// Optional: Send to external logging service
// async function sendToLoggingService(entry: LogEntry): Promise<void> {
//   if (isDevelopment) return;
//   try {
//     await fetch("/api/logs", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(entry),
//     });
//   } catch {
//     // Silently fail - don't create infinite logging loops
//   }
// }

/**
 * Main logger object with level-specific methods
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    const entry = createLogEntry("debug", message, context);
    outputLog(entry);
  },

  info(message: string, context?: LogContext): void {
    const entry = createLogEntry("info", message, context);
    outputLog(entry);
  },

  warn(message: string, context?: LogContext): void {
    const entry = createLogEntry("warn", message, context);
    outputLog(entry);
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const entry = createLogEntry("error", message, context, err);
    outputLog(entry);
  },

  /**
   * Log a server action execution
   */
  action(
    name: string,
    status: "start" | "success" | "error",
    context?: LogContext & { error?: Error }
  ): void {
    const message = `Action ${name} ${status}`;
    const level: LogLevel = status === "error" ? "error" : "info";
    const entry = createLogEntry(level, message, { ...context, action: name }, context?.error);
    outputLog(entry);
  },

  /**
   * Create a child logger with preset context
   */
  withContext(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...baseContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        logger.error(message, error, { ...baseContext, ...context }),
    };
  },

  /**
   * Measure execution time of an async function
   */
  async timed<T>(
    name: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      logger.info(`${name} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      logger.error(`${name} failed`, error, { ...context, duration });
      throw error;
    }
  },
};

/**
 * Helper to safely extract error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

/**
 * Helper to create safe error responses for client
 */
export function createErrorResponse(error: unknown, includeDetails = isDevelopment) {
  const message = getErrorMessage(error);
  return {
    success: false,
    error: message,
    ...(includeDetails && error instanceof Error
      ? { details: error.stack }
      : {}),
  };
}

export default logger;
