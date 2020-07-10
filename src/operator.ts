/* eslint-disable max-classes-per-file */

/**
 * OperatorSpecificationDetail provides additional metadata about the properties in OperatorOptions.
 * The metadata can be used to verify OperatorOptions match a spec using OperatorValidator.validate().
 */
export interface OperatorSpecificationDetail {
  required: boolean; // whether or not the property is required
  type: string | string[]; // the supported types of a property
  dependencies?: string[]; // any other properties that must be set
}

/**
 * OperatorSpecification is a map of each OperatorOptions property with a corresponding OperatorSpecificationDetail.
 */
export type OperatorSpecification = { [key: string]: OperatorSpecificationDetail };

/**
 * OperatorOptions define shared properties for all Operators.
 */
export interface OperatorOptions {
  name: string; // the name of the operator
  index?: number; // an index if the operation in on a specific object in a list
  maxDepth?: number; // the maximum depth to traverse nested objects
  specification?: OperatorSpecification; // specification used for validation
  [key: string]: any; // custom options provided by Operator implementations
}

/**
 * OperatorValidator verifies that OperatorOptions have supported values.
 */
export class OperatorValidator {
  constructor(private options: OperatorOptions) {
    if (!options.name) {
      throw new Error(`Operator options ${JSON.stringify(options)} has no name`);
    }
  }

  /**
   * Verifies an option is present.
   * @param option the property name
   * @throws an error if the property is missing
   */
  checkRequired(option: string) {
    if (!this.options[option]) {
      this.throwError(option, 'is required');
    }
  }

  /**
   * Verifies an option has a supported type.
   * @param option the property name
   * @param type the expected type(s)
   * @throws an error if the property has an unsupported type
   */
  checkType(option: string, type: string | string[]) {
    if (typeof type === 'string' && typeof this.options[option]) {
      this.throwError(option, `should be type ${type} `);
    } else if (type.indexOf(typeof this.options[option]) === -1) {
      this.throwError(option, `should be one of these types ${type.toString()}`);
    }
  }

  /**
   * Verifies other options are present for a given property.
   * @param option the property name
   * @param dependencies the required other properties
   * @throws an error if required properties are missing
   */
  checkDependencies(option: string, dependencies: string[]) {
    dependencies.forEach((dependency) => {
      if (!this.options[dependency]) {
        this.throwError(option, `requires ${dependency}`);
      }
    });
  }

  /**
   * Throws an error with a pre-formatted message.
   * @param option the property that triggered the error
   * @param message a more detailed message about the error
   * @throws an error as expected
   */
  throwError(option: string, message: string) {
    throw new Error(`Operator '${this.options.name}' option '${option}' ${message}`);
  }

  /**
   * Checks if an option is reserved, which are required options for all OperatorOptions.
   * @param option the option to check
   */
  static isReservedProperty(option: string) {
    return option === 'name' || option === 'index' || option === 'maxDepth';
  }

  /**
   * Performs validation that this validator's OperatorOptions matches a specification.
   * Any unknown properties will result in an error.
   * @param specification the specification to validate
   * @throws an error if the OperatorOptions fails validation
   */
  validate(specification: OperatorSpecification) {
    const { name } = this.options;

    if (specification) {
      Object.getOwnPropertyNames(specification).forEach((key) => {
        const { required, type, dependencies = [] } = specification[key];
        if (required) {
          this.checkRequired(key);
        }

        if (this.options[key]) {
          this.checkType(key, type);
          this.checkDependencies(key, dependencies);
        }
      });

      Object.getOwnPropertyNames(this.options).filter(
        (key) => !OperatorValidator.isReservedProperty(key),
      ).forEach((key) => {
        if (!specification[key]) {
          throw Error(`Operator '${name}' has unknown option ${key}`);
        }
      });
    }
  }
}

/**
 * An Operator takes a list of data objects emitted from a data layer and performs a transformation.
 * Operators should be atomic - performing a specific and succinct transformation. The
 * transformation should return a result that will be passed to the next operator. An Operator should not
 * mutate the incoming object.
 *
 * While an Operator will most often transform a single object, the input is always a list of
 * objects. This is because data emitted from the data layer could be a single value or the result
 * of a function call, which emits a list of arguments.
 *
 * An Operator can choose not to pass information to the next operator by returning null.
 *
 * Operators should implement the validate function to ensure the Operator is configured correctly at runtime.
 * For convenience, Operators can use OperatorValidator and an OperatorSpecification to assist with validation.
 */
export interface Operator {
  /**
   * The OperatorOptions that control the behavior of the Operator's implementation.
   */
  options: OperatorOptions;

  /**
   * Transforms data based on Operator implementation. Input data should not be mutated.
   * Returning null signals that data should not be propagated to the next Operator.
   * @param data the list of data object emitted from a data layer
   */
  handleData(data: any[]): any[] | null;

  /**
   * Validates OperatorOptions.
   * @throws if an Operator has an invalid configuration, an Error should be thrown.
   */
  validate(): void;
}
