/* eslint-disable max-classes-per-file */
import { expect } from 'chai';
import deepcopy from 'deepcopy';
import 'mocha';

import {
  basicDigitalData, CEDDL, PageCategory, Cart, TotalCartPrice,
} from './mocks/CEDDL';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
import {
  expectParams, expectNoCalls, expectCall, ExpectObserver, expectGlobal, expectEqual, setGlobal,
} from './utils/mocha';
import { Operator, OperatorOptions } from '../src/operator';
import { LogEvent, LogLevel, Logger } from '../src/utils/logger';
import DataHandler from '../src/handler';
import { MockClass } from './mocks/mock';
import MonitorFactory from '../src/monitor-factory';
import { DataLayerObserver } from '../src/observer';
import DataLayerTarget from '../src/target';

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

class MockAppender extends MockClass {
  /* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
  log(event: LogEvent) { }
}

const originalConsole = console;

interface GlobalMock {
  dataLayer: any[],
  digitalData: CEDDL,
  FS: FullStory
  console: Console,
}

let globalMock: GlobalMock;

describe('DataLayerObserver unit tests', () => {
  beforeEach(() => {
    (globalThis as any).dataLayer = [];
    (globalThis as any).digitalData = deepcopy(basicDigitalData); // NOTE copy so mutations don't pollute tests
    (globalThis as any).console = new Console();
    (globalThis as any).FS = new FullStory(); // eslint-disable-line no-underscore-dangle
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).dataLayer;
    delete (globalThis as any).digitalData;
    delete (globalThis as any).FS;
    (globalThis as any).console = originalConsole;
  });

  it('it should initialize with defaults', () => {
    const observer = ExpectObserver.getInstance().default();
    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should automatically parse config rules', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [{
        source: 'digitalData.page.pageInfo', operators: [], destination: 'console.log', monitor: false,
      }],
    });
    ExpectObserver.getInstance().cleanup(observer);
  });

  it('rules without a source and destination are invalid', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        // @ts-ignore
        { operators: [], destination: 'console.log', monitor: false },
        // @ts-ignore
        { source: 'digitalData.page.pageInfo', operators: [], monitor: false },
      ],
    }, false);
    expect(observer.handlers.length).to.eq(0);
    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should read a data layer on-load for all rules', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = ExpectObserver.getInstance().create({
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

    const [productInfo] = expectParams(globalMock.console, 'log');
    expect(productInfo).to.eq(globalMock.digitalData.product[0].productInfo);

    const [pageInfo] = expectParams(globalMock.console, 'log');
    expect(pageInfo).to.eq(globalMock.digitalData.page.pageInfo);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should read a data layer on-load for specific rules', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = ExpectObserver.getInstance().create({
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

    const [pageInfo] = expectParams(globalMock.console, 'log');
    expect(pageInfo).to.eq(globalMock.digitalData.page.pageInfo);

    expectNoCalls(globalMock.console, 'log');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('rule-specific readOnLoad overrides global readOnLoad', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = ExpectObserver.getInstance().create({
      readOnLoad: true,
      rules: [
        {
          source: 'digitalData.page.pageInfo',
          operators: [],
          destination: 'console.log',
          readOnLoad: false,
        },
      ],
    });

    expectNoCalls(globalMock.console, 'log');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should allow custom operators to be registered', () => {
    const observer = ExpectObserver.getInstance().default();
    observer.registerOperator('echo', new EchoOperator());
    ExpectObserver.getInstance().cleanup(observer);
  });

  it('invalid operators should remove a handler', (done) => {
    const observer = ExpectObserver.getInstance().create({
      validateRules: true,
      rules: [{
        source: 'digitalData.page.pageInfo',
        operators: [{ name: 'insert' }],
        destination: 'console.log',
        monitor: false,
      }],
    }, false);

    // invalid rules throw an exception so wait until registration retries finish
    setTimeout(() => {
      expect(observer.handlers.length).to.eq(0);
      ExpectObserver.getInstance().cleanup(observer);
      done();
    }, 1800);
  });

  it('it should not register operators with existing names', () => {
    const observer = ExpectObserver.getInstance().default();
    expect(() => { observer.registerOperator('function', new EchoOperator()); }).to.throw();
    ExpectObserver.getInstance().cleanup(observer);
  });

  it('only valid pages should process a rule', () => {
    expectNoCalls(globalMock.console, 'log');

    const urlValidator = (url: string | undefined) => (url ? RegExp(url).test('https://www.fullstory.com/cart') : true);

    const observer = ExpectObserver.getInstance().create({
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
    }, false);

    expect(observer.handlers.length).to.eq(1);

    const [cart] = expectParams(globalMock.console, 'log');
    expect(cart).to.eq(globalMock.digitalData.cart);

    expectNoCalls(globalMock.console, 'log');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('previewMode defaults to console.log', () => {
    expectNoCalls(globalMock.console, 'log');
    expectNoCalls(globalMock.FS, 'setUserVars');

    const observer = ExpectObserver.getInstance().create({
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

    const [profileInfo] = expectParams(globalMock.console, 'log');
    expect(profileInfo).to.eq(globalMock.digitalData.user.profile[0].profileInfo);

    expectNoCalls(globalMock.FS, 'setUserVars');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('previewMode can be configured', () => {
    expectNoCalls(globalMock.console, 'debug');
    expectNoCalls(globalMock.FS, 'setUserVars');

    const observer = ExpectObserver.getInstance().create({
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

    const [profileInfo] = expectParams(globalMock.console, 'debug');
    expect(profileInfo).to.eq(globalMock.digitalData.user.profile[0].profileInfo);

    expectNoCalls(globalMock.FS, 'setUserVars');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('debug can be enabled for a specific rule', () => {
    expectNoCalls(globalMock.console, 'debug');

    const observer = ExpectObserver.getInstance().default();

    observer.registerOperator('toUpper', new UppercaseOperator());
    observer.registerRule({
      source: 'digitalData.page.pageInfo',
      operators: [
        { name: 'toUpper' }],
      destination: 'console.log',
      debug: true,
      monitor: false,
    });
    observer.registerRule({
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

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should register and call an operator before the destination', () => {
    expectNoCalls(globalMock.console, 'log');

    const observer = ExpectObserver.getInstance().create({ beforeDestination: { name: 'toUpper' }, rules: [] });

    observer.registerOperator('toUpper', new UppercaseOperator());
    observer.registerRule({
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

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should register and call multiple operators before the destination', () => {
    const observer = ExpectObserver.getInstance().create({
      beforeDestination: [
        { name: 'toUpper' },
        { name: 'suffix' }, // NOTE suffix is a built-in operator
      ],
      rules: [],
    });

    observer.registerOperator('toUpper', new UppercaseOperator());
    observer.registerRule({
      source: 'digitalData.page.category',
      operators: [],
      destination: 'console.log',
      monitor: false,
    });

    expect(observer.handlers.length).to.eq(1);

    observer.handlers[0].fireEvent();

    const [category] = expectParams(globalMock.console, 'log');
    expect(category.primaryCategory_str).to.eq(
      globalMock.digitalData.page.category.primaryCategory.toUpperCase(),
    );

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should register a custom log appender', () => {
    expectNoCalls(globalMock.FS, 'event');

    const appender = new MockAppender();

    const observer = ExpectObserver.getInstance().create({
      appender,
      readOnLoad: true,
      rules: [
        // @ts-ignore NOTE The missing destination throws an exception before registerRule's setTimeout
        { source: 'digitalData.page', operators: [], monitor: false },
      ],
    }, false);

    const [event] = expectParams(appender, 'log');
    expect(event).to.not.be.undefined;

    ExpectObserver.getInstance().cleanup(observer);
  });

  [
    { configLevel: 0, expectedLevel: 0 },
    { configLevel: 1, expectedLevel: 1 },
    { configLevel: 2, expectedLevel: 2 },
    { configLevel: 3, expectedLevel: 3 },
    // Passing undefined shouldn't change the global log level
    { configLevel: undefined, expectedLevel: () => Logger.getInstance().level },
  ].forEach((tc) => {
    it(`sets the global log level to ${tc.expectedLevel} given config value ${tc.configLevel}`, () => {
      const expectedLevel = typeof tc.expectedLevel === 'function' ? tc.expectedLevel() : tc.expectedLevel;

      const observer = ExpectObserver.getInstance().create({
        logLevel: tc.configLevel,
        rules: [],
      });

      expect(Logger.getInstance().level).to.equal(expectedLevel);

      ExpectObserver.getInstance().cleanup(observer);
    });
  });

  it('updating properties should trigger the data handler', (done) => {
    let changes: any[] = [];

    const observer = ExpectObserver.getInstance().create({
      rules: [
        {
          source: 'digitalData.cart[(cartID,price)]',
          operators: [],
          destination: (...data: any[]) => {
            // NOTE use a local destination to prevent cross-test pollution
            changes = data;
          },
          readOnLoad: true,
          // monitor: true, // NOTE the default is true
        },
      ],
    }, true);

    expect(globalMock.digitalData.cart).to.not.be.undefined;

    // check the readOnLoad
    const [cart] = changes;
    expect(cart.cartID).to.eq(globalMock.digitalData.cart.cartID);

    globalMock.digitalData.cart.cartID = 'cart-5678';

    // check the assignment
    setTimeout(() => {
      const [reassigned] = changes;
      expect(reassigned.cartID).to.eq('cart-5678');
      expect((reassigned as Cart).item).to.be.undefined; // ensure selector picked
    }, DataHandler.DefaultDebounceTime * 1.5);

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

    setTimeout(() => {
      const [shippingChange] = changes;
      expect(shippingChange.cartID).to.eq('cart-5678');
      expect((shippingChange as Cart).price).to.eq(updatedPrice);
      expect((shippingChange as Cart).item).to.be.undefined; // ensure selector picked

      ExpectObserver.getInstance().cleanup(observer);
      done();
    }, DataHandler.DefaultDebounceTime * 1.5);
  });

  it('debounce window can be adjusted to trigger the data handler', (done) => {
    const debounce = 10; // 10ms debounce window
    const changes: any[] = [];

    const observer = ExpectObserver.getInstance().create({
      rules: [{
        source: 'digitalData.cart[(cartID)]',
        operators: [],
        destination: (...data: any[]) => {
          // NOTE use a local destination to prevent cross-test pollution
          changes.push(data);
        },
        readOnLoad: false,
        debounce,
      }],
    }, true);

    // there are some technical nuances to when/why to use debouncing
    // see https://github.com/fullstorydev/fullstory-data-layer-observer/pull/139#discussion_r667939622

    // #1 trigger the first change event
    expectGlobal('digitalData').cart.cartID = 'abc';

    // #2 trigger an immediate change within the debounce window (it's occurring inside debounce window)
    expectGlobal('digitalData').cart.cartID = 'def';

    // #3 delay a subsequent change such that it occurs outside the debounce window
    setTimeout(() => {
      expectGlobal('digitalData').cart.cartID = 'xyz';
    }, 20);

    // check the final assignment and that two events were queued to the destination (#2 and #3)
    setTimeout(() => {
      // check that two events were queued (#1 and #2 coalesced to a single event and #3 was its own event)
      expectEqual(changes.length, 2);
      expectEqual('def', changes[0][0].cartID);

      // check the final value emitted from the data layer
      expectEqual('xyz', changes[1][0].cartID);

      ExpectObserver.getInstance().cleanup(observer);
      done();
    }, DataHandler.DefaultDebounceTime);
  });

  it('updating properties not included in result should not trigger the data handler', (done) => {
    let changes: any[] = [];

    const observer = ExpectObserver.getInstance().create({
      rules: [
        {
          source: 'digitalData.cart[(cartID,price)]',
          operators: [],
          destination: (...data: any[]) => {
            // NOTE use a local destination to prevent cross-test pollution
            changes = data;
          },
          readOnLoad: false,
          // monitor: true, // NOTE the default is true
        },
      ],
    }, true);

    expect(globalMock.digitalData.cart).to.not.be.undefined;

    // NOTE this property is not part of the [(cartID,price)] selector
    globalMock.digitalData.cart.attributes = { ignored: true };

    // check the assignment
    setTimeout(() => {
      expect(changes.length).to.eq(0);
      ExpectObserver.getInstance().cleanup(observer);
      done();
    }, DataHandler.DefaultDebounceTime * 1.5);
  });

  it('it should not add monitors for an invalid rule', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        {
          source: 'digitalData.cart[(cartID,price)]',
          operators: [],
          destination: 'console.log',
          readOnLoad: false,
          // monitor: true, // NOTE the default is true
        },
      ],
    }, true);

    expect(globalMock.digitalData.cart).to.not.be.undefined;

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('removing monitors should prevent property changes from firing', () => {
    let changes: any[] = [];

    const observer = ExpectObserver.getInstance().create({
      rules: [
        {
          source: 'digitalData.cart[(cartID,price)]',
          operators: [],
          destination: (...data: any[]) => {
            // NOTE use a local destination to prevent cross-test pollution
            changes = data;
          },
          readOnLoad: false,
          // monitor: true, // NOTE the default is true
        },
      ],
    }, true);

    expect(globalMock.digitalData.cart).to.not.be.undefined;

    globalMock.digitalData.cart.cartID = 'cart-5678';

    // check the assignment
    setTimeout(() => {
      const [reassigned] = changes;
      expect(reassigned.cartID).to.eq('cart-5678');
    }, DataHandler.DefaultDebounceTime * 1.5);

    // remove monitors and re-check
    MonitorFactory.getInstance().remove('digitalData.cart.cartID');

    globalMock.digitalData.cart.cartID = 'cart-0000';

    // check that no event occurred
    setTimeout(() => {
      const [reassigned] = changes;
      expect(reassigned.cartID).to.eq('cart-5678');
    }, DataHandler.DefaultDebounceTime * 1.5);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('function calls should trigger the data handler', () => {
    let args: any[] = [];

    const hit: any = {
      page: 'homepage',
    };

    const observer = ExpectObserver.getInstance().create({
      rules: [
        {
          source: 'dataLayer.push',
          operators: [],
          destination: (...data: any[]) => {
            // NOTE use a local destination to prevent cross-test pollution
            args = data;
          },
          readOnLoad: false,
        },
      ],
    }, true);

    expect(globalMock.dataLayer).to.not.be.undefined;
    expect(globalMock.dataLayer.length).to.eq(0);

    globalMock.dataLayer.push(hit);

    // check the function args
    // NOTE that functions are not debounced and called synchronously
    expect(args.length).to.eq(1);
    expect(args[0]).to.eq(hit);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('missing push and unshift in older browsers should not error', () => {
    // simulate an older browser by "removing" push and unshift
    // @ts-ignore
    globalMock.dataLayer.push = undefined;
    // @ts-ignore
    globalMock.dataLayer.unshift = undefined;

    expect(globalMock.dataLayer.push).to.be.undefined;
    expect(globalMock.dataLayer.unshift).to.be.undefined;

    const appender = new MockAppender();

    const observer = ExpectObserver.getInstance().create({
      appender,
      rules: [
        {
          source: 'dataLayer',
          operators: [],
          destination: 'console.log',
          readOnLoad: false,
        },
      ],
    }, true);

    expect(globalMock.dataLayer).to.not.be.undefined;
    expect(observer.handlers.length).to.eq(1);
    expect(globalMock.dataLayer.length).to.eq(0);

    const [event] = expectParams(appender, 'log') as LogEvent[];
    expect(event.level).to.eq(LogLevel.WARN);
    expect(event.context?.reason).to.contain('push'); // just make sure the warning is related to push missing

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('a developer can programmatically observe an object by reference', (done) => {
    let changes: any[] = [];

    const user = deepcopy(basicDigitalData.user.profile[0]);

    const observer = new DataLayerObserver();
    expect(observer).to.not.be.undefined;

    const target = new DataLayerTarget(user, 'profileInfo', 'myUser');
    expect(target).to.not.be.undefined;

    observer.registerTarget('digitalData.user.profile[0]', target, [{ name: 'query', select: '$[(profileID)]' }],
      (...data: any[]) => { changes = data; }, undefined, true);

    // check the readOnLoad
    const [read] = changes;
    expect(read.profileID).to.eq(user.profileInfo.profileID);

    user.profileInfo.profileID = 'atl-404678';

    // check the assignment
    setTimeout(() => {
      const [reassigned] = changes;
      expect(reassigned.profileID).to.eq('atl-404678');
      expect(reassigned.userName).to.be.undefined; // ensure selector picked

      done();
    }, DataHandler.DefaultDebounceTime * 1.5);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('it should reschedule registration for a completely missing data layer', (done) => {
    expectNoCalls(globalMock.console, 'log');

    const appender = new MockAppender();

    const observer = ExpectObserver.getInstance().create({
      appender,
      rules: [
        {
          source: 'digitalData.missing',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
        },
      ],
    });

    expectNoCalls(globalMock.console, 'log');

    // the registration will reschedule itself for 250 ms and then again at 500ms
    (globalMock.digitalData as any).missing = { found: true };

    setTimeout(() => {
      const [found] = expectParams(globalMock.console, 'log');
      expect(found).to.not.be.undefined;

      ExpectObserver.getInstance().cleanup(observer);

      done();
    }, 400);
  });

  it('it should reschedule registration for a stubbed data layer', (done) => {
    // this tests if the dataLayer has been stubbed but the needed properties are not present
    expectNoCalls(globalMock.console, 'log');

    const appender = new MockAppender();

    setGlobal('stub', {});

    const observer = ExpectObserver.getInstance().create({
      appender,
      rules: [
        {
          source: 'stub',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
        },
      ],
    });

    // historically, a stubbed data layer with no properties created an empty object payload
    expectNoCalls(globalMock.console, 'log');

    setTimeout(() => {
      const stub = expectGlobal('stub');
      stub.foo = 'bar';
    }, 100);

    // the registration will reschedule itself for 250 ms and then again at 500ms
    setTimeout(() => {
      const [found] = expectParams(globalMock.console, 'log');
      expect(found).to.not.be.undefined;
      expectEqual(found.foo, 'bar');

      ExpectObserver.getInstance().cleanup(observer);

      done();
    }, 400);
  });

  it('it should reschedule registration if desired properties are missing in the data layer', (done) => {
    // this tests if the dataLayer has been stubbed but the needed properties are not present
    expectNoCalls(globalMock.console, 'log');

    const appender = new MockAppender();

    setGlobal('s', {});

    const observer = ExpectObserver.getInstance().create({
      appender,
      rules: [
        {
          source: 's[^(eVar)]',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
        },
      ],
    });

    expectNoCalls(globalMock.console, 'log');

    setTimeout(() => {
      const s = expectGlobal('s');
      s.eVar1 = 'foo';
    }, 100);

    // the registration will reschedule itself for 250 ms and then again at 500ms
    setTimeout(() => {
      const [found] = expectParams(globalMock.console, 'log');
      expect(found).to.not.be.undefined;
      expectEqual(found.eVar1, 'foo');

      ExpectObserver.getInstance().cleanup(observer);

      done();
    }, 400);
  });

  it('it should fail registration after a configurable number of attempts', (done) => {
    expectNoCalls(globalMock.console, 'log');

    const appender = new MockAppender();

    const observer = ExpectObserver.getInstance().create({
      appender,
      rules: [
        {
          source: 'digitalData.missing',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
          maxRetry: 2, // first try 250ms, second try 500ms, third try 1000ms
        },
      ],
    });

    expectNoCalls(globalMock.console, 'log');

    setTimeout(() => {
      const [message] = expectParams(appender, 'log');
      expect(message).to.not.be.undefined;

      ExpectObserver.getInstance().cleanup(observer);

      done();
    }, 900); // the third retry will not occur so it's 250 + 500 for the first and second
  });

  it('it should delay registration for a configurable amount of time', (done) => {
    expectNoCalls(globalMock.console, 'log');

    const appender = new MockAppender();

    const observer = ExpectObserver.getInstance().create({
      appender,
      rules: [
        {
          source: 'digitalData.page.pageInfo',
          operators: [],
          destination: 'console.log',
          readOnLoad: true,
          waitUntil: 500,
        },
      ],
    });

    // expect that the data layer is not read before the waitUntil value
    setTimeout(() => {
      expectNoCalls(globalMock.console, 'log');
    }, 250);

    setTimeout(() => {
      const test = appender.callQueues;
      expect(test).to.not.be.undefined;
      const [found] = expectParams(globalMock.console, 'log');
      expect(found).to.not.be.undefined;

      ExpectObserver.getInstance().cleanup(observer);

      done();
    }, 1000);
  });
});
