import { expect } from 'chai';
import 'mocha';

import Console from './mocks/console';
import { FunctionOperator } from '../src/operators';
import { expectParams, expectNoCalls } from './utils/mocha';

const originalConsole = globalThis.console;
const console = new Console();

class ClosureConsole {
  constructor(private message: string) {
    // use constructor params
  }

  log() {
    console.log(this.message);
  }
}

describe('logger unit tests', () => {
  beforeEach(() => {
    (globalThis as any).console = console;
    (globalThis as any).testClosure = new ClosureConsole('Hello World');
  });

  afterEach(() => {
    (globalThis as any) = originalConsole;
    delete (globalThis as any).testClosure;
  });

  it('it should validate options', () => {
    expect(() => new FunctionOperator({
      name: 'function', func: 'console.log',
    }).validate()).to.not.throw();

    expect(() => new FunctionOperator({
      name: 'function',
      func: () => console.log('Hello World'),
    }).validate()).to.not.throw();

    expect(() => new FunctionOperator({
      name: 'function', func: () => console.log('Hello World'), thisArg: globalThis,
    }).validate()).to.not.throw();

    expect(() => new FunctionOperator({
      name: 'function', func: 'testClosure.log', thisArg: 'testClosure',
    }).validate()).to.not.throw();

    // @ts-ignore
    expect(() => new FunctionOperator({ name: 'function', func: 1234 }).validate()).to.throw();
    // @ts-ignore
    expect(() => new FunctionOperator({ name: 'function' }).validate()).to.throw();

    expect(() => new FunctionOperator({
      // @ts-ignore
      name: 'function', func: 'testClosure.log', thisArg: 1234,
    }).validate()).to.throw();

    expect(() => new FunctionOperator({
      name: 'function', func: () => console.log('Hello World'), thisArg: 'testClosure',
    }).validate()).to.throw();

    expect(() => new FunctionOperator({
      name: 'function', func: 'testClosure.log', thisArg: globalThis,
    }).validate()).to.throw();
  });

  it('it should call a function using string path', () => {
    expectNoCalls(console, 'log');

    const operator = new FunctionOperator({ name: 'function', func: 'console.log' });
    operator.handleData(['Hello World']);

    const [hello] = expectParams(console, 'log');
    expect(hello).to.eq('Hello World');
  });

  it('it should call a function (string-path) with proper this context', () => {
    expectNoCalls(console, 'log');

    const operator = new FunctionOperator({ name: 'function', func: 'testClosure.log', thisArg: 'testClosure' });
    operator.handleData([]);

    const [log] = expectParams(console, 'log');
    expect(log).to.eq('Hello World');
  });

  it('it should call a function using native function', () => {
    expectNoCalls(console, 'log');

    const operator = new FunctionOperator({ name: 'function', func: console.debug });
    operator.handleData(['Hello World']);

    const [debug] = expectParams(console, 'debug');
    expect(debug).to.eq('Hello World');
  });

  it('it should call a function (native) with proper this context', () => {
    expectNoCalls(console, 'log');

    const operator = new FunctionOperator({
      name: 'function',
      func: (globalThis as any).testClosure.log,
      thisArg: (globalThis as any).testClosure,
    });
    operator.handleData([]);

    const [log] = expectParams(console, 'log');
    expect(log).to.eq('Hello World');
  });

  it('it should not call a function (native) with unsupported context', () => {
    expectNoCalls(console, 'log');

    const operator = new FunctionOperator({
      // @ts-ignore
      name: 'function', func: (globalThis as any).testClosure.log, thisArg: 12345,
    });
    expect(() => operator.handleData([])).to.throw();

    expectNoCalls(console, 'log');
  });

  it('it should return null for invalid functions', () => {
    // @ts-ignore
    const operator = new FunctionOperator({ name: 'function', func: 1234 });
    const data = operator.handleData(['Hello World']);

    expect(data).to.be.null;
  });
});
