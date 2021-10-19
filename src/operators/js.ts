import { Operator, OperatorOptions, safeUpdate } from '../operator';

export interface JsOperatorOptions extends OperatorOptions {
  index?: number;
  inputProperties?: string | string[];
  function: string;
  args: any[];
  outputProperty: string;
}

export class JsOperator implements Operator {
  public options: JsOperatorOptions

  constructor(options: JsOperatorOptions) {
    this.options = options;
  }

  handleData(data: any[]): any[] | null {
    const index = this.options.index || 0;
    const datum = data[index];
    let thisArg: any | any[];

    if (!this.options.inputProperties) {
      if (Array.isArray(datum)) {
        thisArg = datum;
      } else {
        [thisArg] = Object.values(datum);
      }
    } else if (Array.isArray(this.options.inputProperties)) {
      thisArg = this.options.inputProperties.map((prop) => (datum[prop]));
    } else {
      thisArg = datum[this.options.inputProperties];
    }

    if (typeof thisArg[this.options.function] !== 'function') {
      throw new Error(`Object type '${typeof thisArg}'' doesn't support function '${this.options.function}'`);
    }

    const result = thisArg[this.options.function](...this.options.args);
    const patched = { ...data[index] };
    patched[this.options.outputProperty] = result;
    return safeUpdate(data, index, patched);
  }

  validate(): void {
    // ToDo (nate): How meaningful of a validate function will we be able to implement?
    console.debug(this);
  }
}
