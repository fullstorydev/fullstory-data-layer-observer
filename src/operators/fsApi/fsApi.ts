import { Operator, OperatorOptions, OperatorValidator } from '../../operator';
import { getGlobal } from '../../utils/object';

export interface FSApiOperatorOptions extends OperatorOptions {

}

export default abstract class FSApiOperator implements Operator {
  static specification = {};

  constructor(public options:FSApiOperatorOptions) {
    // sets this.options
  }

  handleData(data: any[]): any[] | null {
    const thisArg: object = getGlobal();
    // @ts-ignore
    const fsFunction:any = thisArg[thisArg._fs_namespace]; // eslint-disable-line
    if (typeof fsFunction !== 'function') {
      throw new Error('_fs_namespace is not a function');
    }

    const realData = this.prepareData(data);
    const returnValue = fsFunction.apply(thisArg, realData);
    if (returnValue === undefined || returnValue === null) {
      return null;
    }
    return [returnValue];
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(FSApiOperator.specification);
  }

  abstract prepareData(inputData:any[]): any[];
}
