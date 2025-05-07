import { expect } from 'chai';
import 'mocha';

import { JSDOM } from 'jsdom';
import deepcopy from 'deepcopy';
import {
  DataLayerObserver, FS_API_CONSTANTS, LogMessage, LogMessageType,
} from '../src';
import Console from './mocks/console';
import { expectNoCalls, ExpectObserver, expectParams } from './utils/mocha';
import FullStory from './mocks/fullstory-recording';
import { basicDigitalData, CEDDL } from './mocks/CEDDL';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const originalConsole = globalThis.console;

interface GlobalMock {
  dataLayer: any[],
  digitalData: CEDDL,
  FS: FullStory
  console: Console,
}
let globalMock: GlobalMock;

describe.only('domSource unit tests', () => {
  beforeEach(() => {
    (globalThis as any).dataLayer = [];
    (globalThis as any).digitalData = deepcopy(basicDigitalData); // NOTE copy so mutations don't pollute tests
    (globalThis as any).console = new Console();
    (globalThis as any).FS = new FullStory();
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).dataLayer;
    delete (globalThis as any).digitalData;
    delete (globalThis as any).FS;
    (globalThis as any).console = originalConsole;
  });

  it('it should log error when missing both source and domSource', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    observer.registerRule({ destination: 'foo' });
    const [error] = expectParams(globalMock.console, 'error');
    expect(error).to.eq(`${LogMessageType.RuleInvalid} ${JSON.stringify({ reason: LogMessage.MissingSource })}`);
  });

  it('it should log error when both source and domSource are present', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    // @ts-ignore
    observer.registerRule({ source: 'foo', domSource: 'bar', destination: 'test' });
    const [error] = expectParams(globalMock.console, 'error');
    expect(error).to.eq(
      `${LogMessageType.RuleInvalid} ${JSON.stringify({ reason: LogMessage.DuplicateSource })}`,
    );
  });

  it('it should not log error when either source or domSource are present', () => {
    const observer = new DataLayerObserver();
    (globalThis as any).foo = 'test';
    (globalThis as any).bar = () => globalMock.console.log('Test');
    // no fsApi or destination
    observer.registerRule({ source: 'foo', fsApi: FS_API_CONSTANTS.SET_IDENTITY });
    expectNoCalls(globalMock.console, 'error');
    observer.registerRule({ domSource: 'foo', destination: 'bar' });
    expectNoCalls(globalMock.console, 'error');
    delete (globalThis as any).foo;
    delete (globalThis as any).bar;
  });

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
    expectNoCalls(globalMock.console, 'error');
    expectNoCalls(globalMock.console, 'log');
  });

  it.only('it should output when selector is found', () => {
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
    const observer = ExpectObserver.getInstance().create(
      {
        readOnLoad: true,
        rules: [{
          // source: 'digitalData.page.pageInfo',
          domSource: '[type="application/ld+json"]',
          operators: [],
          destination: 'console.log',
        },
        ],
      },
    );
    expectParams(globalMock.console, 'log');
    ExpectObserver.getInstance().cleanup(observer);
  });
});
