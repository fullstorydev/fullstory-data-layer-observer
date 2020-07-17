import { Operator, OperatorOptions, OperatorValidator } from '../operator';
import { Logger } from '../utils/logger';

type ConvertibleType = 'bool' | 'int' | 'real' | 'string';

export interface ConvertOperatorOptions extends OperatorOptions {
  properties: string | string[];
  type: ConvertibleType;
}

/**
 * ConvertOperator formats a value from one `type` to a bool, int, real, or string.
 * The `properties` to be converted can either be a single string property, a list of string properties separated by
 * a comma, or a native array of strings. The string `*` can also be used to denote that all properties in an object
 * should be converted to the desired `type`.
 */
export class ConvertOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    properties: { required: true, type: ['string,object'] }, // NOTE an typeof array is object
    type: { required: true, type: ['string'] },
  };

  readonly index: number;

  constructor(public options: ConvertOperatorOptions) {
    const { index = 0 } = options;

    this.index = index;
  }

  static convert(type: ConvertibleType, value: any) {
    switch (type) {
      case 'bool': return Boolean(value).valueOf();
      case 'int': return parseInt(value, 10);
      case 'real': return parseFloat(value);
      case 'string':
        switch (typeof value) {
          case 'boolean': return Boolean(value).toString();
          case 'number': return (value as number).toString();
          default: return value;
        }
      default: return value;
    }
  }

  handleData(data: any[]): any[] | null {
    let { properties } = this.options;
    const { type } = this.options;

    if (typeof properties === 'string') {
      properties = properties.split(',');
    }

    // NOTE if * is supplied, convert all properties
    const list = properties[0] === '*' ? Object.getOwnPropertyNames(data[this.index]) : properties;

    const converted: { [key: string]: any } = { ...data[this.index] };
    list.forEach((property) => {
      const original = data[this.index][property];
      converted[property] = ConvertOperator.convert(type, original);

      if ((type === 'int' || type === 'real') && Number.isNaN(converted[property])) {
        Logger.getInstance().error(`Unable to convert ${properties.toString()} to ${type} for value ${original}`);
        converted[property] = original; // NOTE that we will reset the value back to something other than NaN
      }
    });

    const clone = data.slice();
    clone.splice(this.index, 0, converted);

    return clone;
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(ConvertOperator.specification);

    const { type } = this.options;
    if (type !== 'bool' && type !== 'int' && type !== 'real' && type !== 'string') {
      throw validator.throwError('type', `unknown type '${type}' used`);
    }
  }
}
