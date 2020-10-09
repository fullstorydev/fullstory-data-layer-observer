import { Operator, OperatorOptions, OperatorValidator } from '../operator';
import { select } from '../selector';

export interface InsertOperatorOptions extends OperatorOptions {
  defaultValue?: boolean | string | number | object; // a default value if the select fails
  select?: string; // a value found using selection syntax
  value?: boolean | string | number | object; // a given value to insert
  position?: number; // the location where the value will be inserted
}

/**
 * InsertOperator inserts an object into a list at a specified position. This operator is most frequently used
 * when passing function arguments to a destination. The value inserted can either be explicitly set using the
 * 'value' option or looked up in an object using the 'select' option. The position of insertion is specified
 * using the 'position' option. A negative position will insert from the end of the list.
 */
export class InsertOperator implements Operator {
  readonly index: number;

  readonly position: number;

  constructor(public options: InsertOperatorOptions) {
    const { index = 0, position = 0 } = options;

    this.index = index;
    this.position = position;
  }

  static specification = {
    defaultValue: { required: false, type: ['boolean,string,number,object'] },
    index: { required: false, type: ['number'] },
    select: { required: false, type: ['string'] },
    value: { required: false, type: ['boolean,string,number,object'] },
    position: { required: false, type: ['number'] },
  };

  handleData(data: any[]): any[] | null {
    const { defaultValue, select: selection, value } = this.options;

    if (selection && value !== undefined) {
      throw new Error('insert operator has both \'select\' and \'value\' options set');
    }

    let insertedValue = value || select(selection!, data[this.index]);

    if (insertedValue === undefined && defaultValue !== undefined) {
      insertedValue = defaultValue;
    }

    // if it's still undefined, don't proceed with the operator chain
    if (insertedValue === undefined) {
      throw new Error('insert operator failed to find a value to insert');
    }

    const clone = data.slice();
    clone.splice(this.position >= 0 ? this.position : clone.length - this.position, 0, insertedValue);

    return clone;
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(InsertOperator.specification);

    // NOTE select and value aren't required, but at least one of them must be specified
    const { select: selection, value } = this.options;
    if (!selection && value === undefined) {
      validator.throwError('selection', ' and \'value\' are missing - at least one is required');
    }

    if (selection && value !== undefined) {
      validator.throwError('selection', ' and \'value\' are both defined - use only one option');
    }
  }
}
