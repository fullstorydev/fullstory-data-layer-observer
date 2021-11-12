import Monitor from './monitor';
import ShimMonitor from './monitor-shim';
import { startsWith } from './utils/object';

/**
 * Because only a single Monitor can exist on an object's property and various DataHandlers
 * may be interested, MonitorFactory controls creation and removal of Monitors.
 */
export default class MonitorFactory {
  private static instance: MonitorFactory;

  private monitors: { [path: string]: Monitor } = {};

  private constructor() {
    // keeps constructor private
  }

  static getInstance(): MonitorFactory {
    if (!MonitorFactory.instance) {
      MonitorFactory.instance = new MonitorFactory();
    }

    return MonitorFactory.instance;
  }

  /**
   * Creates a Monitor. If a Monitor has already been created, it will be returned.
   * @param object that applies to the Monitor
   * @param property in the object to Monitor
   * @param path describing the object
   */
  create(object: Object, property: string, path: string): Monitor {
    const key = typeof (object as any)[property] === 'function' ? path : `${path}.${property}`;

    if (!this.monitors[key]) {
      const propDescriptor = Object.getOwnPropertyDescriptor(object, property) || null;
      // functions have no property descriptors but properties need to be configurable (e.g. Array.length is not)
      if (propDescriptor === null || propDescriptor.configurable) {
        this.monitors[key] = new ShimMonitor(object, property, path);
      }
    }

    return this.monitors[key];
  }

  /**
   * Removes a Monitor.
   * @param path identifying the Monitor to be removed
   * @param fuzzy when true removes all Monitors that start with the path
   */
  remove(path: string, fuzzy = false) {
    const paths = fuzzy ? Object.getOwnPropertyNames(this.monitors).filter((key) => startsWith(key, path)) : [path];

    paths.forEach((monitorPath) => {
      const monitor = this.monitors[monitorPath];

      if (monitor) {
        monitor.remove();
        delete this.monitors[monitorPath];
      }
    });
  }
}
