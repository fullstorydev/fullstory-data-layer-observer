import Monitor from './monitor';
import { Logger } from './utils/logger';

/**
 * ShimMonitor watches for changes and function calls through a shim technique.
 */
export default class ShimMonitor extends Monitor {
  addPropertyMonitor(target: any, property: string) {
    Object.defineProperty(target, property, {
      enumerable: true,
      get: () => this.state,
      set: (value: any) => {
        this.state = value;
        this.emit(value);
      },
    });
  }

  remove() {
    try {
      // remove the getter/setter if it's a property monitor
      if (typeof this.target[this.property] !== 'function') {
        delete this.target[this.property].get;
        delete this.target[this.property].set;
      } else {
        this.target[this.property] = this.state;
      }
    } catch (err) {
      Logger.getInstance().error(`Failed to remove listener on ${this.property}`, this.source);
    }
  }
}
