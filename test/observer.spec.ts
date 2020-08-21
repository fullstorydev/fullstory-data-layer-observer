/* eslint-disable max-classes-per-file */
import { expect } from 'chai';
import 'mocha';

import { DataLayerObserver } from '../src/observer';
import {
  basicDigitalData, CEDDL, PageCategory, Cart, TotalCartPrice,
} from './mocks/CEDDL';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
import { expectParams, expectNoCalls, expectCall } from './utils/mocha';
import { Operator, OperatorOptions } from '../src/operator';
import { LogEvent } from '../src/utils/logger';

class EchoOperator implements Operator {
  options: OperatorOptions = {
    name: 'echo',
    fail: false,
  };

  /* eslint-disable-next-line class-methods-use-this */
  handleData(data: any[]): any[] | null {
    return data;
  }

  /* eslint-disable-next-line class-methods-use-this */
  validate() {
    if (this.options.fail) {
      throw new Error('EchoOperator was set to fail');
    }
  }
}

class UppercaseOperator implements Operator {
  options: OperatorOptions = {
    name: 'toUpper',
  };

  /* eslint-disable-next-line class-methods-use-this */
  handleData(data: any[]): any[] | null {
    const upper: any = {};

    Object.getOwnPropertyNames(data[0]).forEach((key) => {
      if (typeof data[0][key] === 'string') {
        upper[key] = (data[0][key] as string).toUpperCase();
      }
    });

    return [upper];
  }

  /* eslint-disable-next-line class-methods-use-this */
  validate() {
    if (this.options.fail) {
      throw new Error();
    }
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
    (globalThis as any).digitalData = { ...basicDigitalData }; // NOTE copy so mutations don't pollute tests
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
      rules: [{
        source: 'digitalData.page.pageInfo', operators: [], destination: 'console.log', monitor: false,
      }],
    });
    expect(observer.handlers.length).to.eq(1);
  });

  it('rules without a source and destination are invalid', () => {
    const observer = new DataLayerObserver({
      rules: [
        // @ts-ignore
        { operators: [], destination: 'console.log' },
        // @ts-ignore
        { source: 'digitalData.page.pageInfo', operators: [], monitor: false },
      ],
    });
    expect(observer.handlers.length).to.eq(0);
  });

  it('it should read a data layer on-load for all rules', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = new DataLayerObserver({
      readOnLoad: true,
      rules: [
        {
          source: 'digitalData.page.pageInfo', operators: [], destination: 'console.log', monitor: false,
        },
        {
          source: 'digitalData.product[0].productInfo', operators: [], destination: 'console.log', monitor: false,
        },
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
          source: 'digitalData.page.pageInfo',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
          monitor: false,
        },
        {
          source: 'digitalData.product[0].productInfo', operators: [], destination: 'console.log', monitor: false,
        },
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

  it('invalid operators should remove a handler', () => {
    const observer = new DataLayerObserver({
      validateRules: true,
      rules: [{
        source: 'digitalData.page.pageInfo', operators: [], destination: 'console.log', monitor: false,
      }],
    });

    expect(observer.handlers.length).to.eq(1);

    const operator = new EchoOperator();
    operator.options.fail = true;

    expect(() => observer.addOperator(observer.handlers[0], operator)).to.throw();

    expect(observer.handlers.length).to.eq(0);
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
          source: 'digitalData.transaction',
          operators: [],
          destination: 'console.log',
          url: '/checkout$',
          monitor: false,
        },
        {
          source: 'digitalData.cart', operators: [], destination: 'console.log', url: '/cart$', monitor: false,
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
          monitor: false,
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
          monitor: false,
        },
      ],
    });

    expect(observer).to.not.be.undefined;

    const [profileInfo] = expectParams(globalMock.console, 'debug');
    expect(profileInfo).to.eq(globalMock.digitalData.user.profile[0].profileInfo);

    expectNoCalls(globalMock.FS, 'setUserVars');
  });

  it('debug can be enabled for a specific rule', () => {
    expectNoCalls(globalMock.console, 'debug');

    const observer = new DataLayerObserver();

    expect(observer).to.not.be.undefined;

    observer.registerOperator('toUpper', new UppercaseOperator());
    observer.processRule({
      source: 'digitalData.page.pageInfo',
      operators: [
        { name: 'toUpper' }],
      destination: 'console.log',
      debug: true,
      monitor: false,
    });
    observer.processRule({
      source: 'digitalData.product[0].productInfo',
      operators: [
        { name: 'toUpper' }],
      destination: 'console.log',
      monitor: false,
    });

    expect(observer.handlers.length).to.eq(2);
    observer.handlers[0].fireEvent();
    observer.handlers[1].fireEvent();

    // NOTE there should only be 4 debug statements for the first rule - one each for: entry, toUpper, function (destination), exit
    expectCall(globalMock.console, 'debug', 4);
  });

  it('it should register and call an operator before the destination', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = new DataLayerObserver({ beforeDestination: { name: 'toUpper' }, rules: [] });

    expect(observer).to.not.be.undefined;

    observer.registerOperator('toUpper', new UppercaseOperator());
    observer.processRule({
      source: 'digitalData.page.category',
      operators: [],
      destination: 'console.log',
      monitor: false,
    });

    expect(observer.handlers.length).to.eq(1);

    observer.handlers[0].fireEvent();

    const [category] = expectParams(globalMock.console, 'log');
    expect((category as PageCategory).primaryCategory).to.eq(
      globalMock.digitalData.page.category.primaryCategory.toUpperCase(),
    );
  });

  it('it should register a custom log appender', () => {
    expectNoCalls(globalMock.FS, 'event');

    class FullStoryAppender {
      constructor(private fs: FullStory) {
        // sets this.fs
      }

      log(event: LogEvent) {
        // eslint-disable-next-line camelcase
        const { level: level_int, message: message_str, datalayer: datalayer_str } = event;
        this.fs.event('Data Layer Observer', { level_int, message_str, datalayer_str }, 'dataLayerObserver');
      }
    }

    const observer = new DataLayerObserver({
      appender: new FullStoryAppender(globalMock.FS),
      readOnLoad: true,
      rules: [
        {
          source: 'digitalData.nonExistent', operators: [], destination: 'console.log', monitor: false,
        },
      ],
    });

    expect(observer).to.not.be.undefined;

    const [eventName, event, source] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('Data Layer Observer');
    expect(event).to.not.be.undefined;
    expect(source).to.eq('dataLayerObserver');
  });

  it('updating properties should trigger the data handler', () => {
    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'digitalData.cart[(cartID,price)]',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
          // monitor: true, // NOTE the default is true
        },
      ],
    });

    expect(observer).to.not.be.undefined;
    expect(globalMock.digitalData.cart).to.not.be.undefined;

    // check the readOnLoad
    const [cart] = expectParams(globalMock.console, 'log');
    expect(cart.cartID).to.eq(globalMock.digitalData.cart.cartID);

    globalMock.digitalData.cart.cartID = 'cart-5678';

    // check the assignment
    const [reassigned] = expectParams(globalMock.console, 'log');
    expect(reassigned.cartID).to.eq('cart-5678');
    expect((reassigned as Cart).item).to.be.undefined; // ensure selector picked

    const updatedPrice: TotalCartPrice = {
      basePrice: 15.55,
      voucherCode: '',
      voucherDiscount: 0,
      currency: 'USD',
      taxRate: 0.09,
      shipping: 5.0,
      shippingMethod: 'LTL',
      priceWithTax: 16.95,
      cartTotal: 21.95,
    };

    globalMock.digitalData.cart.price = updatedPrice;

    const [shippingChange] = expectParams(globalMock.console, 'log');
    expect(shippingChange.cartID).to.eq('cart-5678');
    expect((shippingChange as Cart).price).to.eq(updatedPrice);
    expect((shippingChange as Cart).item).to.be.undefined; // ensure selector picked
  });

  it('it should not add monitors for an invalid rule', () => {
    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'digitalData.cart[(cartID,price)]',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
          // monitor: true, // NOTE the default is true
        },
      ],
    });

    expect(observer).to.not.be.undefined;
    expect(globalMock.digitalData.cart).to.not.be.undefined;
  });
});
