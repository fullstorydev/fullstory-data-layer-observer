import { Operator, OperatorOptions, OperatorValidationError } from '../operator';
import { select } from '../selector';

export interface FunctionOperatorOptions extends OperatorOptions {
  func: string | Function;
  thisArg?: string | object;
}

/**
 * FunctionOperator executes a function and returns the result.
 */
export class FunctionOperator extends Operator {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(options: FunctionOperatorOptions) {
    super(options);
  }

  handleData(data: any[]): any[] | null {
    const { func, thisArg } = this.options as FunctionOperatorOptions;

    let actualThisArg: object = globalThis;

    if (thisArg) {
      switch (typeof thisArg) {
        case 'object':
          actualThisArg = thisArg;
          break;
        case 'string':
          actualThisArg = select(thisArg);
          break;
        default:
          super.throwValidationError('thisArg', OperatorValidationError.UNSUPPORTED);
      }
    }

    switch (typeof func) {
      case 'function':
        return [func.apply(actualThisArg, data)];
      case 'string':
        return select(func).apply(actualThisArg, data);
      default:
        // NOTE this will stop the handler
        return null;
    }
  }

  validate() {
    const { func, thisArg } = this.options as FunctionOperatorOptions;
    const funcType = typeof func;
    const thisArgType = typeof thisArg;

    if (!func) {
      super.throwValidationError('func', OperatorValidationError.MISSING);
    }

    if (funcType !== 'string' && funcType !== 'function') {
      super.throwValidationError('func', OperatorValidationError.UNSUPPORTED);
    }

    if (thisArg && thisArgType !== 'string' && thisArgType !== 'object') {
      super.throwValidationError('thisArg', OperatorValidationError.UNSUPPORTED);
    }

    if (thisArg && funcType === 'string' && thisArgType !== 'string') {
      super.throwValidationError('thisArg', OperatorValidationError.MALFORMED);
    }

    if (thisArg && funcType === 'function' && thisArgType !== 'object') {
      super.throwValidationError('thisArg', OperatorValidationError.MALFORMED);
    }
  }
}
