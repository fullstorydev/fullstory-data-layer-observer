/* eslint no-param-reassign: ["error", { "props": false }] */
import {
  Operator, OperatorOptions, OperatorValidator, safeUpdate,
} from '../operator';

export interface FlattenOperatorOptions extends OperatorOptions {

}

export class FlattenOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    maxDepth: { required: false, type: ['number'] },
  };

  readonly index: number;

  readonly maxDepth: number;

  constructor(public options: FlattenOperatorOptions) {
    const { index = 0, maxDepth = 10 } = options;

    this.index = index;
    this.maxDepth = maxDepth;
  }

  /**
   * Recursively flattens (copies) all properties into an object at a single level.
   * @param target Object to copy properties into
   * @param source Object that is the source containing properties (during recursive calls these are child objects under a root object)
   */
  flattenHelper(target: any, source: any, depth = 0) {
    Object.getOwnPropertyNames(source).forEach((prop) => {
      if (typeof source[prop] === 'object' && source[prop] != null
        && !Array.isArray(source[prop]) && depth < this.maxDepth + 1) {
        this.flattenHelper(target, source[prop], depth + 1);
      } else {
        target[prop] = source[prop];
      }
    });
  }

  handleData(data: any[]): any[] | null {
    // NOTE this operator transforms data - be absolutely sure there are no side effects to the data layer!

    // flattening copies key value pairs from the source to the target
    // the target is a new empty object so that the flattening process does not affect the data layer
    const target = {};
    const source = data[this.index];
    this.flattenHelper(target, source);

    // a copy of the incoming data layer needs to be returned
    // if you modify/update the `data` parameter directly, you may modify the data layer!
    return safeUpdate(data, this.index, target);
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(FlattenOperator.specification);
  }
}
