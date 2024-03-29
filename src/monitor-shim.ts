import Monitor from './monitor';
import { Logger, LogMessage, LogMessageType } from './utils/logger';
import { Telemetry, errorType } from './utils/telemetry';

/**
 * ShimMonitor watches for changes and function calls through a shim technique.
 */
export default class ShimMonitor extends Monitor {
  private configurable: boolean | undefined = true;

  private enumerable: boolean | undefined = true;

  private writable: boolean | undefined = true;

  /**
   * Checks if a shim is allowed and if not throws an Error.
   * @param object to be checked
   */
  static checkShimAllowed(object: any) {
    if (Object.isFrozen(object)) {
      throw new Error(Logger.format(LogMessage.ShimFail, 'frozen'));
    }

    if (Object.isSealed(object)) {
      throw new Error(Logger.format(LogMessage.ShimFail, 'sealed'));
    }
  }

  addPropertyMonitor() {
    ShimMonitor.checkShimAllowed(this.object);

    const descriptor = Object.getOwnPropertyDescriptor(this.object, this.property);

    if (descriptor) {
      const { configurable, enumerable, writable } = descriptor;
      this.configurable = configurable;
      this.enumerable = enumerable;
      this.writable = writable;
    }

    // define a new property and default to a more malleable property if descriptor is undefined
    Object.defineProperty(this.object, this.property, {
      configurable: this.configurable,
      enumerable: this.enumerable,
      get: () => this.state,
      set: (value: any) => {
        // checks if the incoming value matches the existing value
        const hasChanged = this.state !== value;

        this.state = value;

        // object-based data layers will often re-assign the same value, which causes over emitting
        if (hasChanged) {
          this.emit(value);
        }
      },
    });
  }

  remove() {
    try {
      Object.defineProperty(this.object, this.property, {
        enumerable: this.enumerable,
        configurable: this.configurable,
        value: this.state,
        writable: this.writable,
      });

      this.sources.clear();
    } catch (err) {
      Logger.getInstance().error(LogMessageType.MonitorRemoveError,
        { path: this.path, property: this.property, reason: err.message });
      Telemetry.error(errorType.monitorRemovalError);
    }
  }

  addFunctionMonitor() {
    ShimMonitor.checkShimAllowed(this.object);

    this.object[this.property] = (...args: any[]): any => {
      try {
        this.emit(args); // Must never throw an error (see try/catch in `Monitor.emit`)
        return this.state.apply(this.object, args);
      } catch (err) {
        Logger.getInstance().error(LogMessageType.MonitorCallError,
          { path: this.property, property: this.property, reason: err.message });
        Telemetry.error(errorType.monitorCallError);
        return null;
      }
    };
  }
}
