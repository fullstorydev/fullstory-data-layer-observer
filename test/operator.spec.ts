import { expect } from 'chai';
import 'mocha';

import { OperatorFactory } from '../src/factory';
import { FunctionOperatorOptions } from '../src/operators';
import {
  Operator, OperatorOptions, OperatorValidator, OperatorSpecification,
} from '../src/operator';

class MockOperator implements Operator {
  options: OperatorOptions = {
    name: 'mock',
    requiredString: 'Hello World',
    requiredNumber: 1,
    requiredBoolean: true,
    requiredFunction: () => console.log('Hello World'), // eslint-disable-line
    requiredObject: {},
    optionalString: 'Goodbye World',
  };

  specification: OperatorSpecification = {
    requiredString: { required: true, type: 'string', dependencies: ['requiredFunction', 'requiredObject'] },
    requiredNumber: { required: true, type: 'NumBer' },
    requiredBoolean: { required: true, type: 'boolean' },
    requiredFunction: { required: true, type: ['string', 'FUNCTION'] },
    requiredObject: { required: true, type: 'Object' },
    optionalString: { required: false, type: 'string' },
  };

  /* eslint-disable-next-line class-methods-use-this */
  handleData(data: any[]): any[] | null {
    return data;
  }

  /* eslint-disable-next-line class-methods-use-this */
  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(this.specification);
  }
}

describe('operator unit tests', () => {
  it('operators can be created from the factory', () => {
    const functionOptions = {
      name: 'function',
      func: 'console.log',
    } as FunctionOperatorOptions;

    const operator = OperatorFactory.create('function', functionOptions);
    expect(operator).to.not.be.undefined;
  });

  it('unknown operators should throw an error', () => {
    // @ts-ignore
    expect(() => OperatorFactory.create('unknown', {})).to.throw();
  });

  it('operators should have a name', () => {
    const operator = new MockOperator();
    delete operator.options.name;
    expect(() => operator.validate()).to.throw();
  });

  it('operators should be validated per specification', () => {
    const operator = new MockOperator();
    expect(() => operator.validate()).to.not.throw();

    delete operator.options.requiredObject;
    expect(() => operator.validate()).to.throw();
  });

  it('operators should error if additional unknown options are found', () => {
    const operator = new MockOperator();
    operator.options.unknown = true;
    expect(() => operator.validate()).to.throw();
  });
});
