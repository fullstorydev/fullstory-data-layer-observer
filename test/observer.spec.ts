/* eslint-disable max-classes-per-file */
import { expect } from 'chai';
import deepcopy from 'deepcopy';
import 'mocha';

import {
  basicDigitalData, /* CEDDL, PageCategory, Cart, */TotalCartPrice,
} from './mocks/CEDDL';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
import {
  expectParams, expectNoCalls, expectCall, setGlobal, expectGlobal, expectEqual, expectLogEvents, expectMatch,
} from './utils/mocha';
import { ObserverFactory } from './utils/observer-factory';
import { Operator, OperatorOptions } from '../src/operator';
import { DataLayerRule } from '../src/observer';
import { LogLevel } from '../src/utils/logger';
import DataHandler from '../src/handler';

export class EchoOperator implements Operator {
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

export class UppercaseOperator implements Operator {
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

// const originalConsole = console;
/*
interface GlobalMock {
  dataLayer: any[],
  digitalData: CEDDL,
  FS: FullStory
  console: Console,
}
*/
// let globalMock: GlobalMock;

const factory = ObserverFactory.getInstance();

describe('DataLayerObserver unit tests', () => {
  beforeEach(() => {
    setGlobal('dataLayer', []);
    setGlobal('digitalData', deepcopy(basicDigitalData)); // NOTE copy so mutations don't pollute tests
    setGlobal('console', new Console());
    setGlobal('FS', new FullStory());
  });

  afterEach(() => {
    /*
    delete (globalThis as any).dataLayer;
    delete (globalThis as any).digitalData;
    delete (globalThis as any).FS;
    (globalThis as any).console = originalConsole;
    */
  });

  it('it should initialize with defaults', () => {
    const id = factory.create({ rules: [] });
    factory.cleanup(id);
  });

  it('it should automatically parse config rules', () => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.pageInfo', operators: [], destination: '', monitor: false,
      },
    ];
    const id = factory.create({ rules });
    factory.cleanup(id);
  });

  it('rules without a source and destination are invalid', () => {
    const rules: DataLayerRule[] = [
      // @ts-ignore
      { operators: [], destination: '', monitor: false },
      // @ts-ignore
      { source: 'digitalData.page.pageInfo', operators: [], monitor: false },
    ];
    const id = factory.create({ rules }, false);

    expectEqual(factory.getObserver(id).handlers.length, 0);
    expectLogEvents(factory.getAppender(id), LogLevel.ERROR, 2);

    factory.cleanup(id);
  });

  it('it should read a data layer on-load for all rules', () => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.pageInfo', operators: [], destination: '', monitor: false,
      },
      {
        source: 'digitalData.product[0].productInfo', operators: [], destination: '', monitor: false,
      },
    ];

    const id = factory.create({ readOnLoad: true, rules });
    const destination = factory.getDestination(id);

    expectEqual([expectGlobal('digitalData').page.pageInfo], destination[0]);
    expectEqual([expectGlobal('digitalData').product[0].productInfo], destination[1]);
    expectLogEvents(factory.getAppender(id), LogLevel.ERROR, 0);

    factory.cleanup(id);
  });

  it('it should read a data layer on-load for specific rules', () => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.pageInfo', operators: [], destination: '', readOnLoad: true, monitor: false,
      },
      {
        source: 'digitalData.product[0].productInfo', operators: [], destination: '', monitor: false,
      },
    ];

    const id = factory.create({ rules, logLevel: 1 });
    const destination = factory.getDestination(id);

    expectEqual([expectGlobal('digitalData').page.pageInfo], destination[0]);
    expectLogEvents(factory.getAppender(id), LogLevel.ERROR, 0);

    factory.cleanup(id);
  });

  it('rule-specific readOnLoad overrides global readOnLoad', () => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.pageInfo', operators: [], destination: '', readOnLoad: true,
      },
    ];

    const id = factory.create({ readOnLoad: false, rules });
    const destination = factory.getDestination(id);

    expectEqual([expectGlobal('digitalData').page.pageInfo], destination[0]);
    expectLogEvents(factory.getAppender(id), LogLevel.ERROR, 0);

    factory.cleanup(id);
  });

  it('it should allow custom operators to be registered', () => {
    const id = factory.create({ rules: [] });
    const observer = factory.getObserver(id);
    observer.registerOperator('echo', new EchoOperator());
    factory.cleanup(id);
  });

  it('invalid operators should remove a handler', (done) => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.pageInfo', operators: [{ name: 'insert' }], destination: '', monitor: false,
      },
    ];
    const id = factory.create({ validateRules: true, rules }, false);
    const appender = factory.getAppender(id);

    // an invalid operator triggers rescheduling a rule so wait for the rule to timeout
    setTimeout(() => {
      expectEqual(factory.getObserver(id).handlers.length, 0);
      const logs = expectLogEvents(appender, LogLevel.ERROR);
      expect(logs.length).to.be.greaterThan(0);
      factory.cleanup(id);
      done();
    }, 1500);
  });

  it('it should not register operators with existing names', () => {
    const id = factory.create({ rules: [] }, false);
    const observer = factory.getObserver(id);
    expect(() => { observer.registerOperator('function', new EchoOperator()); }).to.throw();
    factory.cleanup(id);
  });

  it('only valid pages should process a rule', () => {
    const urlValidator = (url: string | undefined) => (url ? RegExp(url).test('https://www.fullstory.com/cart') : true);
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.transaction', operators: [], destination: '', url: '/checkout$', monitor: false,
      },
      {
        source: 'digitalData.cart', operators: [], destination: '', url: '/cart$', monitor: false,
      },
    ];
    const id = factory.create({ readOnLoad: true, urlValidator, rules }, false);
    const destination = factory.getDestination(id);

    // there should be only one event in the queue
    expectEqual([expectGlobal('digitalData').cart], destination[0]);
    expectLogEvents(factory.getAppender(id), LogLevel.ERROR, 0);

    factory.cleanup(id);
  });

  it('previewMode defaults to console.log', () => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.user.profile[0].profileInfo', operators: [], destination: '', monitor: false,
      },
    ];
    const id = factory.create({ previewMode: true, readOnLoad: true, rules });

    expectEqual(factory.getDestination(id).length, 0);
    const [profileInfo] = expectParams(expectGlobal('console'), 'log');
    expectEqual(profileInfo, expectGlobal('digitalData').user.profile[0].profileInfo);

    factory.cleanup(id);
  });

  it('previewMode can be configured', () => {
    expectNoCalls(expectGlobal('console'), 'debug');

    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.user.profile[0].profileInfo', operators: [], destination: '', monitor: false,
      },
    ];
    const id = factory.create({
      previewDestination: 'console.debug', previewMode: true, readOnLoad: true, rules,
    });

    expectEqual(factory.getDestination(id).length, 0);
    const [profileInfo] = expectParams(expectGlobal('console'), 'debug');
    expectEqual(profileInfo, expectGlobal('digitalData').user.profile[0].profileInfo);

    factory.cleanup(id);
  });

  it('debug can be enabled for a specific rule', () => {
    expectNoCalls(expectGlobal('console'), 'debug');

    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.pageInfo', operators: [], destination: '', debug: true, monitor: false,
      },
      {
        source: 'digitalData.product[0].productInfo', operators: [], destination: '', monitor: false,
      },
    ];
    const id = factory.create({ rules });
    const observer = factory.getObserver(id);

    observer.handlers[0].fireEvent();
    observer.handlers[1].fireEvent();

    // NOTE there should only be 4 debug statements for the first rule - one each for: entry, function (destination), exit
    expectCall(expectGlobal('console'), 'debug', 3);

    factory.cleanup(id);
  });

  it('it should register and call an operator before the destination', () => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.pageInfo', operators: [], destination: '', monitor: false, readOnLoad: true,
      },
    ];
    const beforeDestination = { name: 'insert', value: 'event' };
    const id = factory.create({ beforeDestination, rules });
    const destination = factory.getDestination(id);

    expectEqual(['event', expectGlobal('digitalData').page.pageInfo], destination[0]);
    expectLogEvents(factory.getAppender(id), LogLevel.ERROR, 0);

    factory.cleanup(id);
  });

  it('it should register and call multiple operators before the destination', () => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.page.category', operators: [], destination: '', monitor: false, readOnLoad: true,
      },
    ];
    const beforeDestination = [{ name: 'insert', value: 'page' }, { name: 'insert', value: 'dlo', position: -1 }];
    const id = factory.create({ beforeDestination, rules });
    const destination = factory.getDestination(id);

    expectEqual(['page', expectGlobal('digitalData').page.category, 'dlo'], destination[0]);

    factory.cleanup(id);
  });

  it('updating properties should trigger the data handler', (done) => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.cart[(cartID,price)]', operators: [], destination: '', readOnLoad: true, monitor: true,
      },
    ];
    const id = factory.create({ rules }, true);
    const destination = factory.getDestination(id);

    // check the readOnLoad
    expectMatch(expectGlobal('digitalData').cart, destination[0][0], 'cardID', 'price');

    // assign a new value to trigger a change event
    expectGlobal('digitalData').cart.cartID = 'cart-5678';

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

    expectGlobal('digitalData').cart.price = updatedPrice;

    // check the assignment (the two assignments get debounced into one event)
    setTimeout(() => {
      expectEqual({ cartID: 'cart-5678', price: { ...updatedPrice } }, destination[1][0]);
      expect(destination[1][0].item).to.be.undefined; // ensure selector picked

      factory.cleanup(id);
      done();
    }, DataHandler.DefaultDebounceTime * 1.5);
  });

  it('debounce window can be adjusted to trigger the data handler', (done) => {
    const debounce = 10; // 10ms debounce window

    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.cart[(cartID)]', operators: [], destination: '', readOnLoad: false, debounce,
      },
    ];
    const id = factory.create({ rules }, true);
    const destination = factory.getDestination(id);

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
      expectEqual(destination.length, 2);
      expectEqual('def', destination[0][0].cartID);

      // check the final value emitted from the data layer
      expectEqual('xyz', destination[1][0].cartID);

      factory.cleanup(id);
      done();
    }, DataHandler.DefaultDebounceTime);
  });

  it('updating properties not included in result should not trigger the data handler', (done) => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.cart[(cartID,price)]', operators: [], destination: '', readOnLoad: false,
      },
    ];

    const id = factory.create({ rules }, true);
    const destination = factory.getDestination(id);

    // NOTE this property is not part of the [(cartID,price)] selector and does not trigger the change event
    expectGlobal('digitalData').cart.attributes = { ignored: true };

    setTimeout(() => {
      expectEqual(destination.length, 0);

      factory.cleanup(id);
      done();
    }, DataHandler.DefaultDebounceTime * 1.5);
  });

  it('removing handlers should prevent property changes from firing', (done) => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.cart[(cartID)]', operators: [], destination: '', readOnLoad: false,
      },
    ];

    const id = factory.create({ rules }, true);
    const destination = factory.getDestination(id);
    const observer = factory.getObserver(id);

    // trigger the first change event
    expectGlobal('digitalData').cart.cartID = 'cart-5678';

    // check the assignment, remove handlers, trigger another change event
    setTimeout(() => {
      expectEqual('cart-5678', destination[0][0].cartID);
      observer.handlers.forEach((handler) => {
        observer.removeHandler(handler);
      });

      // trigger a second change event (that should not get handled)
      expectGlobal('digitalData').cart.cartID = 'cart-0000';
    }, DataHandler.DefaultDebounceTime * 1.2);

    // check that no subsequent events occurred
    setTimeout(() => {
      expectEqual(destination.length, 1);

      factory.cleanup(id);
      done();
    }, DataHandler.DefaultDebounceTime * 1.5);
  });

  it('function calls should trigger the data handler', () => {
    const hit: any = {
      page: 'homepage',
    };

    const rules: DataLayerRule[] = [
      {
        source: 'dataLayer.push', operators: [], destination: '', readOnLoad: false,
      },
    ];
    const id = factory.create({ rules }, true);
    const destination = factory.getDestination(id);

    expectEqual(expectGlobal('dataLayer').length, 0);
    expectGlobal('dataLayer').push(hit); // trigger the function shim
    expectEqual(destination.length, 1); // NOTE that functions are not debounced and called synchronously
    expectEqual(hit, destination[0][0]);

    factory.cleanup(id);
  });

  it('missing push and unshift in older browsers should not error', () => {
    // simulate an older browser by "removing" push and unshift
    expectGlobal('dataLayer').push = undefined;
    expectGlobal('dataLayer').unshift = undefined;
    expect(expectGlobal('dataLayer').push).to.be.undefined;
    expect(expectGlobal('dataLayer').unshift).to.be.undefined;

    const rules: DataLayerRule[] = [
      {
        source: 'dataLayer', operators: [], destination: '', readOnLoad: false,
      },
    ];
    const id = factory.create({ rules }, true);
    const destination = factory.getDestination(id);
    const appender = factory.getAppender(id);

    expectEqual(destination.length, 0);
    const [log] = expectLogEvents(appender, LogLevel.WARN, 1);
    expectEqual(log.context!.reason, 'Browser does not support push and unshift');

    factory.cleanup(id);
  });

  it('it should reschedule registration for failed rules', (done) => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.missing[(found)]', operators: [], destination: '', readOnLoad: true,
      },
    ];
    const id = factory.create({ rules });
    const destination = factory.getDestination(id);
    const appender = factory.getAppender(id);

    expectEqual(destination.length, 0);

    // rule registration will reschedule itself for 300 ms
    expectGlobal('digitalData').missing = { found: true };

    setTimeout(() => {
      expectLogEvents(appender, LogLevel.ERROR, 0);
      expectEqual({ found: true }, destination[0][0]);

      factory.cleanup(id);
      done();
    }, 400);
  });

  it('it should fail registration after 1.8 seconds by default', (done) => {
    const rules: DataLayerRule[] = [
      {
        source: 'digitalData.missing', operators: [], destination: '', readOnLoad: true,
      },
    ];

    const id = factory.create({ rules });

    // the registration will reschedule itself but quit after 1.8 seconds by default
    setTimeout(() => {
      // FIXME (van)
      // const logs = expectLogEvents(appender, LogLevel.ERROR);
      // expect(logs.length).to.be.greaterThan(0);

      factory.cleanup(id);
      done();
    }, 1800);
  });
});
