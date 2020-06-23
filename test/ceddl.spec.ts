import { expect } from 'chai';
import 'mocha';

import * as CEDDL from './data/CEDDL';

describe('mock CEDDL unit tests', () => {

  it('it should have JSO subobjects ', () => {
    const { digitalData } = CEDDL;
    const { pageInstanceID, page, product, cart, transaction, event, component, user, privacy, version } = digitalData;

    expect(digitalData).not.be.undefined;
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