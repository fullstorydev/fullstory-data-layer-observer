import {
  DataLayerDetail, PropertyDetail, FunctionDetail, createEventType,
} from './event';
import { Logger } from './utils/logger';

/**
 * Monitor watches for property changes or function calls.
 */
export default abstract class Monitor {
  protected state: any;

  /**
   * Creates a Monitor.
   * @param target object containing the property or function to watch
   * @param property to watch (can hold a value or function)
   * @param path to the data layer object
   */
  constructor(protected target: any, protected property: string, protected path: string) {
    if (!target) {
      throw new Error('Monitor could not find target');
    } else {
      if (path.endsWith(property)) {
        // this could be an error or just a poorly structured data layer object
        Logger.getInstance().warn(`Monitor path appears to include property ${property}`, path);
      }

      this.copy();

      switch (typeof target) {
        case 'object':
          this.addPropertyMonitor(target, property);
          break;
        case 'function':
          // TODO
          break;
        default:
          throw new Error(`Monitor can not be added to unsupported type ${typeof this.target}`);
      }
    }
  }

  /**
   * Shallow copies a property:value pair to allow referencing and calling "real" values.
   * @param property the property to clone and save
   */
  protected copy(): void {
    this.state = this.target[this.property];
  }

  /**
   * Builds a CustomEvent's `detail` used to broadcast changes.
   * @param value the property changed or function arguments
   */
  private createDetail(value: any): DataLayerDetail {
    return typeof this.target === 'function' ? new FunctionDetail(this.path, this.property, value)
      : new PropertyDetail(this.path, this.property, value);
  }

  /**
   * Broadcasts changes or function calls using `window.dispatchEvent`.
   * @param value the property changed or function arguments
   */
  protected emit(value: any) {
    // TODO (van) emit would be a good place to put a debounce feature
    try {
      window.dispatchEvent(new CustomEvent<DataLayerDetail>(createEventType(this.path),
        { detail: this.createDetail(value) }));
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
