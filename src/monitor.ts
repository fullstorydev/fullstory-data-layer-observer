import { createEvent } from './event';
import { Logger, LogMessage, LogMessageType } from './utils/logger';
import { errorType, Telemetry } from './utils/telemetry';

/**
 * Monitor watches for property changes or function calls.
 */
export default abstract class Monitor {
  protected state: any;

  protected sources: Set<string> = new Set();

  /**
   * Creates a Monitor.
   * @param source from the rule monitoring the data layer
   * @param object containing the property or function to watch
   * @param property to watch (can hold a value or function)
   * @param path to the data layer object
   */
  constructor(source: string, protected object: any, protected property: string, protected path: string) {
    if (!object) {
      throw new Error(LogMessage.DataLayerMissing);
    } else {
      if (path.endsWith(property) && typeof object[property] !== 'function') {
        // this could be an error or just a poorly structured data layer object
        Logger.getInstance().warn(LogMessageType.MonitorDuplicateProp, { path, property });
      }

      this.copy();

      if (typeof object !== 'object' && typeof object[property] !== 'function') {
        throw new Error(Logger.format(LogMessage.UnsupportedType, typeof object));
      }

      if (typeof object[property] === 'function') {
        this.addFunctionMonitor();
      } else {
        this.addPropertyMonitor();
      }

      this.sources.add(source);
    }
  }

  /**
   * Registers a rule source to be notified when monitored data layer objects change
   * @param source from the rule monitoring the data layer
   */
  addSource(source: string) {
    this.sources.add(source);
  }

  /**
   * Shallow copies a property:value pair to allow referencing and calling "real" values.
   * @param property the property to clone and save
   */
  protected copy(): void {
    this.state = this.object[this.property];
  }

  /**
   * Broadcasts changes or function calls using `window.dispatchEvent`.
   * @param value the property changed or function arguments
   */
  protected emit(value: any) {
    try {
      this.sources.forEach((source) => {
        window.dispatchEvent(createEvent(source, this.object, this.property, value, this.path));
      });
    } catch (err) {
      Logger.getInstance().error(LogMessageType.MonitorEmitError,
        { path: this.path, property: this.property, reason: err.message });
      Telemetry.error(errorType.monitorEmitError);
    }
  }

  /**
   * Watches for changes on properties within an object.
   */
  abstract addPropertyMonitor(): void;

  /**
   * Watches for function calls.
   */
  abstract addFunctionMonitor(): void;

  /**
   * Stops watching for changes and function calls.
   */
  abstract remove(): void;
}
