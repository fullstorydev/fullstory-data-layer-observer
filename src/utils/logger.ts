/* eslint-disable no-console, max-classes-per-file */

/**
 * A LogAppender simply serializes a LogEvent to a sink.
 */
export interface LogAppender {
  log(event: LogEvent): void;
}

export enum LogLevel {
  ERROR,
  WARN,
  INFO,
  DEBUG
}

/**
 * ConsoleAppender serializes LogEvents to the browser's console.
 */
export class ConsoleAppender implements LogAppender {
  /* eslint-disable class-methods-use-this */
  log(event: LogEvent): void {
    const { context, level, message } = event;

    // example 'Data layer unavailable { selector: "digitalData.user"}'
    const consoleMessage = `${message}${context ? ` ${JSON.stringify(context)}` : ''}`;

    switch (level) {
      case LogLevel.ERROR: return console.error(consoleMessage);
      case LogLevel.WARN: return console.warn(consoleMessage);
      case LogLevel.INFO: return console.info(consoleMessage);
      case LogLevel.DEBUG:
      default:
        return console.debug(consoleMessage);
    }
  }
}

/**
 * FullStoryAppender serializes LogEvents to FullStory using FS.event.
 */
export class FullStoryAppender implements LogAppender {
  /* eslint-disable class-methods-use-this */
  log(event: LogEvent): void {
    const fs = (window as any)[(window as any)._fs_namespace]; // eslint-disable-line no-underscore-dangle

    const customEventName = 'Data Layer Observer';
    const customEventSource = 'dlo';

    if (fs) {
      /* eslint-disable camelcase */
      const { context, level: level_int, message } = event;
      if (context) {
        fs.event(customEventName, { level_int, message, context }, customEventSource);
      } else {
        fs.event(customEventName, { level_int, message }, customEventSource);
      }
    }
  }
}

/**
 * LogContext provides context for debugging and understanding log error messages.
 */
export interface LogContext {
  rule?: string;
  source?: string;
  path?: string;
  selector?: string;
  reason?: string;
}

/**
 * LogEvent defines a message to be sent to a sink for a given level.
 */
export interface LogEvent {
  context?: string | LogContext;
  level: LogLevel;
  message: string;
}

/**
 * Logger provides a vendor agnostic way to assign and call a logging utility.
 * Custom logging utilities can be registered by assigning a LogAppender to `appender`.
 * Log levels can be controlled by updating `level`.
 */
export class Logger {
  private static instance: Logger;

  appender: LogAppender;

  level = 1;

  constructor(appender = 'console') {
    switch (appender) {
      case 'fullstory':
        this.appender = new FullStoryAppender();
        break;
      case 'console':
      default:
        this.appender = new ConsoleAppender();
    }
  }

  static getInstance(appender?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(appender);
    }

    return Logger.instance;
  }

  /**
   * Serializes the event by calling the current appender.
   * If Logger.level is less than the event's level, no serialization occurs.
   * @param level the logging level of the event
   * @param message the informational message
   * @param context provides additional metadata related to the log event
   */
  private log(level: LogLevel, message: string, context?: string | LogContext) {
    if (level <= this.level) {
      this.appender.log({
        level,
        message,
        context,
      });
    }
  }

  error(message: string, data?: string | LogContext) {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: string | LogContext) {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: string | LogContext) {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: string | LogContext) {
    this.log(LogLevel.DEBUG, message, data);
  }
}
