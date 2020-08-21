import { expect } from 'chai';
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
    (globalThis as any).digitalData = { ...basicDigitalData };
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
    const cartMonitor = new ShimMonitor(globalMock.digitalData.cart, 'cartID', 'digitalData.cart');
    expect(cartMonitor).to.not.be.undefined;

    // TODO once we solve the timing getter/setter bug
  });
});
