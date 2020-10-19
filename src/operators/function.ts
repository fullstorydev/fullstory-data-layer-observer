import { Operator, OperatorOptions, OperatorValidator } from '../operator';
import { select } from '../selector';
import { getGlobal } from '../utils/object';

export interface FunctionOperatorOptions extends OperatorOptions {
  func: string | Function;
  thisArg?: string | object;
}

/**
 * FunctionOperator executes a function and returns the result.
 */
export class FunctionOperator implements Operator {
  static specification = {
    func: { required: true, type: ['string', 'function'] },
    thisArg: { required: false, type: ['string', 'object'] },
  };

  constructor(public options: FunctionOperatorOptions) {
    // sets this.options
  }

  handleData(data: any[]): any[] | null {
    const { func, thisArg } = this.options as FunctionOperatorOptions;

    let actualThisArg: object = getGlobal();

    if (thisArg) {
      switch (typeof thisArg) {
        case 'object':
          actualThisArg = thisArg;
          break;
        case 'string':
          actualThisArg = select(thisArg);
          break;
        default:
          throw new Error('Unsupported this context used');
      }
    }

    if (!actualThisArg) {
      throw new Error('No this context set');
    }

    let val = null;
    switch (typeof func) {
      case 'function':
        val = func.apply(actualThisArg, data);
        if (val === undefined || val === null) {
          return null; // aborts the handler
        }
        return [val];
      case 'string':
        val = select(func).apply(actualThisArg, data);
        if (val === undefined || val === null) {
          return null; // aborts the handler
        }
        return [val];
      default:
        // NOTE this will stop the handler
        return null;
    }
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(FunctionOperator.specification);
  }
}
