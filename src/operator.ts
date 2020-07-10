/* eslint-disable max-classes-per-file */

export interface OperatorSpecificationDetail {
  required: boolean;
  type: string | string[];
  dependencies?: string[];
}

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

export class OperatorValidator {
  constructor(private options: OperatorOptions) {
    if (!options.name) {
      throw new Error(`Operator options ${JSON.stringify(options)} has no name property`);
    }
  }

  checkRequired(property: string) {
    if (!this.options[property]) {
      this.throwError(property, 'is required');
    }
  }

  checkType(property: string, type: string | string[]) {
    if (typeof type === 'string' && typeof this.options[property]) {
      this.throwError(property, `should be type ${type} `);
    } else if (type.indexOf(typeof this.options[property]) === -1) {
      this.throwError(property, `should be one of these types ${type.toString()}`);
    }
  }

  checkDependencies(property: string, dependencies: string[]) {
    dependencies.forEach((dependency) => {
      if (!this.options[dependency]) {
        this.throwError(property, `requires ${dependency}`);
      }
    });
  }

  throwError(property: string, message: string) {
    throw new Error(`Operator '${this.options.name}' property '${property}' ${message}`);
  }

  static isReservedProperty(property: string) {
    return property === 'name' || property === 'index' || property === 'maxDepth';
  }

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
          throw Error(`Operator '${name}' has unknown property ${key}`);
        }
      });
    }
  }
}

/**
 * An Operator takes a list of data objects emitted from a data layer and performs a transformation.
 * Operators should be atomic - performing a specific and succinct transformation. The
 * transformation should return a result that will be passed to the next operator, and it should not
 * mutate the incoming object.
 *
 * While an Operator will most often transform a single object, the input is always a list of
 * objects. This is because data emitted from the data layer could be a single value or the result
 * of a function call, which emits a list of arguments.
 *
 * An Operator can choose not to pass information to the next operator by returning null.
 */
export interface Operator {
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
