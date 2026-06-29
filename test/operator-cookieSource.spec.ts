import { expect } from 'chai';
import 'mocha';

import {
  ConsoleAppender,
  DataLayerObserver, FS_API_CONSTANTS, Logger, LogMessage, LogMessageType,
} from '../src';
import Console from './mocks/console';
import { expectNoCalls, expectParams } from './utils/mocha';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const originalConsole = globalThis.console;
const mockConsole = new Console();

describe.only('cookieSource unit tests', () => {
  beforeEach(() => {
    Logger.getInstance().appender = new ConsoleAppender();
    (globalThis as any).console = mockConsole;
  });

  afterEach(() => {
    (globalThis as any).console = originalConsole;
  });

  it('it should log error when missing source, domSource, and cookieSource', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    observer.registerRule({ destination: 'foo' });
    const [error] = expectParams(mockConsole, 'error');
    expect(error).to.eq(`${LogMessageType.RuleInvalid} ${JSON.stringify({ reason: LogMessage.MissingSource })}`);
  });

  it('it should log error when both source and cookieSource are present', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    // @ts-ignore
    observer.registerRule({ source: 'foo', cookieSource: ['bar'], destination: 'test' });
    const [error] = expectParams(mockConsole, 'error');
    expect(error).to.eq(
      `${LogMessageType.RuleInvalid} ${JSON.stringify({ reason: LogMessage.DuplicateSource })}`,
    );
  });

  it('it should log error when both domSource and cookieSource are present', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    // @ts-ignore
    observer.registerRule({ domSource: 'foo', cookieSource: ['bar'], destination: 'test' });
    const [error] = expectParams(mockConsole, 'error');
    expect(error).to.eq(
      `${LogMessageType.RuleInvalid} ${JSON.stringify({ reason: LogMessage.DuplicateSource })}`,
    );
  });

  it('it should not log error when either source or cookieSource are present', () => {
    const observer = new DataLayerObserver();
    (globalThis as any).foo = 'test';
    (globalThis as any).bar = () => mockConsole.log('Test');
    // no fsApi or destination
    observer.registerRule({ source: 'foo', fsApi: FS_API_CONSTANTS.SET_IDENTITY });
    expectNoCalls(mockConsole, 'error');
    observer.registerRule({ cookieSource: ['foo'], destination: 'bar' });
    expectNoCalls(mockConsole, 'error');
    delete (globalThis as any).foo;
    delete (globalThis as any).bar;
  });

  it('it should not throw an error when cookie is not found', () => {
    (globalThis as any).document = {
      cookie: '',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo'], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    expectNoCalls(mockConsole, 'log');
  });

  it('it should output when cookie is found', () => {
    (globalThis as any).document = {
      cookie: 'foo=bar',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq({ foo: 'bar' });
  });

  it('it should not fail when cookie is invalid', () => {
    (globalThis as any).document = {
      cookie: 'foo|bar',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'log');
    expectNoCalls(mockConsole, 'error');
  });

  it('it should deal many cookies', () => {
    (globalThis as any).document = {
      cookie: 'foo=bar; one=two;',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo', 'one'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'bar',
        one: 'two',
      },
    );
  });

  it('it should deal with many cookies and some missing', () => {
    (globalThis as any).document = {
      cookie: 'foo=bar; one=two; three=four',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo', 'four', 'one'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'bar',
        one: 'two',
      },
    );
  });

  it('it should deal with encoded cookies', () => {
    (globalThis as any).document = {
      cookie: 'foo=bar; one=two%20three; four=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo', 'one', 'four'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'bar',
        one: 'two three',
        four: 'five',
      },
    );
  });

  it('it should deal with encoded cookie names', () => {
    (globalThis as any).document = {
      cookie: 'foo%20one=bar; one=two%20three; four%20six=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo one', 'one', 'four six'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        'foo one': 'bar',
        one: 'two three',
        'four six': 'five',
      },
    );
  });

  it('it should deal with cookies with = in their value', () => {
    (globalThis as any).document = {
      cookie: 'foo=bar; one=two=three=four; four=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo', 'one', 'four'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'bar',
        one: 'two=three=four',
        four: 'five',
      },
    );
  });

  it('it should deal with cookies that end with multiple = in their value', () => {
    (globalThis as any).document = {
      cookie: 'foo=bar; one=two==; four=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo', 'one', 'four'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'bar',
        one: 'two==',
        four: 'five',
      },
    );
  });

  it('it should deal with cookies that have weird whitespace', () => {
    (globalThis as any).document = {
      cookie: ' foo=bar;one=two== ; four=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo', 'one', 'four'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'bar',
        one: 'two==',
        four: 'five',
      },
    );
  });

  it('it should deal with cookies that have no value', () => {
    (globalThis as any).document = {
      cookie: ' foo=; one=two; four=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['foo', 'one', 'four'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: '',
        one: 'two',
        four: 'five',
      },
    );
  });

  it('it should work with starts with operator', () => {
    (globalThis as any).document = {
      cookie: ' foo=; one=two; four=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['^foo', '^one', '^four'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: '',
        one: 'two',
        four: 'five',
      },
    );
  });

  it('it should work with starts with multiple match', () => {
    (globalThis as any).document = {
      cookie: 'foo=one; footie=two; foosball=five',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['^foo'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'one',
        footie: 'two',
        foosball: 'five',
      },
    );
  });

  it('it should work with starts with and exact match', () => {
    (globalThis as any).document = {
      cookie: 'foo=one; footie=two; foosball=five; test=test',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['^foo', 'test'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'one',
        footie: 'two',
        foosball: 'five',
        test: 'test',
      },
    );
  });

  it('it should work with starts with and no match', () => {
    (globalThis as any).document = {
      cookie: 'foo=one; footie=two; foosball=five; test=test',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['^foob'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    expectNoCalls(mockConsole, 'log');
  });

  it('it should not break with starts with and special characters in test', () => {
    (globalThis as any).document = {
      cookie: 'foo=one; footie=two; foosball=five; test=test',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['^^foo'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    expectNoCalls(mockConsole, 'log');
  });

  it('it should not break with starts with and special characters in cookie', () => {
    (globalThis as any).document = {
      cookie: 'foo=one; ^footie=two; foosball=five; test=test',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['^foo'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    const [log] = expectParams(mockConsole, 'log');
    expect(log).to.be.deep.eq(
      {
        foo: 'one',
        foosball: 'five',
      },
    );
  });

  it('it should not work with starts with and wildcard/empty match', () => {
    (globalThis as any).document = {
      cookie: 'foo=one; footie=two; foosball=five; test=test',
    };
    const observer = new DataLayerObserver();
    observer.registerRule({ cookieSource: ['^'], operators: [], destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    expectNoCalls(mockConsole, 'log');
  });
});
