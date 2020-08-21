import { expect } from 'chai';
import deepcopy from 'deepcopy';
import 'mocha';

import { DataLayerEventType } from '../src/event';
import ShimMonitor from '../src/monitor-shim';

import { basicDigitalData, CEDDL } from './mocks/CEDDL';
import { expectEventListener } from './utils/mocha';

interface GlobalMock {
  digitalData: CEDDL,
}

let globalMock: GlobalMock;

describe('ShimMonitor unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = deepcopy(basicDigitalData); // NOTE copy so mutations don't pollute tests
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
  });

  it('it should create a property Monitor', () => {
    expect(globalMock.digitalData.cart).to.not.be.undefined;
    expect(globalMock.digitalData.user.profile).to.not.be.undefined;

    const cartMonitor = new ShimMonitor(globalMock.digitalData.cart, 'price', 'digitalData.cart[(cartID,price)]');
    const userMonitor = new ShimMonitor(globalMock.digitalData.user, 'profile', 'digitalData.user.profile[0]');

    expect(cartMonitor).to.not.be.undefined;
    expect(userMonitor).to.not.be.undefined;

    const priceDescriptor = Object.getOwnPropertyDescriptor(globalMock.digitalData.cart, 'price');
    const idDescriptor = Object.getOwnPropertyDescriptor(globalMock.digitalData.cart, 'cartID');

    expect(idDescriptor).to.not.be.undefined;
    expect(priceDescriptor).to.not.be.undefined;

    expect(priceDescriptor!.get).to.not.be.undefined;
    expect(priceDescriptor!.set).to.not.be.undefined;

    expect(idDescriptor!.get).to.be.undefined;
    expect(idDescriptor!.set).to.be.undefined;
  });

  it('it will throw an error unsupported properties', () => {
    // fails because the target is a literal and not the cart itself
    expect(() => new ShimMonitor(globalMock.digitalData.cart.cartID, 'cartID', 'digitalData.cart')).to.throw();
  });

  it('it should emit the value on change', (done) => {
    expectEventListener(DataLayerEventType.PROPERTY, 'cart-5678', done);

    const cartMonitor = new ShimMonitor(globalMock.digitalData.cart, 'cartID', 'digitalData.cart');
    expect(cartMonitor).to.not.be.undefined;

    globalMock.digitalData.cart.cartID = 'cart-5678';
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
});

it('it should throw an error for sealed and frozen objects', () => {
  const f = { message: 'Hello World' };
  Object.freeze(f);

  const s = { message: 'Hello World' };
  Object.seal(s);

  expect(() => new ShimMonitor(f, 'message', 'f')).to.throw();
  expect(() => new ShimMonitor(s, 'message', 's')).to.throw();
});
