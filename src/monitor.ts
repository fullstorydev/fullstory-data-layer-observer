import { createEvent } from './event';
import { Logger } from './utils/logger';

/**
 * Monitor watches for property changes or function calls.
 */
export default abstract class Monitor {
  protected state: any;

  /**
   * Creates a Monitor.
   * @param object containing the property or function to watch
   * @param property to watch (can hold a value or function)
   * @param path to the data layer object
   */
  constructor(protected object: any, protected property: string, protected path: string) {
    if (!object) {
      throw new Error('Monitor could not find target');
    } else {
      if (path.endsWith(property)) {
        // this could be an error or just a poorly structured data layer object
        Logger.getInstance().warn(`Monitor path appears to include property ${property}`, path);
      }

      this.copy();

      switch (typeof object) {
        case 'object':
          this.addPropertyMonitor(object, property);
          break;
        case 'function':
          // TODO
          break;
        default:
          throw new Error(`Monitor can not be added to unsupported type ${typeof this.object}`);
      }
    }
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
      window.dispatchEvent(createEvent(this.object, this.property, value, this.path));
    } catch (err) {
      Logger.getInstance().error(`Failed to broadcast change for ${this.property}`, this.path);
    }
  }

  /**
   * Watches for changes on properties within an object.
   * @param target the object containing the property
   * @param property the property to watch
   */
  abstract addPropertyMonitor(target: any, property: string): void;

  /**
   * Stops watching for changes and function calls.
   */
  abstract remove(): void;
}
