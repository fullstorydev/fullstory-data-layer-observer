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

describe('domSource unit tests', () => {
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

  it('it should not fail when JSON is invalid', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'>{ "test: "foo" }</script>
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
      expectNoCalls(mockConsole, 'log');
      expectNoCalls(mockConsole, 'error');
      done();
    });
  });

  it('it should deal with nested JSON', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'>
             {
                "name": "John Smith",
                "age": 30,
                "city": "New York",
                "isStudent": false,
                "hobbies": ["reading", "hiking", "coding"],
                "address": {
                  "street": "123 Main St",
                  "zipCode": "10001"
                },
                "courses": null
            }
           </script>
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
      expect(log).to.be.deep.eq(
        {
          name: 'John Smith',
          age: 30,
          city: 'New York',
          isStudent: false,
          hobbies: ['reading', 'hiking', 'coding'],
          address: {
            street: '123 Main St',
            zipCode: '10001',
          },
          courses: null,
        },
      );
      done();
    });
  });

  // no text content
  it('it should produce nothing with no text content', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'></script>
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
      expectNoCalls(mockConsole, 'log');
      done();
    });
  });

  it('it should work with array of JSON', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'>
           [ 
              { "test": "foo" },
              { "test1": "foo1" },
              { "test2": "foo2" }
           ]   
            </script>
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
      let [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test2: 'foo2' });
      [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test1: 'foo1' });
      [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test: 'foo' });
      done();
    });
  });

  it('it should work when selector found inside body', (done) => {
    const dom = new JSDOM(
      `<html>
         <body>
            <div>
               <div>
                 <span type='application/ld+json'>{ "test": "foo" }</span>
               </div>
            </div>
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

  it('it should work when selector is found multiple times', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'>{ "test": "foo" }</script>
         </head>
         <body>
           <span type='application/ld+json'>{ "test1": "foo1" }</span>
         </body>
       </html>`,
    );
    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    const observer = new DataLayerObserver();
    observer.registerRule({ domSource: '[type="application/ld+json"]', operators: [], destination: 'console.log' });
    setTimeout(() => {
      expectNoCalls(mockConsole, 'error');
      let [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test1: 'foo1' });
      [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test: 'foo' });
      done();
    });
  });

  it('it should work when selector is found multiple times with arrays', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'>[
             { "test": "foo" },
             { "test1": "foo1" }
             ]
           </script>
         </head>
         <body>
           <span type='application/ld+json'>[
              { "test2": "foo2" },
              { "test3": "foo3" }
            ]
            </span>
         </body>
       </html>`,
    );
    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    const observer = new DataLayerObserver();
    observer.registerRule({ domSource: '[type="application/ld+json"]', operators: [], destination: 'console.log' });
    setTimeout(() => {
      expectNoCalls(mockConsole, 'error');
      let [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test3: 'foo3' });
      [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test2: 'foo2' });
      [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test1: 'foo1' });
      [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test: 'foo' });
      done();
    });
  });

  it('it should work when selector is found multiple times but some are bad JSON', (done) => {
    const dom = new JSDOM(
      `<html>
         <head>
           <script type='application/ld+json'>{ "test": "foo" }</script>
         </head>
         <body>
           <span type='application/ld+json'>{ "test1": "foo1" }</span>
           <div type='application/ld+json'>{ "test2: "foo2" }</div>
         </body>
       </html>`,
    );
    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    const observer = new DataLayerObserver();
    observer.registerRule({ domSource: '[type="application/ld+json"]', operators: [], destination: 'console.log' });
    setTimeout(() => {
      expectNoCalls(mockConsole, 'error');
      let [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test1: 'foo1' });
      [log] = expectParams(mockConsole, 'log');
      expect(log).to.be.deep.eq({ test: 'foo' });
      done();
    });
  });
});
