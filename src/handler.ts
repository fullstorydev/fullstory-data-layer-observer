import { Logger } from './utils/logger';
import { Operator } from './operator';
import { DataLayerEventType, DataLayerDetail, PropertyDetail } from './event';
import { select } from './selector';

/**
 * DataHandler listens for changes from lower level PropertyListeners. Events emitted from
 * PropertyListeners are inspected, and valid event data is transformed through a series of
 * registered operators.
 */
export default class DataHandler {
  private operators: Operator[] = [];

  readonly target: any;

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
  constructor(private readonly path: string, public debug = false) {
    this.target = select(path);

    // guards against trying to register an observer on a non-existent datalayer
    // this could happen if the data layer is dynamically loaded after DLO starts
    if (!this.target) {
      throw new Error(`Data layer ${path} not found on page`);
    }
  }

  /**
   * Manually emit the current value of the observed target property.
   * @throws will throw an error if the target's property is not an object
   */
  fireEvent() {
    const value = select(this.path);
    const type = typeof value;

    if (type === 'object') {
      this.handleEvent(new CustomEvent<DataLayerDetail>(DataLayerEventType.PROPERTY, {
        detail: new PropertyDetail(this.target, value, this.path),
      }));
    } else {
      throw new Error(`${this.path} (${type}) is not a supported type`);
    }
  }

  /**
   * Handles the incoming event. This function implements EventListener to also support
   * addEventListener() browser APIs and Data Layer Observer events.
   * @param event a browser Event or CustomEvent emitted
   */
  handleEvent(event: CustomEvent<DataLayerDetail>): void {
    const { detail: { args, value, path }, type } = event;

    // since window is the event dispatcher, use the path in DataLayerDetail to decide if this
    // DataHandler should process the data
    if (this.path === path) {
      if (value === undefined && args === undefined) {
        Logger.getInstance().warn(`${this.path} emitted no data`, this.path);
      } else {
        switch (type) {
          case DataLayerEventType.PROPERTY:
            this.handleData([value]);
            break;
          case DataLayerEventType.FUNCTION:
            this.handleData(args || []);
            break;
          default:
            Logger.getInstance().warn(`Unknown event type ${type}`);
        }
      }
    }
  }

  /**
   * Sequentially process the list of operators.
   * @param data the data as an array of values emitted from the data layer
   */
  private handleData(data: any[] | null): any[] | null {
    this.runDebugger(`${this.path} handleData entry`, data);

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
        Logger.getInstance().error(`Operator ${name} failed for ${this.path} at step ${i}`,
          this.path);
        console.error(err.message);
        return null;
      }
    }

    this.runDebugger(`${this.path} handleData exit`, handledData);

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
}
