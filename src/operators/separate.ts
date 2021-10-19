import { JsOperator } from './js';
import { OperatorOptions } from '../operator';

export interface SeparateOperatorOptions extends OperatorOptions {
  index?: number;
  property?: string;
  delimiter: string,
  outputProperty: string;
}

export class SeparateOperator extends JsOperator {
  constructor(options: SeparateOperatorOptions) {
    super({
      name: options.name,
      index: options.index,
      inputProperties: options.property,
      function: 'split',
      args: [options.delimiter],
      outputProperty: options.outputProperty,
    });
  }
}
