import { Operator, OperatorOptions, OperatorValidator } from '../operator';

export interface FanOutOperatorOptions extends OperatorOptions {
  properties: string | string[];
}

export class FanOutOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    properties: { required: false, type: ['string'] },
  };

  readonly index: number;

  readonly properties: string[];

  constructor(public options: FanOutOperatorOptions) {
    const { index = 0, properties = [] } = options;
    this.index = index;
    if (typeof properties === 'string') {
      this.properties = properties.split(',').map((val) => val.trim());
    } else {
      this.properties = properties;
    }
  }

  /*
  The FanOutOperator is a special case.

  `handleData` returns an array of objects that each should have the remaining operators run on them.

  If a property value is an array then each item in the array is fanned out.

  If there are no declared properties then:
  - if it's an array then return all items
  - else return all 'own' properties that are objects
  */
  handleData(data: any[]): any[] | null {
    const datum = data[this.index];
    if (typeof datum !== 'object' && Array.isArray(datum) === false) {
      throw new Error('Can only fan out arrays or properties on objects');
    }
    const plucked: any[] = [];

    // If properties is empty then work on the datum itself
    if (this.properties.length === 0) {
      if (Array.isArray(datum)) {
        plucked.push(...datum);
      } else {
        Object.values(datum).forEach((value: any) => {
          if (Array.isArray(value)) {
            plucked.push(...value);
          } else if (typeof value === 'object') {
            plucked.push(value);
          }
          // We don't pluck non-object and non-array properties
        });
      }
      return plucked;
    }

    for (let i = 0; i < this.properties.length; i += 1) {
      const value = datum[this.properties[i]];
      if (Array.isArray(value)) {
        plucked.push(...value);
      } else {
        plucked.push(value);
      }
    }
    return plucked;
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(FanOutOperator.specification);
  }
}
