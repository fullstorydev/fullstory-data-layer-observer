import { Operator, OperatorOptions, OperatorValidator } from '../operator';

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
   * Recursively flattens all properties into an object.
   * @param root the root object to contain all properties
   * @param node a child node to flatten
   */
  flattenHelper(root: any, depth = 0, node?: any) {
    if (!node) {
      // first time execution
      node = root;
      root = {};
    }

    Object.getOwnPropertyNames(node).forEach(prop => {
      if (typeof node[prop] === 'object' && node[prop] != null && !Array.isArray(node[prop]) && depth < this.maxDepth + 1) {
        this.flattenHelper(root, depth + 1, node[prop]);
      } else {
        root[prop] = node[prop];
      }
    });

    return root;
  }

  handleData(data: any[]): any[] | null {
    data[this.index] = this.flattenHelper(data[this.index]);
    return data;
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(FlattenOperator.specification);
  }
}