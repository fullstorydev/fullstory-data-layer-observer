import { expect } from 'chai';
import deepcopy from 'deepcopy';
import 'mocha';
import MonitorFactory from '../src/monitor-factory';

import { basicDigitalData, CEDDL } from './mocks/CEDDL';

interface GlobalMock {
  digitalData: CEDDL,
}

let globalMock: GlobalMock;

describe('MonitorFactory unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = deepcopy(basicDigitalData); // NOTE copy so mutations don't pollute tests
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
  });

  it('it should return a singleton', () => {
    const factory = MonitorFactory.getInstance();
    expect(factory).to.not.be.undefined;

    const factory2 = MonitorFactory.getInstance();
    expect(factory2).to.not.be.undefined;
    expect(factory2).to.eq(factory);
  });

  it('it should return an existing Monitor if recreated', () => {
    expect(globalMock.digitalData.cart).to.not.be.undefined;

    const source = 'digitalData.cart';
    const cartMonitor = MonitorFactory.getInstance().create(source, globalMock.digitalData.cart, 'cartID', source);
    expect(cartMonitor).to.not.be.undefined;

    const cartMonitor2 = MonitorFactory.getInstance().create(source, globalMock.digitalData.cart, 'cartID', source);
    expect(cartMonitor2).to.not.be.undefined;
    expect(cartMonitor2).to.eq(cartMonitor);
  });

  it('it should remove a Monitor', () => {
    expect(globalMock.digitalData.cart).to.not.be.undefined;

    const source = 'digitalData.cart';
    const cartMonitor = MonitorFactory.getInstance().create(source, globalMock.digitalData.cart, 'cartID', source);
    expect(cartMonitor).to.not.be.undefined;

    MonitorFactory.getInstance().remove('digitalData.cart.cartID');

    const cartMonitor2 = MonitorFactory.getInstance().create(source, globalMock.digitalData.cart, 'cartID', source);
    expect(cartMonitor2).to.not.be.undefined;
    expect(cartMonitor2).to.not.eq(cartMonitor);
  });
});
