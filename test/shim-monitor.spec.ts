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

    const cartMonitor = new ShimMonitor(globalMock.digitalData.cart, 'cartID', 'digitalData.cart');
    const userMonitor = new ShimMonitor(globalMock.digitalData.user, 'profile', 'digitalData.user.profile[0]');

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
    expect(() => new ShimMonitor(globalMock.digitalData.cart.cartID, 'cartID', 'digitalData.cart')).to.throw();
  });

  it('it should emit the value on change', (done) => {
    const path = 'digitalData.cart';

    expectEventListener(createEventType(path), 'cart-5678', done);

    const cartMonitor = new ShimMonitor(globalMock.digitalData.cart, 'cartID', path);
    expect(cartMonitor).to.not.be.undefined;

    globalMock.digitalData.cart.cartID = 'cart-5678';
  });

  it('it should not emit an on change value if it matches the existing value', () => {
    const path = 'digitalData.transaction';

    // this test is a bit different because we have to create a listener where the
    // Nth invocation is expected not to happen

    // track the number of dispatched events with a simple counter
    let counter = 0;
    const listener = () => {
      counter += 1;
    };

    // add the counter handler
    window.addEventListener(createEventType(path), listener);

    const cartMonitor = new ShimMonitor(globalMock.digitalData.transaction, 'transactionID', path);
    expect(cartMonitor).to.not.be.undefined;

    // trigger the first counter handler
    globalMock.digitalData.transaction.transactionID = '123';
    expect(counter).to.eql(1);

    // re-assign the same value, which should not trigger the counter
    globalMock.digitalData.transaction.transactionID = '123';
    expect(counter).to.eql(1);

    window.removeEventListener(createEventType(path), listener);
  });

  it('it should emit args from function calls', (done) => {
    const path = 'dataLayer';
    const hit: any = {
      page: 'homepage',
    };

    expectEventListener(createEventType(path), [hit], done); // NOTE the value emitted is a list of args

    const listMonitor = new ShimMonitor(globalMock.dataLayer, 'push', path);
    expect(listMonitor).to.not.be.undefined;

    const length = globalMock.dataLayer.push(hit);
    expect(length).to.eq(1);
  });

  it('it should emit variadic args from function calls', (done) => {
    const path = 'dataLayer';

    expectEventListener(createEventType(path), [1, 2, 3], done); // NOTE the value emitted is a list of args

    const listMonitor = new ShimMonitor(globalMock.dataLayer, 'push', path);
    expect(listMonitor).to.not.be.undefined;

    const length = globalMock.dataLayer.push(1, 2, 3);
    expect(length).to.eq(3);
  });

  it('it should emit args but trap function exceptions', (done) => {
    const path = 'dataLayer';
    (globalThis as any).dataLayer.error = (message: string) => {
      throw new Error(message);
    };

    expectEventListener(createEventType(path), ['Hello World'], done); // NOTE the value emitted is a list of args

    const listMonitor = new ShimMonitor(globalMock.dataLayer, 'error', path);
    expect(listMonitor).to.not.be.undefined;

    // @ts-ignore
    const ret = globalMock.dataLayer.error('Hello World');
    expect(ret).to.eq(null);
  });

  it('it should emit args and not fail because of dispatch related exceptions', () => {
    const path = 'digitalData.fn';
    (globalThis as any).dataLayer.fn = () => true;

    // this will simulate a handler's exception
    const listener = () => {
      throw new Error();
    };
    window.addEventListener(createEventType(path), listener);

    const fnMonitor = new ShimMonitor(globalMock.dataLayer, 'fn', path);
    expect(fnMonitor).to.not.be.undefined;

    // @ts-ignore
    const ret = globalMock.dataLayer.fn();
    expect(ret).to.eq(true);

    window.removeEventListener(createEventType(path), listener);
  });

  it('it should remove a monitor and reassign the original value', () => {
    const o = { message: 'Hello World' };

    let descriptor = Object.getOwnPropertyDescriptor(o, 'message');
    expect(descriptor).to.not.be.undefined;

    const { configurable, enumerable, writable } = descriptor!;

    const monitor = new ShimMonitor(o, 'message', 'o');
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

    expect(() => new ShimMonitor(f, 'message', 'f')).to.throw();
    expect(() => new ShimMonitor(s, 'message', 's')).to.throw();
  });
});
