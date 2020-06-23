import { Operator, OperatorOptions, OperatorValidationError } from '../operator';

export interface PickOperatorOptions extends OperatorOptions {
  properties: string[] | string;  // the properties in the object to pick as a list or CSV
}

type picktionary = { [key: string]: boolean };

/**
 * PickOperator returns a new object containing only desired (i.e. picked) properties.
 */
export class PickOperator extends Operator {

  properties: string[] = [];

  constructor(private options: PickOperatorOptions) {
    super(options);
  }

  /**
   * Recursively picks properties out of an object and its children.
   * A new object with picked properties is returned.
   * @param obj the Object to pick
   */
  pickHelper(obj: any, picks: picktionary, depth = 0, maxDepth?: number, ) {
    const picked: any = {};
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (picks[prop]) {
        // since an array is an object we have to check it
        // it's possible that it's an array of strings, which is a valid value to pick
        if (typeof obj[prop] === 'object' && obj[prop] != null && !Array.isArray(obj[prop])) {
          const nextDepth = depth + 1;

          // if not maxDepth is specified go all the way down; if it is specified, check the depth
          if (maxDepth === undefined || (nextDepth < maxDepth)) {
            picked[prop] = this.pickHelper(obj[prop], picks, nextDepth, maxDepth);
          }
        } else {
          picked[prop] = obj[prop];
        }
      }
    });

    return picked;
  }

  handleData(data: any[]): any[] | null {
    const { properties, maxDepth } = this.options;
    this.properties = typeof properties === 'string' ? properties.split(',') : properties;

    const picks: picktionary = {};
    this.properties.forEach(property => picks[property.trim()] = true);

    data[this.index] = this.pickHelper(data[this.index], picks, 0, maxDepth);

    return data;
  }

  validate() {
    const { properties } = this.options;

    const option = 'properties';

    if (!properties || Array.isArray(properties) && properties.length === 0)
      super.throwValidationError(option, OperatorValidationError.MISSING);
    if (typeof properties !== 'string' && !Array.isArray(properties))
      super.throwValidationError(option, OperatorValidationError.UNSUPPORTED);
    if (typeof properties === 'string' && properties[0] === ',')
      super.throwValidationError(option, OperatorValidationError.MALFORMED, 'leading comma');
    if (typeof properties === 'string' && properties[properties.length - 1] === ',')
      super.throwValidationError(option, OperatorValidationError.MALFORMED, 'trailing comma');
  }

}