/* eslint-disable max-classes-per-file */
import { expect } from 'chai';
import 'mocha';

import { DataLayerObserver } from '../src/observer';
import { basicDigitalData, CEDDL } from './mocks/CEDDL';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
import { expectParams, expectNoCalls } from './utils/mocha';
import { Operator, OperatorOptions } from '../src/operator';

class EchoOperator implements Operator {
  options: OperatorOptions;

  constructor(options?: OperatorOptions) {
    this.options = options || {
      name: 'echo',
    };
  }

  /* eslint-disable-next-line class-methods-use-this */
  handleData(data: any[]): any[] | null {
    return data;
  }

  /* eslint-disable-next-line class-methods-use-this */
  validate() {

  }
}

const originalConsole = console;

interface GlobalMock {
  digitalData: CEDDL,
  FS: FullStory
  console: Console,
}

let globalMock: GlobalMock;

describe('DataLayerObserver unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = basicDigitalData;
    (globalThis as any).console = new Console();
    (globalThis as any).FS = new FullStory();
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
    delete (globalThis as any).FS;
    (globalThis as any).console = originalConsole;
  });

  it('it should initialize with defaults', () => {
    const observer = new DataLayerObserver();
    expect(observer).to.not.be.undefined;
    expect(observer).to.not.be.null;
  });

  it('it should automatically parse config rules', () => {
    const observer = new DataLayerObserver({
      rules: [{ source: 'digitalData.page.pageInfo', operators: [], destination: 'console.log' }],
    });
    expect(observer.handlers.length).to.eq(1);
  });

  it('rules without a source and destination are invalid', () => {
    const observer = new DataLayerObserver({
      // @ts-ignore
      rules: [{ operators: [], destination: 'console.log' }, { source: 'digitalData.page.pageInfo', operators: [] }],
    });
    expect(observer.handlers.length).to.eq(0);
  });

  it('it should read a data layer on-load for all rules', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = new DataLayerObserver({
      readOnLoad: true,
      rules: [
        { source: 'digitalData.page.pageInfo', operators: [], destination: 'console.log' },
        { source: 'digitalData.product[0].productInfo', operators: [], destination: 'console.log' },
      ],
    });

    expect(observer).to.not.be.undefined;

    const [productInfo] = expectParams(globalMock.console, 'log');
    expect(productInfo).to.eq(globalMock.digitalData.product[0].productInfo);

    const [pageInfo] = expectParams(globalMock.console, 'log');
    expect(pageInfo).to.eq(globalMock.digitalData.page.pageInfo);
  });

  it('it should read a data layer on-load for specific rules', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'digitalData.page.pageInfo', operators: [], destination: 'console.log', readOnLoad: true,
        },
        { source: 'digitalData.product[0].productInfo', operators: [], destination: 'console.log' },
      ],
    });

    expect(observer).to.not.be.undefined;

    const [pageInfo] = expectParams(globalMock.console, 'log');
    expect(pageInfo).to.eq(globalMock.digitalData.page.pageInfo);

    expectNoCalls(globalMock.console, 'log');
  });

  it('it should allow custom operators to be registered', () => {
    const observer = new DataLayerObserver();

    observer.registerOperator('echo', new EchoOperator());
  });

  it('it should not register operators with existing names', () => {
    const observer = new DataLayerObserver();

    expect(() => { observer.registerOperator('function', new EchoOperator()); }).to.throw();
  });

  it('only valid pages should process a rule', () => {
    expectNoCalls(globalMock.console, 'log');

    const urlValidator = (url: string | undefined) => (url ? RegExp(url).test('https://www.fullstory.com/cart') : true);

    const observer = new DataLayerObserver({
      readOnLoad: true,
      urlValidator,
      rules: [
        {
          source: 'digitalData.transaction', operators: [], destination: 'console.log', url: '/checkout$',
        },
        {
          source: 'digitalData.cart', operators: [], destination: 'console.log', url: '/cart$',
        },
      ],
    });

    expect(observer.handlers.length).to.eq(1);

    const [cart] = expectParams(globalMock.console, 'log');
    expect(cart).to.eq(globalMock.digitalData.cart);

    expectNoCalls(globalMock.console, 'log');
  });

  it('previewMode defaults to console.log', () => {
    expectNoCalls(globalMock.console, 'log');
    expectNoCalls(globalMock.FS, 'setUserVars');

    const observer = new DataLayerObserver({
      previewMode: true,
      readOnLoad: true,
      rules: [
        {
          source: 'digitalData.user.profile[0].profileInfo',
          operators: [],
          destination: 'FS.setUserVars',
        },
      ],
    });

    expect(observer).to.not.be.undefined;

    const [profileInfo] = expectParams(globalMock.console, 'log');
    expect(profileInfo).to.eq(globalMock.digitalData.user.profile[0].profileInfo);

    expectNoCalls(globalMock.FS, 'setUserVars');
  });

  it('previewMode can be configured', () => {
    expectNoCalls(globalMock.console, 'debug');
    expectNoCalls(globalMock.FS, 'setUserVars');

    const observer = new DataLayerObserver({
      previewMode: true,
      previewDestination: 'console.debug',
      readOnLoad: true,
      rules: [
        {
          source: 'digitalData.user.profile[0].profileInfo',
          operators: [],
          destination: 'FS.setUserVars',
        },
      ],
    });

    expect(observer).to.not.be.undefined;

    const [profileInfo] = expectParams(globalMock.console, 'debug');
    expect(profileInfo).to.eq(globalMock.digitalData.user.profile[0].profileInfo);

    expectNoCalls(globalMock.FS, 'setUserVars');
  });
});
