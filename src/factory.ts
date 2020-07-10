import * as Operators from './operators';
import { Operator } from './operator';
import { FunctionOperator } from './operators';

export type ConfigurableOperator = typeof Operators.FunctionOperator;

export type ConfigurableOptions = Operators.FunctionOperatorOptions;

export class OperatorFactory {
  private static operators: { [key: string]: ConfigurableOperator } = {
    function: FunctionOperator,
  };

  static create(name: string, options: ConfigurableOptions): Operator {
    if (!OperatorFactory.hasOperator) {
      throw new Error(`Operator ${name} is unknown`);
    }

    return new this.operators[name](options);
  }

  static hasOperator(name: string) {
    return this.operators[name] !== undefined;
  }
}
