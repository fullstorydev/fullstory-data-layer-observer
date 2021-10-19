import { JsOperator } from './js';
import { OperatorOptions } from '../operator';

export interface CombineOperatorOptions extends OperatorOptions {
  index?: number;
  properties?: string[];
  separator?: string,
  outputProperty: string;
}

export class CombineOperator extends JsOperator {
  constructor(options: CombineOperatorOptions) {
    super({
      name: options.name,
      index: options.index,
      inputProperties: options.properties,
      function: 'join',
      args: [options.separator || ''],
      outputProperty: options.outputProperty,
    });
  }
}
