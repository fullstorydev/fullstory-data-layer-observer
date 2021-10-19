import {
  FunctionOperator, FunctionOperatorOptions,
  FlattenOperator, FlattenOperatorOptions,
  InsertOperator, InsertOperatorOptions,
  SuffixOperator, SuffixOperatorOptions,
  ConvertOperator, ConvertOperatorOptions,
  QueryOperator, QueryOperatorOptions,
  RenameOperator, RenameOperatorOptions,
  FanOutOperator, FanOutOperatorOptions,
  JsOperator, JsOperatorOptions,
  CombineOperator, CombineOperatorOptions,
  SeparateOperator, SeparateOperatorOptions,
} from './operators';
import { Operator } from './operator';
import { Logger, LogMessage } from './utils/logger';

/**
 * Declares known, built-in Operators.
 */
export type BuiltinOperator = typeof ConvertOperator | typeof FlattenOperator
  | typeof FunctionOperator | typeof InsertOperator | typeof SuffixOperator
  | typeof QueryOperator | typeof RenameOperator | typeof FanOutOperator
  | typeof JsOperator | typeof CombineOperator | typeof SeparateOperator;

/**
 * Declares known, built-in OperatorOptions.
 */
export type BuiltinOptions = ConvertOperatorOptions | FlattenOperatorOptions
  | FunctionOperatorOptions | InsertOperatorOptions | SuffixOperatorOptions
  | QueryOperatorOptions | RenameOperatorOptions | FanOutOperatorOptions
  | JsOperatorOptions | CombineOperatorOptions | SeparateOperatorOptions;

/**
 * OperatorFactory creates instances built-in Operators. Since DataLayerRule can define OperatorOptions at runtime,
 * the factory is responsible for creating a configured Operator for arbitrary DataLayerRule operators.
 */
export class OperatorFactory {
  private static jsOperatorNames = [
    'join',
    'split',
  ];

  private static buildOperatorMap(): { [key: string]: BuiltinOperator } {
    const operators: { [key: string]: BuiltinOperator} = {
      combine: CombineOperator,
      convert: ConvertOperator,
      flatten: FlattenOperator,
      function: FunctionOperator,
      insert: InsertOperator,
      js: JsOperator,
      suffix: SuffixOperator,
      query: QueryOperator,
      rename: RenameOperator,
      separate: SeparateOperator,
      'fan-out': FanOutOperator,
    };

    for (let i = 0; i < this.jsOperatorNames.length; i += 1) {
      operators[this.jsOperatorNames[i]] = JsOperator;
    }

    return operators;
  }

  private static operators: { [key: string]: BuiltinOperator } = OperatorFactory.buildOperatorMap();

  /**
   * Creates a configured Operator.
   * @param name the name of the Operator to create
   * @param options OperatorOptions used to configure the Operator
   */
  static create(name: string, options: BuiltinOptions): Operator {
    if (!OperatorFactory.hasOperator(name)) {
      throw new Error(Logger.format(LogMessage.UnknownValue, name));
    }

    const patchedOptions = this.jsOperatorNames.includes(name)
      ? { ...options, function: name }
      : options;

    return new (this.operators[name] as any)(patchedOptions);
  }

  /**
   * Checks if the factory knows how to create an Operator.
   * @param name the name to check
   */
  static hasOperator(name: string) {
    return this.operators[name] !== undefined;
  }
}
