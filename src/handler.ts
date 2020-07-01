import { Logger } from "./utils/logger";
import { Operator, OperatorOptions } from "./operator";
import { DataLayerEventType, DataLayerDetail, PropertyDetail } from "./event";
import { fromPath } from "./utils/object";

/**
 * DataLayerObserver is responsible for monitoring and handling changes to a datalayer.
 * While not responsible for detecting JavaScript object mutations or function calls,
 * the DataLayerObserver should provide higher order features that decide which events are valid
 * and provide methods to send these events to consumers such as FullStory.
 */
export class DataHandler {

  private operators: Operator<OperatorOptions>[] = [];

  readonly target: any;
  readonly property: string;

  debug = false;  // NOTE debugging is done at a rule level, which is why Logger is not used

  // external tooling can override the console debugger
  debugger = (message: string, data?: any, indent?: string) =>
    console.debug(data ? `${indent}${message}\n${indent}${JSON.stringify(data)}` : `${indent}${message}`);

  /**
   * Creates a DataHandler.
   * @param target the data layer (i.e. object) to observe
   * @param property the property or function to monitor
   */
  constructor(public readonly path: string, target?: any, property?: string) {
    // TODO (van) parse the path using the query syntax when it is completed
    this.target = !target ? fromPath(path)[0] : target;
    this.property = !property ? fromPath(path)[1] : property;

    // guards against trying to register an observer on a non-existent datalayer
    // this could happen if the data layer is dynamically loaded after DLO starts
    if (!this.target || !this.target[this.property]) {
      throw new Error(`Data layer ${path} not found on page`);
    }
  }

  /**
   * Manually emit the current value of the observed target property.
   * Emitting values only applies to properties and not functions.
   */
  fireEvent() {
    const type = typeof this.target[this.property];

    if (type === 'object') {
      this.handleEvent(new CustomEvent<DataLayerDetail>(DataLayerEventType.PROPERTY, {
        detail: new PropertyDetail(this.target, this.target[this.property], this.path)
      }));
    } else {
      Logger.getInstance().error(`Failed to fire ${this.path} (${type})`);
    }
  }

  /**
   * Handles the incoming event. This function implements EventListener to also support addEventListener()
   * browser APIs and Data Layer Observer events.
   * @param event a browser Event or CustomEvent emitted from the Data Layer Observer
   */
  handleEvent(event: Event | CustomEvent<DataLayerDetail>): void {
    // check if the incoming object is a CustomEvent from DLO
    if ((event as CustomEvent<DataLayerDetail>).detail) {
      const { detail } = (event as CustomEvent<DataLayerDetail>);

      // since window is the event dispatcher, always check that the target in the CustomEvent detail
      // matches the one expected by this DataHandler
      const { args, value, path } = detail;

      // check that this handler is registered to observe the emitted event based on path
      if (this.path === path) {
        if (value === undefined && args === undefined) {
          Logger.getInstance().warn(`${this.path} emitted no data`, this.path);
        } else {
          const data = value ? [value] : args ? args : [];
          this.handleData(data);
        }
      }
    } else {
      // TODO (van) add implementation when DOM event support is added
      throw Error('not implemented');
    }
  }

  /**
   * Sequentially process the list of operators.
   * @param data the data as an array of values emitted from the data layer
   */
  private handleData(data: any[] | null): any[] | null {
    this.runDebugger(`${this.path} handleData entry`, data);

    for (let i = 0; i < this.operators.length; i++) {
      const { name } = this.operators[i];

      try {
        // if the data is null, it is a signal to stop processing
        // this can happen if an upstream handler needed to prevent a downstream op like filtering use-cases
        if (data === null) {
          this.runDebugger(`[${i}] ${name} halted`, data, '  ');
          return null;
        } else {
          data = this.operators[i].handleData(data);
          this.runDebugger(`[${i}] ${name} output`, data, '  ');
        }
      } catch (err) {
        Logger.getInstance().error(`Operator ${name} failed for ${this.path} at step ${i}`, this.path);
        console.error(err.message);
        return null;
      }
    }

    this.runDebugger(`${this.path} handleData exit`, data);

    return data;
  }

  private runDebugger(message: string, data?: any, indent = '') {
    if (this.debug) {
      this.debugger(message, data, indent);
    }
  }

  /**
   * Adds an operator to the list. Operators will be sequentially passed data from the previous operator in the pipe.
   * @param operators Operator(s) to add
   */
  push(...operators: Operator<OperatorOptions>[]): void {
    operators.forEach(operator => this.operators.push(operator));
  }
}