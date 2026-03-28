export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  error?: string;
  stack?: string;
}

export class LogService {
  private level: LogLevel;
  private enableRemote: boolean;
  private remoteUrl?: string;

  constructor(
    options: {
      level?: LogLevel;
      enableRemote?: boolean;
      remoteUrl?: string;
    } = {}
  ) {
    this.level = options.level ?? LogLevel.INFO;
    this.enableRemote = options.enableRemote ?? false;
    this.remoteUrl = options.remoteUrl;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, err?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: err?.message,
      stack: err?.stack,
    });
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>): void {
  if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context,
    };

    const output = JSON.stringify(entry);
    console.log(output);

    if (this.enableRemote && this.remoteUrl && level >= LogLevel.ERROR) {
      this.sendToRemote(entry);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.remoteUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new LogService();
