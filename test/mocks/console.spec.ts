import { expect } from 'chai';
import 'mocha';

import { Console } from './console';
import { expectParams, expectNoCalls } from '../utils/mocha';

const console = new Console();
const originalConsole = console;

describe('mock console unit tests', () => {
  before(() => {
    // @ts-ignore
    globalThis.console = console;
  });

  after(() => {
    // @ts-ignore
    globalThis.console = originalConsole;
  });

  it('it should add method calls into call queues', () => {
    expectNoCalls(console, 'log');
    console.log('Hello Log');
    const [log] = expectParams(console, 'log');
    expect(log).to.eq('Hello Log');

    expectNoCalls(console, 'error');
    console.error('Hello Error');
    const [error] = expectParams(console, 'error');
    expect(error).to.eq('Hello Error');

    expectNoCalls(console, 'warn');
    console.warn('Hello Warn');
    const [warn] = expectParams(console, 'warn');
    expect(warn).to.eq('Hello Warn');

    expectNoCalls(console, 'info');
    console.info('Hello Info');
    const [info] = expectParams(console, 'info');
    expect(info).to.eq('Hello Info');

    expectNoCalls(console, 'debug');
    console.debug('Hello Debug');
    const [debug] = expectParams(console, 'debug');
    expect(debug).to.eq('Hello Debug');
  });
});
