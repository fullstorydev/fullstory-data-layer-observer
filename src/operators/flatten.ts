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
    let targetNode = node;
    let targetRoot = root;

    if (!targetNode) {
      // first time execution
      targetNode = root;
      targetRoot = {};
    }

    Object.getOwnPropertyNames(targetNode).forEach((prop) => {
      if (typeof targetNode[prop] === 'object' && targetNode[prop] != null
        && !Array.isArray(targetNode[prop]) && depth < this.maxDepth + 1) {
        this.flattenHelper(targetRoot, depth + 1, targetNode[prop]);
      } else {
        targetRoot[prop] = targetNode[prop];
      }
    });

    return targetRoot;
  }

  handleData(data: any[]): any[] | null {
    const flattened = this.flattenHelper(data[this.index]);

    const clone = data.slice();
    clone.splice(this.index, 1, flattened);
    return clone;
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(FlattenOperator.specification);
  }
}
