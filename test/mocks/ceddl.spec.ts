import { expect } from 'chai';
import 'mocha';

import * as CEDDL from './CEDDL';

describe('mock CEDDL unit tests', () => {

  it('empty digitalData should have JSO subobjects ', () => {
    const { emptyDigitalData } = CEDDL;
    const {
        pageInstanceID, page, product, cart, transaction,
        event, component, user, privacy, version
    } = emptyDigitalData;

    expect(emptyDigitalData).not.be.undefined;
    expect(pageInstanceID).not.be.undefined;
    expect(pageInstanceID).be.empty;
    expect(page).not.be.undefined;
    expect(product).not.be.undefined;
    expect(cart).not.be.undefined;
    expect(transaction).not.be.undefined;
    expect(event).not.be.undefined;
    expect(component).not.be.undefined;
    expect(user).not.be.undefined;
    expect(privacy).not.be.undefined;
    expect(version).not.be.undefined;
    expect(version).not.be.empty;
  });

  it('basic digitalData should have JSO subobjects ', () => {
    const { basicDigitalData } = CEDDL;
    const {
        pageInstanceID, page, product, cart, transaction,
        event, component, user, privacy, version
    } = basicDigitalData;

    expect(basicDigitalData).not.be.undefined;
    expect(pageInstanceID).not.be.undefined;
    expect(pageInstanceID).not.be.empty;
    expect(page).not.be.undefined;
    expect(product).not.be.undefined;
    expect(cart).not.be.undefined;
    expect(transaction).not.be.undefined;
    expect(event).not.be.undefined;
    expect(component).not.be.undefined;
    expect(user).not.be.undefined;
    expect(privacy).not.be.undefined;
    expect(version).not.be.undefined;
    expect(version).not.be.empty;
  });
});