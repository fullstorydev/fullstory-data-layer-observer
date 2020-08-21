import Monitor from './monitor';
import { Logger } from './utils/logger';

/**
 * ShimMonitor watches for changes and function calls through a shim technique.
 */
export default class ShimMonitor extends Monitor {
  private configurable: boolean | undefined = true;

  private enumerable: boolean | undefined = true;

  private writable: boolean | undefined = true;

  addPropertyMonitor(target: any, property: string) {
    if (Object.isFrozen(target)) {
      throw new Error('Failed to monitor frozen object');
    }

    if (Object.isSealed(target)) {
      throw new Error('Failed to monitor sealed object');
    }

    const descriptor = Object.getOwnPropertyDescriptor(this.target, this.property);

    if (descriptor) {
      const { configurable, enumerable, writable } = descriptor;
      this.configurable = configurable;
      this.enumerable = enumerable;
      this.writable = writable;
    }

    // define a new property and default to a more malleable property if descriptor is undefined
    Object.defineProperty(target, property, {
      configurable: this.configurable,
      enumerable: this.enumerable,
      get: () => this.state,
      set: (value: any) => {
        this.state = value;
        this.emit(value);
      },
    });
  }

  remove() {
    try {
      Object.defineProperty(this.target, this.property, {
        enumerable: this.enumerable,
        configurable: this.configurable,
        value: this.state,
        writable: this.writable,
      });
    } catch (err) {
      Logger.getInstance().error(`Failed to remove listener on ${this.property}`, this.source);
    }
  }
}
