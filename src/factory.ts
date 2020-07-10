import { FunctionOperator, FunctionOperatorOptions } from './operators';
import { Operator } from './operator';

/**
 * Declares known, built-in Operators.
 */
export type BuiltinOperator = typeof FunctionOperator;

/**
 * Declares known, built-in OperatorOptions.
 */
export type BuiltinOptions = FunctionOperatorOptions;

/**
 * OperatorFactory creates instances built-in Operators. Since DataLayerRule can define OperatorOptions at runtime,
 * the factory is responsible for creating a configured Operator for arbitrary DataLayerRule operators.
 */
export class OperatorFactory {
  private static operators: { [key: string]: BuiltinOperator } = {
    function: FunctionOperator,
  };

  /**
   * Creates a configured Operator.
   * @param name the name of the Operator to create
   * @param options OperatorOptions used to configure the Operator
   */
  static create(name: string, options: BuiltinOptions): Operator {
    if (!OperatorFactory.hasOperator(name)) {
      throw new Error(`Operator ${name} is unknown`);
    }

    return new this.operators[name](options);
  }

  /**
   * Checks if the factory knows how to create an Operator.
   * @param name the name to check
   */
  static hasOperator(name: string) {
    return this.operators[name] !== undefined;
  }
}
