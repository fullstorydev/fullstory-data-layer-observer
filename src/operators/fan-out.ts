import { Operator, OperatorOptions, OperatorValidator } from '../operator';

export interface FanOutOperatorOptions extends OperatorOptions {
  properties: string | string[];
}

export class FanOutOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    properties: { required: true, type: ['string'] },
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
  */
  handleData(data: any[]): any[] | null {
    if (typeof data[this.index] !== 'object') {
      throw new Error('Can only fan out property names on objects');
    }
    const plucked: any[] = [];
    for (let i = 0; i < this.properties.length; i += 1) {
      const value = data[this.index][this.properties[i]];
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
