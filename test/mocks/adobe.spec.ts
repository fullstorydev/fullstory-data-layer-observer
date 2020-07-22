import { expect } from 'chai';
import 'mocha';

import * as Adobe from './adobe';

describe('mock Adobe unit tests', () => {
  it('basic Adobe AppMeasurement data should exist', () => {
    const { basicAppMeasurement } = Adobe;

    const {
      campaign, channel, hier, list, pageName, pageType, pageURL, products, purchaseID, referrer,
      server, state, timestamp, transactionID, zip, eVar1, eVar10, eVar20, eVar50, eVar60, prop1,
    } = basicAppMeasurement;

    expect(campaign).not.be.undefined;
    expect(channel).not.be.undefined;
    expect(hier).not.be.undefined;
    expect(list).not.be.undefined;
    expect(pageName).not.be.undefined;
    expect(pageType).not.be.undefined;
    expect(pageURL).not.be.undefined;
    expect(products).not.be.undefined;
    expect(purchaseID).not.be.undefined;
    expect(referrer).not.be.undefined;
    expect(server).not.be.undefined;
    expect(state).not.be.undefined;
    expect(timestamp).not.be.undefined;
    expect(transactionID).not.be.undefined;
    expect(zip).not.be.undefined;
    expect(eVar1).not.be.undefined;
    expect(eVar10).not.be.undefined;
    expect(eVar20).not.be.undefined;
    expect(eVar50).not.be.undefined;
    expect(eVar60).not.be.undefined;
    expect(prop1).not.be.undefined;
  });
});
