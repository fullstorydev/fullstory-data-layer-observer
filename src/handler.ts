import { Logger } from './utils/logger';
import { Operator } from './operator';
import { DataLayerDetail, createEventType } from './event';
import { select } from './selector';
import DataLayerTarget from './target';

/**
 * DataHandler listens for changes from lower level PropertyListeners. Events emitted from
 * PropertyListeners are inspected, and valid event data is transformed through a series of
 * registered operators.
 */
export default class DataHandler {
  static readonly debounceTime = 250;

  private listener: EventListener | null = null;

  private operators: Operator[] = [];

  private target: DataLayerTarget;

  private timeoutId: number | null = null;

  // external tooling can override the console debugger
  debugger = (message: string, data?: any, indent?: string) => console.debug(
    data ? `${indent}${message}\n${indent}${JSON.stringify(data)}` : `${indent}${message}`,
  );

  /**
   * Creates a DataHandler.
   * @param path the string path to the data layer (used to identify which data layer emitted data)
   * @param debug true optionally enables debugging data transformation (defaults to console.debug)
   * @throws will throw an error if the data layer is not found (i.e. undefined or null)
   */
  constructor(target: DataLayerTarget | string, public debug = false) {
    this.target = typeof target === 'string' ? new DataLayerTarget(target) : target;

    if (!this.target.subject) {
      throw new Error(`Data layer ${typeof target === 'string' ? target : target.path} not found on page`);
    }

    // begin handling data by listening for events
    this.start();
  }

  /**
   * Manually emit the current value of the observed target property.
   */
  fireEvent(value = this.target.value) {
    if (value) {
      this.handleData([value]);
    }
  }

  /**
   * Handles the incoming event. This function implements EventListener to support
   * addEventListener() browser APIs and Data Layer Observer events.
   * @param event a browser Event or CustomEvent emitted
   */
  handleEvent(event: CustomEvent<DataLayerDetail>): void {
    const { detail: { args, value }, type } = event;
    const { path, selector } = this.target;

    if (value === undefined && args === undefined) {
      Logger.getInstance().warn(`${path} emitted no data`, path);
    } else if (type === createEventType(path)) {
      if (value) {
        // debounce events so multiple, related property assignments don't create multiple events
        if (typeof this.timeoutId === 'number') {
          window.clearTimeout(this.timeoutId);
        }

        // NOTE even though a value change occurred, handleData expects the root data layer object
        // so select the source and send it to handle data
        const result: any = select(selector);

        // only handle data if the selector actually returns something with data
        if (result) {
          this.timeoutId = window.setTimeout(() => {
            this.handleData([result]);
          }, DataHandler.debounceTime);
        }
      } else {
        this.handleData(args || []);
      }
    } else {
      Logger.getInstance().warn(`EventListener received unexpected event ${type}`, path);
    }
  }

  /**
   * Sequentially process the list of operators.
   * @param data the data as an array of values emitted from the data layer
   */
  private handleData(data: any[] | null): any[] | null {
    this.timeoutId = null; // clear the timeout used for debouncing

    const { path } = this.target;

    this.runDebugger(`${path} handleData entry`, data);

    let handledData = data;

    for (let i = 0; i < this.operators.length; i += 1) {
      const { options: { name } } = this.operators[i];

      try {
        // if the data is null, it is a signal to stop processing
        // this can happen if an upstream handler needed to prevent a downstream operator
        if (handledData === null) {
          this.runDebugger(`[${i}] ${name} halted`, handledData, '  ');
          return null;
        }
        handledData = this.operators[i].handleData(handledData);

        let stats = ''; // debug stats (only compute if debug is enabled)
        if (this.debug && handledData !== null && handledData[0] !== null && typeof handledData[0] === 'object') {
          // the handler most often operates on the head so calculate this as a best estimate for each step
          const [head] = handledData;
          const keys = DataHandler.numProperties(head);
          const valueSz = DataHandler.sizeOfValues(head);
          const payloadSz = DataHandler.sizeOfPayload(head);

          stats = `(numKeys=${keys} sizeOfValues=${valueSz} sizeOfPayload=${payloadSz})`;
        }

        this.runDebugger(`[${i}] ${name} output ${stats}`, handledData, '  ');
      } catch (err) {
        Logger.getInstance().error(`Operator ${name} failed for ${path} at step ${i}`,
          path);
        console.error(err.message);
        return null;
      }
    }

    this.runDebugger(`${path} handleData exit`, handledData);

    return handledData;
  }

  /**
   * Calculate the size of a JSON.stringified object.
   * @param obj the object to stringify and calculate
   * @param stringBytes number of bytes for a string (defaults to UTF16 two bytes)
   */
  private static sizeOfPayload(obj: any, stringBytes = 2): number {
    return JSON.stringify(obj).length * stringBytes;
  }

  /**
   * Calculate the aggregate size of all values within an object.
   * @param obj the object with values to calculate
   * @param stringBytes number of bytes for a string (defaults to UTF16 two bytes)
   */
  private static sizeOfValues(obj: any, stringBytes = 2): number {
    let size = 0;

    if (typeof obj === 'object') {
      // eslint-disable-next-line no-restricted-syntax
      Object.getOwnPropertyNames(obj).forEach((prop) => {
        switch (typeof obj[prop]) {
          case 'object':
            if (obj[prop] != null && !Array.isArray(obj[prop])) {
              size += this.sizeOfValues(obj[prop]);
            }
            break;
          case 'string':
            size += (obj[prop] as string).length * stringBytes;
            break;
          case 'number':
            size += 8;
            break;
          case 'boolean':
            size += 2;
            break;
          default:
          // unsupported type
        }
      });
    }

    return size;
  }

  /**
   * Counts the number of properties in an object. Properties that have object values are not counted, but their
   * children are.
   * @param obj the object to count all properties
   */
  private static numProperties(obj: any): number {
    let count = 0;

    if (typeof obj === 'object') {
      Object.getOwnPropertyNames(obj).forEach((prop) => {
        if (typeof obj[prop] === 'object' && obj[prop] != null && !Array.isArray(obj[prop])) {
          count += this.numProperties(obj[prop]);
        } else {
          count += 1;
        }
      });
    }

    return count;
  }

  private runDebugger(message: string, data?: any, indent = '') {
    if (this.debug) {
      this.debugger(message, data, indent);
    }
  }

  /**
   * Adds an operator to the list. Operators will sequentially pass data to the next operator.
   * @param operators Operator(s) to add
   */
  push(...operators: Operator[]): void {
    operators.forEach((operator) => this.operators.push(operator));
  }

  /**
   * Starts listening for data layer changes or function calls.
   */
  start() {
    if (!this.listener) {
      this.listener = (e: Event) => this.handleEvent(e as CustomEvent);
      window.addEventListener(createEventType(this.target.path), this.listener);
    }
  }

  /**
   * Stops listening for data layer changes or function calls.
   */
  stop() {
    window.removeEventListener(createEventType(this.target.path), this.listener as EventListener);
    this.listener = null;
  }
}
