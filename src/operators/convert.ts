import {
  Operator, OperatorOptions, OperatorValidator, safeUpdate,
} from '../operator';
import { Logger, LogMessageType } from '../utils/logger';
import { SuffixOperator } from './suffix';

type ConvertibleType = 'bool' | 'date' | 'int' | 'real' | 'string';

export interface ConvertOperatorOptions extends OperatorOptions {
  enumerate?: boolean;
  force?: boolean;
  preserveArray?: boolean;
  properties?: string | string[];
  ignore?: string | string[];
  ignoreSuffixed?: boolean;
  type?: ConvertibleType;
}

/**
 * ConvertOperator formats a value from one `type` to a bool, int, real, or string.
 * The `properties` to be converted can either be a single string property, a list of string properties separated by
 * a comma, or a native array of strings. The string `*` can also be used to denote that all properties in an object
 * should be converted to the desired `type`.
 * If the value to be converted is an array, the individual elements will be converted to the desired type. If the
 * array has only a single item, then the sole item will be assigned to the property. For example, price: ['24.99']
 * can become price: 24.99.
 */
export class ConvertOperator implements Operator {
  static specification = {
    enumerate: { required: false, type: ['boolean'] },
    force: { required: false, type: ['boolean'] },
    index: { required: false, type: ['number'] },
    preserveArray: { required: false, type: ['boolean'] },
    properties: { required: false, type: ['string,object'] }, // NOTE typeof array is object
    type: { required: false, type: ['string'] },
    ignore: { required: false, type: ['string,object'] }, // NOTE typeof array is object
    ignoreSuffixed: { required: false, type: ['boolean'] },
  };

  readonly index: number;

  constructor(public options: ConvertOperatorOptions) {
    const { index = 0 } = options;

    this.index = index;
  }

  static convert(type: ConvertibleType, value: any) {
    switch (type) {
      case 'bool': return (value === 'true' || value === 'TRUE' || value === 'True');
      case 'date': return new Date(value);
      case 'int':
      case 'real':
        // NOTE be careful of trying to convert an empty string, which will become 0
        // a guard exists in `enumerate` but `convert` assumes you intend the conversion
        // and the ternary allows converting a boolean for example to 0
        return !value ? 0 : ConvertOperator.enumerate(value);
      case 'string':
        switch (typeof value) {
          case 'boolean': return Boolean(value).toString();
          case 'number': return (value as number).toString();
          case 'undefined': return '';
          default: return value === null ? '' : value;
        }
      default: return value;
    }
  }

  /**
   * Converts a string into a number or returns NaN if the value
   * is not "numeric".
   * @param value String representation of a numeric value
   */
  static enumerate(value: string): number {
    const parsed = parseFloat(value);
    // NOTE use isNaN(string) to ensure the string value is numeric
    // normally Number.isNaN(value) would convert 12-26-2020 to 12
    // @ts-ignore to isNaN(string)
    return !isNaN(value) && !Number.isNaN(parsed) ? parsed : NaN; // eslint-disable-line no-restricted-globals
  }

  /**
   * Lists any enumberable properties (strings or arrays of strings) in an object.
   * @param obj Object to find supported properties that can be enumerated.
   */
  static enumerableProperties(obj: any): string[] {
    return Object.getOwnPropertyNames(obj).filter((key) => typeof obj[key] === 'string'
      || (Array.isArray(obj[key]) && typeof obj[key][0] === 'string'));
  }

  handleData(data: any[]): any[] | null {
    // NOTE this operator transforms data - be absolutely sure there are no side effects to the data layer!

    const index = this.index >= 0 ? this.index : data.length + this.index;

    let { properties, ignore } = this.options;
    const {
      enumerate, force, preserveArray, type, ignoreSuffixed,
    } = this.options;

    if (typeof properties === 'string') {
      properties = properties.split(',').map((property) => property.trim()); // auto-correct if the CSV has spaces
    }
    if (typeof ignore === 'string') {
      ignore = ignore.split(',').map((property) => property.trim()); // auto-correct if the CSV has spaces
    }

    // TODO (van) we don't currently rename properties in child objects, but if we eventually do
    // a deep copy of the data layer object will need to be done to ensure we don't change the object
    // in the data layer
    const converted: { [key: string]: any } = { ...data[index] };

    // if enumerate is set, try to coerce all strings into an equivalent numeric value
    if (enumerate) {
      let enumerableProps = ConvertOperator.enumerableProperties(data[index]);
      // if ignore properties are set, make sure those are filtered out
      if (ignore) {
        const filterPredicate = (key:string) => !ignore?.includes(key);
        enumerableProps = enumerableProps.filter(filterPredicate);
      }
      // if we are to ignore suffixed values, filter out those that are suffixed
      if (ignoreSuffixed) {
        const filterPredicate = (key:string) => !SuffixOperator.isAlreadySuffixed(key);
        enumerableProps = enumerableProps.filter(filterPredicate);
      }
      enumerableProps.forEach((property) => {
        if (typeof data[index][property] === 'string') {
          // it seems best to leave an empty string as-is rather than have it converted to 0
          if (data[index][property] !== '') {
            converted[property] = ConvertOperator.convert('real', data[index][property]);
            ConvertOperator.verifyConversion('real', property, converted, data[index]);
          }
        } else {
          converted[property] = []; // this prevents mutating the actual data layer
          for (let i = 0; i < (data[index][property] as string[]).length; i += 1) {
            converted[property].push(ConvertOperator.convert('real', data[index][property][i]));
          }
          ConvertOperator.verifyConversion('real', property, converted, data[index]);
        }
      });
    }

    if (properties && type) {
      // NOTE if * is supplied, convert all properties
      const list = properties[0] === '*' ? Object.getOwnPropertyNames(data[index]) : properties;

      list.forEach((property) => {
        const original = data[index][property];
        if ((original !== undefined && original !== null) || force) {
          // if the intended conversion is on a list, convert all members in the list
          if (Array.isArray(original)) {
            converted[property] = []; // this prevents mutating the actual data layer
            for (let i = 0; i < (original as any[]).length; i += 1) {
              const item = (original as any[])[i];
              converted[property].push(ConvertOperator.convert(type, item));
            }
            ConvertOperator.verifyConversion(type, property, converted, data[index]);
          } else {
            converted[property] = ConvertOperator.convert(type, original);
            ConvertOperator.verifyConversion(type, property, converted, data[index]);
          }
        }
      });
    }

    // reduce any converted single item lists to a single value
    if (!preserveArray) {
      Object.getOwnPropertyNames(converted).forEach((property: string) => {
        if (Array.isArray(converted[property]) && converted[property].length === 1) {
          const [singleValue] = converted[property];
          converted[property] = singleValue;
        }
      });
    }

    // a copy of the incoming data layer needs to be returned
    // if you modify/update the `data` parameter directly, you may modify the data layer!
    return safeUpdate(data, index, converted);
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(ConvertOperator.specification);

    const {
      enumerate, force, properties, type,
    } = this.options;

    if (enumerate === undefined && properties === undefined) {
      throw validator.throwError('properties', 'must be specified if \'enumerate\' is undefined and vice versa');
    }

    if (enumerate !== undefined && typeof enumerate !== 'boolean') {
      throw validator.throwError('enumerate', 'should be a boolean');
    }

    if (force !== undefined && typeof force !== 'boolean') {
      throw validator.throwError('force', 'should be a boolean');
    }

    if (force !== undefined && force && type === 'date') {
      throw validator.throwError('force', 'can not forcibly convert dates');
    }

    if (properties !== undefined && !type) {
      throw validator.throwError('type', 'must be declared when using \'properties\'');
    }

    if (type && (type !== 'bool' && type !== 'int' && type !== 'real' && type !== 'string' && type !== 'date')) {
      throw validator.throwError('type', `unknown type '${type}' used`);
    }
  }

  /**
   * Verifies that the conversion was successful. If not, a warning error will be logged and the value reset to its
   * original value.
   * @param type Intended conversion type
   * @param property Property that was converted
   * @param newMap Map containing all converted properties
   * @param oldMap Map containing the original data (used to reset "converted value")
   */
  private static verifyConversion(type: string, property: string | number, newMap: any, oldMap: any) {
    const newValue = newMap[property];
    const oldValue = oldMap[property];

    let verified = true;

    // verify it's a number
    if ((type === 'int' || type === 'real')) {
      verified = Array.isArray(newValue) ? newValue.every((value) => !Number.isNaN(value)) : !Number.isNaN(newValue);
    }

    // verify it's a date by checking the epoch
    if (type === 'date') {
      verified = Array.isArray(newValue) ? newValue.every((value) => !Number.isNaN((value as Date).getTime()))
        : !Number.isNaN((newValue as Date).getTime());
    }

    // Note `debug` level is used because `enumerate` may always be done `beforeDestination`, which could generate
    // a lot of false positives
    // log debug and reset to the original value
    if (!verified) {
      newMap[property] = oldValue; // eslint-disable-line no-param-reassign

      Logger.getInstance().debug(LogMessageType.OperatorError, {
        operator: 'convert',
        property: property.toString(),
        reason: `Failed to convert to ${type} for value ${oldValue}`,
      });
    }
  }
}
