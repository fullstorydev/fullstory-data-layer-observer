/**
 * OperatorOptions define shared properties for all Operators.
 */
export interface OperatorOptions {
  name: string; // the name of the operator
  index?: number; // an index if the operation in on a specific object in a list
  maxDepth?: number; // the maximum depth to traverse nested objects
}

/**
 * Common validation errors, which prevents each Operator from defining their own strings and bloating code.
 */
export enum OperatorValidationError {
  MISSING = 'is missing or empty',
  UNSUPPORTED = 'has unsupported value',
  MALFORMED = 'is malformed'
}

/**
 * An Operator takes a list of data objects emitted from a data layer and performs a transformation.
 * Operators should be atomic - performing a specific and succinct transformation. The transformation should
 * return a result that will be passed to the next operator, and it should not mutate the incoming object.
 *
 * While an Operator will most often transform a single object, the input is always a list of objects.
 * This is because data emitted from the data layer could be a single value or the result of a function call, which
 * emits a list of arguments.
 *
 * An Operator can choose not to pass information to the next operator by returning null.
 */
export abstract class Operator<O extends OperatorOptions> {
  readonly name: string;

  readonly index: number; // NB (van) create a member for index because it's optional and this confuses the ts compiler in subclasses

  constructor(protected options: O) {
    this.name = options.name;
    this.index = options.index || 0;
  }

  /**
   * Transforms data based on Operator implementation. Input data should not be mutated.
   * Returning null signals that data should not be propagated to the next Operator.
   * @param data the list of data object emitted from a data layer
   */
  abstract handleData(data: any[]): any[] | null;

  /**
   * Validates OperatorOptions. If an Operator has an invalid configuration, an Error should be thrown.
   */
  abstract validate(): void;

  /**
   * Helper to throw common validation errors.
   * @param option the option in OperatorOptions that is invalid
   * @param reason a common reason code
   * @param details optional detail message
   */
  protected throwValidationError(option: string, reason: OperatorValidationError, details?: string) {
    const message = `${this.name} operator option '${option}' ${reason}`;
    throw new Error(details ? `${message} (${details})` : message);
  }
}
