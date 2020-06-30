/**
 * A LogAppender simply serializes a LogEvent to a sink.
 */
export interface LogAppender {
  log(event: LogEvent): void;
}

/**
 * ConsoleAppender serializes LogEvents to the browser's console.
 */
class ConsoleAppender implements LogAppender {

  constructor() {

  }

  log(event: LogEvent) {
    const { datalayer, level, message } = event;

    // example 'Data layer unavailable (digitalData.user)'
    const consoleMessage = `${message}${datalayer ? ` (${datalayer})` : ''}`;

    switch (level) {
      case LogLevel.ERROR: return console.error(consoleMessage);
      case LogLevel.WARN: return console.warn(consoleMessage);
      case LogLevel.INFO: return console.info(consoleMessage);
      case LogLevel.DEBUG: return console.debug(consoleMessage);
    }
  }
}

/**
 * LogEvent defines a message to be sent to a sink for a given level.
 * Optionally, the datalayer (e.g. digitalData.user) that generated the message can be provided for traceability.
 */
export interface LogEvent {
  datalayer?: string;
  level: LogLevel;
  message: string;
}

export enum LogLevel {
  ERROR,
  WARN,
  INFO,
  DEBUG
}

/**
 * Logger provides a vendor agnostic way to assign and call a logging utility.
 * Custom logging utilities can be registered by assigning a LogAppender to `appender`.
 * Log levels can be controlled by updating `level`.
 */
export class Logger {

  private static instance: Logger;

  private constructor(public appender = new ConsoleAppender(), public level = 1) {

  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }

  /**
   * Serializes the event by calling the current appender.
   * If Logger.level is less than the event's level, no serialization occurs.
   * @param level the logging level of the event
   * @param message
   * @param datalayer
   */
  private log(level: LogLevel, message: string, datalayer?: string) {
    if (level <= this.level) {
      this.appender.log({
        level,
        message,
        datalayer
      });
    }
  }

  error(message: string, datalayer?: string) {
    this.log(LogLevel.ERROR, message, datalayer);
  }

  warn(message: string, datalayer?: string) {
    this.log(LogLevel.WARN, message, datalayer);
  }

  info(message: string, datalayer?: string) {
    this.log(LogLevel.INFO, message, datalayer);
  }

  debug(message: string, datalayer?: string) {
    this.log(LogLevel.DEBUG, message, datalayer);
  }
}