import { getFS } from "./window";

export enum LogEventTypes {
  DATALAYER_NOT_FOUND = 'Data Layer Not Found',
  EMIT_FAILURE = 'Emit Failure',
  OPERATOR_FAILURE = 'Operator Failure',
  LISTENER_FAILURE = 'Listener Failure',
  RULE_FAILURE = 'Rule Failure',
  INCORRECT_ARGUMENTS = 'Incorrect Arguments',
  UNKNOWN_INPUT = 'Unknown Input',
}

interface LogEventPayload {
  datalayer_str?: string;
  message_str?: LogEventTypes | string;
  type_str: LogEventTypes;
}

/**
 * Logs classes of errors to FullStory as a Custom Event.
 * This mimics the "Custom event API error" filter.
 */
export class Logger {

  static readonly NAME = 'Data Layer Observer'; // the Custom Event name as seen in segment search
  static readonly SOURCE = 'dataLayerObserver';

  /**
   * Creates a FullStory custom event based on params passed to send().
   */
  static getLogEvent(type: LogEventTypes, message?: string, datalayerPath?: string): LogEventPayload {
    return {
      type_str: type,
      datalayer_str: datalayerPath,
      message_str: message,
    };
  }

  /**
   * Sends a log event to FullStory as a Custom Event. If FullStory is not loaded, the console will be logged.
   * @param type a predefined type of log event
   * @param message an optional message from an Error for example
   * @param datalayerPath the datalayer property that triggered the log (e.g. digitalData.user.profile)
   */
  static send(type: LogEventTypes, message?: string, datalayerPath?: string) {
    const FS = getFS();

    if (FS) {
      FS.event(Logger.NAME, this.getLogEvent(type, message, datalayerPath), Logger.SOURCE);
    } else {
      // fall back to the console
      console.log(`${type} ${message} ${datalayerPath}`);
    }
  }
}