/* eslint no-param-reassign: ["error", { "props": false }] */
import {
  Operator, OperatorOptions, OperatorValidator, safeUpdate,
} from '../operator';

const KEY_VALUE_OUTPUT = 'keyValue';
const ARRAY_OUTPUT = 'array';
const VALID_PROPERTY = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export interface ParseOperatorOptions extends OperatorOptions {
  propertyDelimiters: string[];
  property: string;
  output?:string;
  keyValueDelimiter?: string;
}

export class ParseOperator implements Operator {
  static specification = {
    propertyDelimiters: { required: true, type: ['object'] },
    property: { required: true, type: ['string'] },
    keyValueDelimiter: { required: false, type: ['string'] },
    output: { required: false, type: ['string'] },
    index: { required: false, type: ['number'] },
  };

  readonly index: number;

  readonly propertyDelimiters: string[];

  readonly property: string;

  constructor(public options: ParseOperatorOptions) {
    const { index = 0, propertyDelimiters, property } = options;
    this.index = index;
    this.propertyDelimiters = propertyDelimiters;
    this.property = property;
  }

  /**
   * Test if a property is a valid property (starts with lettter, then any number of letters, numbers or _ )
   */
  static isValidProperty(property: string) : boolean {
    return VALID_PROPERTY.test(property);
  }

  /**
   * Parses a string with one or more delimiters, and sends the resulting values through as properties.
   * Will parse each property with a keyValueDelimiter and if applies will send key/value pairs for the properties.
   * Otherwise will send just property:property as values
   * @param target Object to copy properties into
   * @param source Object that is the source containing properties (during recursive calls these are child objects under a root object)
   */
  parseHelper(target: any, source: string) {
    const localPropertyDelimiters:string[] = this.propertyDelimiters;
    // parse by first delimiter
    let values:string[] = source.split(localPropertyDelimiters[0]);
    // now go through rest of delimiters and try to split each value
    for (let i = 1; i < localPropertyDelimiters.length; i += 1) {
      // make a copy
      const valuesCopy = [...values];
      // reset back to empty
      values = [];
      // now loop through each value and try to split it by the current delimiter
      // eslint-disable-next-line no-loop-func
      valuesCopy.forEach((value) => {
        values.push(...value.split(localPropertyDelimiters[i]));
      });
    }
    // now that we have all the parsed values, see if any are key value pairs
    const { keyValueDelimiter, output = KEY_VALUE_OUTPUT } = this.options;
    if (output === ARRAY_OUTPUT) {
      target[this.property] = values;
    } else if (output === KEY_VALUE_OUTPUT) {
      values.forEach((value) => {
        let key = value;
        let realValue = null;
        if (keyValueDelimiter) {
          const splitValue = value.split(keyValueDelimiter);
          if (splitValue.length > 1) {
            [key, realValue] = splitValue;
          }
        }
        // if it is a valid property, then put in key/value
        if (ParseOperator.isValidProperty(key)) {
          target[key] = realValue;
        } else {
          // not valid property so put in array
          if (!target[this.property]) {
            target[this.property] = [];
          }
          target[this.property].push(value);
        }
      });
    }
  }

  handleData(data: any[]): any[] | null {
    const target = {};
    const source = data[this.index];
    const value = source[this.property];
    // can only work on source objects that are a string
    if (typeof value !== 'string') {
      return null;
    }
    this.parseHelper(target, value);

    // a copy of the incoming data layer needs to be returned
    // if you modify/update the `data` parameter directly, you may modify the data layer!
    return safeUpdate(data, this.index, target);
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(ParseOperator.specification);
    const { propertyDelimiters, keyValueDelimiter, output = KEY_VALUE_OUTPUT } = this.options;
    if (!Array.isArray(propertyDelimiters)) {
      validator.throwError('propertyDelimiters', 'has to be an array of strings');
    } else if (Array.isArray(propertyDelimiters) && !(propertyDelimiters.every((v: any) => typeof v === 'string'))) {
      validator.throwError('propertyDelimiters', 'has to be an array of strings');
    }
    if (output !== KEY_VALUE_OUTPUT && output !== ARRAY_OUTPUT) {
      validator.throwError('output', 'can only be keyValue or array');
    }
    if (output === ARRAY_OUTPUT && keyValueDelimiter) {
      validator.throwError('output', 'you cannot specify keyValueDelimeter with output=array');
    }
  }
}
