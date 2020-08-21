import {
  DataLayerEventType, DataLayerDetail, PropertyDetail, FunctionDetail,
} from './event';
import { Logger } from './utils/logger';

/**
 * Monitor watches for property changes or function calls.
 */
export default abstract class Monitor {
  protected state: any;

  readonly type: DataLayerEventType;

  /**
   * Creates a Monitor.
   * @param target the object containing the property to watch or function
   * @param property the property to watch (can hold a value or function)
   * @param source the source (e.g. selector) used to disambiguate who fired the event
   */
  constructor(protected target: any, protected property: string, protected source: string) {
    if (!this.target) {
      throw new Error('Monitor could not find target');
    } else {
      this.copy();

      switch (typeof this.target) {
        case 'object':
          this.type = DataLayerEventType.PROPERTY;
          this.addPropertyMonitor(target, property);
          break;
        case 'function':
          this.type = DataLayerEventType.FUNCTION;
          // TODO
          break;
        default:
          throw new Error(`Monitor has unsupported type ${typeof this.target}`);
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
    switch (this.type) {
      case DataLayerEventType.PROPERTY:
        return new PropertyDetail(this.target, value, this.source);
      case DataLayerEventType.FUNCTION:
        return new FunctionDetail(this.target, value, this.source);
      default:
        throw new Error(`Unknown event type ${this.type}`);
    }
  }

  /**
   * Broadcasts changes or function calls using `window.dispatchEvent`.
   * @param value the property changed or function arguments
   */
  protected emit(value: any) {
    try {
      window.dispatchEvent(new CustomEvent<DataLayerDetail>(this.type, { detail: this.createDetail(value) }));
    } catch (err) {
      Logger.getInstance().error(`Failed to broadcast change for ${this.property}`, this.source);
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
