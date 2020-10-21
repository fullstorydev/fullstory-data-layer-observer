import {
  FunctionOperator, FunctionOperatorOptions,
  FlattenOperator, FlattenOperatorOptions,
  InsertOperator, InsertOperatorOptions,
  SuffixOperator, SuffixOperatorOptions,
  ConvertOperator, ConvertOperatorOptions,
  QueryOperator, QueryOperatorOptions,
  RenameOperator, RenameOperatorOptions,
  FanOutOperator, FanOutOperatorOptions,
} from './operators';
import { Operator } from './operator';
import { Logger, LogMessage } from './utils/logger';

/**
 * Declares known, built-in Operators.
 */
export type BuiltinOperator = typeof ConvertOperator | typeof FlattenOperator
  | typeof FunctionOperator | typeof InsertOperator | typeof SuffixOperator
  | typeof QueryOperator | typeof RenameOperator | typeof FanOutOperator;

/**
 * Declares known, built-in OperatorOptions.
 */
export type BuiltinOptions = ConvertOperatorOptions | FlattenOperatorOptions
  | FunctionOperatorOptions | InsertOperatorOptions | SuffixOperatorOptions
  | QueryOperatorOptions | RenameOperatorOptions | FanOutOperatorOptions;

/**
 * OperatorFactory creates instances built-in Operators. Since DataLayerRule can define OperatorOptions at runtime,
 * the factory is responsible for creating a configured Operator for arbitrary DataLayerRule operators.
 */
export class OperatorFactory {
  private static operators: { [key: string]: BuiltinOperator } = {
    convert: ConvertOperator,
    flatten: FlattenOperator,
    function: FunctionOperator,
    insert: InsertOperator,
    suffix: SuffixOperator,
    query: QueryOperator,
    rename: RenameOperator,
    'fan-out': FanOutOperator,
  };

  /**
   * Creates a configured Operator.
   * @param name the name of the Operator to create
   * @param options OperatorOptions used to configure the Operator
   */
  static create(name: string, options: BuiltinOptions): Operator {
    if (!OperatorFactory.hasOperator(name)) {
      throw new Error(Logger.format(LogMessage.UnknownValue, name));
    }

    return new (this.operators[name] as any)(options);
  }

  /**
   * Checks if the factory knows how to create an Operator.
   * @param name the name to check
   */
  static hasOperator(name: string) {
    return this.operators[name] !== undefined;
  }
}
