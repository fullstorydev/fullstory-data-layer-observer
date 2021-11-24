import { expect } from 'chai';
import deepcopy from 'deepcopy';
import 'mocha';

import ShimMonitor from '../src/monitor-shim';

import { basicDigitalData, CEDDL } from './mocks/CEDDL';
import { expectEventListener } from './utils/mocha';
import { createEventType } from '../src/event';

interface GlobalMock {
  dataLayer: any[],
  digitalData: CEDDL,
}

let globalMock: GlobalMock;

describe('ShimMonitor unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = deepcopy(basicDigitalData); // NOTE copy so mutations don't pollute tests
    (globalThis as any).dataLayer = [];
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
    delete (globalThis as any).dataLayer;
  });

  it('it should create a property Monitor', () => {
    expect(globalMock.digitalData.cart).to.not.be.undefined;
    expect(globalMock.digitalData.user.profile).to.not.be.undefined;

    const cartSource = 'digitalData.cart';
    const cartMonitor = new ShimMonitor(cartSource, globalMock.digitalData.cart, 'cartID', cartSource);

    const userSource = 'digitalData.user.profile[0]';
    const userMonitor = new ShimMonitor(userSource, globalMock.digitalData.user, 'profile', userSource);

    expect(cartMonitor).to.not.be.undefined;
    expect(userMonitor).to.not.be.undefined;

    const priceDescriptor = Object.getOwnPropertyDescriptor(globalMock.digitalData.cart, 'price');
    const idDescriptor = Object.getOwnPropertyDescriptor(globalMock.digitalData.cart, 'cartID');

    expect(idDescriptor).to.not.be.undefined;
    expect(priceDescriptor).to.not.be.undefined;

    expect(priceDescriptor!.get).to.be.undefined;
    expect(priceDescriptor!.set).to.be.undefined;

    expect(idDescriptor!.get).to.not.be.undefined;
    expect(idDescriptor!.set).to.not.be.undefined;
  });

  it('it will throw an error unsupported properties', () => {
    // fails because the target is a literal and not the cart itself
    const source = 'digitalData.cart';
    expect(() => new ShimMonitor(source, globalMock.digitalData.cart.cartID, 'cartID', source)).to.throw();
  });

  it('it should emit the value on change', (done) => {
    const source = 'digitalData.cart';

    expectEventListener(createEventType(source, source), 'cart-5678', done);

    const cartMonitor = new ShimMonitor(source, globalMock.digitalData.cart, 'cartID', source);
    expect(cartMonitor).to.not.be.undefined;

    globalMock.digitalData.cart.cartID = 'cart-5678';
  });

  it('it should not emit an on change value if it matches the existing value', () => {
    const source = 'digitalData.transaction';

    // this test is a bit different because we have to create a listener where the
    // Nth invocation is expected not to happen

    // track the number of dispatched events with a simple counter
    let counter = 0;
    const listener = () => {
      counter += 1;
    };

    // add the counter handler
    window.addEventListener(createEventType(source, source), listener);

    const cartMonitor = new ShimMonitor(source, globalMock.digitalData.transaction, 'transactionID', source);
    expect(cartMonitor).to.not.be.undefined;

    // trigger the first counter handler
    globalMock.digitalData.transaction.transactionID = '123';
    expect(counter).to.eql(1);

    // re-assign the same value, which should not trigger the counter
    globalMock.digitalData.transaction.transactionID = '123';
    expect(counter).to.eql(1);

    window.removeEventListener(createEventType(source, source), listener);
  });

  it('it should emit args from function calls', (done) => {
    const source = 'dataLayer';
    const hit: any = {
      page: 'homepage',
    };

    expectEventListener(createEventType(source, source), [hit], done); // NOTE the value emitted is a list of args

    const listMonitor = new ShimMonitor(source, globalMock.dataLayer, 'push', source);
    expect(listMonitor).to.not.be.undefined;

    const length = globalMock.dataLayer.push(hit);
    expect(length).to.eq(1);
  });

  it('it should emit variadic args from function calls', (done) => {
    const source = 'dataLayer';

    expectEventListener(createEventType(source, source), [1, 2, 3], done); // NOTE the value emitted is a list of args

    const listMonitor = new ShimMonitor(source, globalMock.dataLayer, 'push', source);
    expect(listMonitor).to.not.be.undefined;

    const length = globalMock.dataLayer.push(1, 2, 3);
    expect(length).to.eq(3);
  });

  it('it should emit args but trap function exceptions', (done) => {
    const source = 'dataLayer';
    (globalThis as any).dataLayer.error = (message: string) => {
      throw new Error(message);
    };

    // NOTE the value emitted is a list of args
    expectEventListener(createEventType(source, source), ['Hello World'], done);

    const listMonitor = new ShimMonitor(source, globalMock.dataLayer, 'error', source);
    expect(listMonitor).to.not.be.undefined;

    // @ts-ignore
    const ret = globalMock.dataLayer.error('Hello World');
    expect(ret).to.eq(null);
  });

  it('it should emit args and not fail because of dispatch related exceptions', () => {
    const source = 'digitalData.fn';
    (globalThis as any).dataLayer.fn = () => true;

    // this will simulate a handler's exception
    const listener = () => {
      throw new Error();
    };
    window.addEventListener(createEventType(source, source), listener);

    const fnMonitor = new ShimMonitor(source, globalMock.dataLayer, 'fn', source);
    expect(fnMonitor).to.not.be.undefined;

    // @ts-ignore
    const ret = globalMock.dataLayer.fn();
    expect(ret).to.eq(true);

    window.removeEventListener(createEventType(source, source), listener);
  });

  it('it should remove a monitor and reassign the original value', () => {
    const source = 'o';
    const o = { message: 'Hello World' };

    let descriptor = Object.getOwnPropertyDescriptor(o, 'message');
    expect(descriptor).to.not.be.undefined;

    const { configurable, enumerable, writable } = descriptor!;

    const monitor = new ShimMonitor(source, o, 'message', source);
    expect(monitor).to.not.be.undefined;

    descriptor = Object.getOwnPropertyDescriptor(o, 'message');
    expect(descriptor).to.not.be.undefined;

    expect(descriptor!.get).to.not.be.undefined;
    expect(descriptor!.set).to.not.be.undefined;

    monitor.remove();

    descriptor = Object.getOwnPropertyDescriptor(o, 'message');

    expect(descriptor).to.not.be.undefined;
    expect(descriptor!.get).to.be.undefined;
    expect(descriptor!.set).to.be.undefined;
    expect(descriptor!.configurable).to.eq(configurable);
    expect(descriptor!.enumerable).to.eq(enumerable);
    expect(descriptor!.writable).to.eq(writable);
  });

  it('it should throw an error for sealed and frozen objects', () => {
    const f = { message: 'Hello World' };
    Object.freeze(f);

    const s = { message: 'Hello World' };
    Object.seal(s);

    expect(() => new ShimMonitor('f', f, 'message', 'f')).to.throw();
    expect(() => new ShimMonitor('s', s, 'message', 's')).to.throw();
  });
});
