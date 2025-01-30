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
  DEBUG,
}

export enum LogMessageType {
  EventEmpty = 'Empty Event',
  EventUnexpected = 'Unexpected Event',
  MonitorCallError = 'Monitor Call Error',
  MonitorCreateError = 'Monitor Creation Error',
  MonitorDuplicateProp = 'Monitor Duplicate Property',
  MonitorEmitError = 'Monitor Emit Error',
  MonitorRemoveError = 'Monitor Removal Error',
  OperatorError = 'Operator Error',
  ObserverMultipleLoad = 'Duplicate Observer',
  ObserverReadError = 'Read Error',
  ObserverRulesNone = 'No Rules Defined',
  RuleInvalid = 'Invalid Rule',
  RuleRegistrationError = 'Rule Registration Error',
  ObserverInitializationError = 'Observer Initialization Error',
}

export enum LogMessage {
  DataLayerMissing = 'Data layer not found',
  DuplicateValue = 'Value $0 already used',
  DuplicateDestination = 'Only one of destination or fsApi can be defined',
  MissingDestination = 'destination or fsApi must be defined',
  ShimFail = 'Shim not allowed because object is $0',
  SelectorInvalidIndex = 'Selector index $0 is not a number in $1',
  SelectorIncorrectTokenCount = 'Selector has incorrect number ($0) of tokens in $1',
  SelectorMalformed = 'Selector $0 is malformed',
  SelectorMissingToken = 'Selector is missing $0 in $1',
  SelectorNoProps = 'Selector is missing properties',
  SelectorSyntaxUnsupported = 'Selector syntax $0 is unsupported',
  TargetSubjectObject = 'Target subject must be an object',
  TargetPropertyMissing = 'Target property is missing',
  TargetPathMissing = 'Target path is missing',
  UnknownValue = 'Unknown value $0',
  UnsupportedFsApi = 'Unsupported fsApi $0',
  UnsupportedType = 'Unsupported type $0',
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
  static readonly debounceTime = 250;

  private prevEvent?: LogEvent;

  private timeoutId: number | null = null;

  /* eslint-disable class-methods-use-this */
  log(event: LogEvent): void {
    const fs = (window as any)[(window as any)._fs_namespace]; // eslint-disable-line no-underscore-dangle

    const customEventName = 'Data Layer Observer';
    const customEventSource = 'dlo-log';

    if (fs) {
      /* eslint-disable camelcase */
      const { context, level: level_int, message } = event;

      const customEventPayload = context ? { level_int, message, context } : { level_int, message };

      if (this.isDuplicate(event)) {
        // begin debouncing log events so multiple instances don't cause rate limiting issue
        if (typeof this.timeoutId === 'number') {
          window.clearTimeout(this.timeoutId);
        }

        this.timeoutId = window.setTimeout(() => {
          this.timeoutId = null;
          fs.event(customEventName, customEventPayload, customEventSource);
        }, FullStoryAppender.debounceTime);
      } else {
        fs.event(customEventName, customEventPayload, customEventSource);
      }

      this.prevEvent = event;
    }
  }

  /**
   * Checks if a LogEvent is a duplicate of the previous LogEvent.
   * This checks the message, source, and reason.  All 3 need to match to be considered a
   * duplicate.
   * @param event to compare against the last LogEvent
   */
  private isDuplicate(event: LogEvent) {
    const { context, message } = event;

    if (!this.prevEvent || !context || !this.prevEvent.context) {
      return false;
    }

    const { source, reason } = context;
    const { message: prevMessage, context: { source: prevSource, reason: prevReason } } = this.prevEvent;

    return message === prevMessage && source === prevSource && reason === prevReason;
  }
}

/**
 * LogContext provides context for debugging and understanding log error messages.
 */
export interface LogContext {
  rule?: string;
  source?: string;
  operator?: string;
  path?: string;
  property?: string;
  selector?: string;
  reason?: string;
  numericValue?: number;
}

/**
 * LogEvent defines a message to be sent to a sink for a given level.
 */
export interface LogEvent {
  context?: LogContext;
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

  static format(message: string, ...substitutions: string[]) {
    let formatted = message;

    for (let i = 0; i < substitutions.length; i += 1) {
      formatted = formatted.replace(`$${i}`, substitutions[i]);
    }

    return formatted.trim();
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
  private log(level: LogLevel, message: string, context?: LogContext) {
    if (level <= this.level) {
      this.appender.log({
        level,
        message,
        context,
      });
    }
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }
}
