import { expect } from 'chai';
import 'mocha';

import { JSDOM } from 'jsdom';
import {
  ConsoleAppender,
  DataLayerObserver, FS_API_CONSTANTS, Logger, LogMessage, LogMessageType,
} from '../src';
import Console from './mocks/console';
import { expectNoCalls, expectParams } from './utils/mocha';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const originalConsole = globalThis.console;
const mockConsole = new Console();

describe.only('domSource unit tests', () => {
  beforeEach(() => {
    Logger.getInstance().appender = new ConsoleAppender();
    (globalThis as any).console = mockConsole;
  });

  afterEach(() => {
    (globalThis as any).console = originalConsole;
  });

  it('it should log error when missing both source and domSource', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    observer.registerRule({ destination: 'foo' });
    const [error] = expectParams(mockConsole, 'error');
    expect(error).to.eq(`${LogMessageType.RuleInvalid} ${JSON.stringify({ reason: LogMessage.MissingSource })}`);
  });

  it('it should log error when both source and domSource are present', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    // @ts-ignore
    observer.registerRule({ source: 'foo', domSource: 'bar', destination: 'test' });
    const [error] = expectParams(mockConsole, 'error');
    expect(error).to.eq(
      `${LogMessageType.RuleInvalid} ${JSON.stringify({ reason: LogMessage.DuplicateSource })}`,
    );
  });

  it('it should not log error when either source or domSource are present', () => {
    const observer = new DataLayerObserver();
    (globalThis as any).foo = 'test';
    (globalThis as any).bar = () => mockConsole.log('Test');
    // no fsApi or destination
    observer.registerRule({ source: 'foo', fsApi: FS_API_CONSTANTS.SET_IDENTITY });
    expectNoCalls(mockConsole, 'error');
    observer.registerRule({ domSource: 'foo', destination: 'bar' });
    expectNoCalls(mockConsole, 'error');
    delete (globalThis as any).foo;
    delete (globalThis as any).bar;
  });

  // figure out a way to setup DOM and parse
  it('it should not throw an error when selector is not found', () => {
    const dom = new JSDOM(
      `<html>
       <body>
       </body>
     </html>`,
    );
    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    const observer = new DataLayerObserver();
    observer.registerRule({ domSource: 'foo', destination: 'console.log' });
    expectNoCalls(mockConsole, 'error');
    expectNoCalls(mockConsole, 'log');
  });

  it('it should output when selector is found', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'>{ "test": "foo" }</script>
         </head>
         <body>
         </body>
       </html>`,
    );
    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    const observer = new DataLayerObserver();
    observer.registerRule({ domSource: '[type="application/ld+json"]', operators: [], destination: 'console.log' });
    setTimeout(() => {
      expectNoCalls(mockConsole, 'error');
      const [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test: 'foo' });
      done();
    });
  });
});
