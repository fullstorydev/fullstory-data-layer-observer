import { Operator, OperatorOptions, OperatorValidationError } from '../operator';
import { select } from '../selector';

export interface FunctionOperatorOptions extends OperatorOptions {
  func: string | Function;
}

/**
 * FunctionOperator executes a function and returns the result.
 */
export class FunctionOperator extends Operator<FunctionOperatorOptions> {
  handleData(data: any[]): any[] | null {
    const { func } = this.options;

    switch (typeof func) {
      case 'function':
        return [func.apply(globalThis, data)];
      case 'string':
        return select(func).apply(globalThis, data);
      default:
        // NOTE this will stop the handler
        return null;
    }
  }

  validate() {
    const { func } = this.options;

    if (!func) {
      super.throwValidationError('func', OperatorValidationError.MISSING);
    }

    if (typeof func !== 'string' || typeof func !== 'function') {
      super.throwValidationError('func', OperatorValidationError.UNSUPPORTED);
    }
  }
}
