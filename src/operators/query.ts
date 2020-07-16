import { Operator, OperatorOptions, OperatorValidator } from '../operator';
import { select } from '../selector';

export interface QueryOperatorOptions extends OperatorOptions {
  select: string; // selection syntax query
}

/**
 * QueryOperator executes queries to return specific data within an object. This is most often the result of
 * using the JSON selector syntax.
 */
export class QueryOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    select: { required: true, type: ['string'] },
  };

  readonly index: number;

  constructor(public options: QueryOperatorOptions) {
    const { index = 0 } = options;
    this.index = index;
  }

  handleData(data: any[]): any[] | null {
    // NOTE to support selection syntax, we have to start with an object property so use $ as the root
    const { select: selector } = this.options;
    const selection = select(selector, { $: data[this.index] });
    return (selection === null || selection === undefined) ? null : [selection];
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(QueryOperator.specification);
  }
}
