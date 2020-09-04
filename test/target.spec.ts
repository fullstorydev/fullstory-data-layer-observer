import { expect } from 'chai';
import deepcopy from 'deepcopy';
import 'mocha';

import { basicAppMeasurement } from './mocks/adobe';
import { basicDigitalData } from './mocks/CEDDL';
import DataLayerTarget from '../src/target';

describe('DataLayerTarget unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = deepcopy(basicDigitalData); // NOTE copy so mutations don't pollute tests
    (globalThis as any).s = deepcopy(basicAppMeasurement);
  });

  afterEach(() => {
    (globalThis as any).digitalData;
    delete (globalThis as any).s;
  });

  it('it should not target using a malformed selector', () => {
    expect(() => DataLayerTarget.find('digitalData.cart[oops]')).to.throw();
  });

  it('subject must be an object', () => {
    expect(() => new DataLayerTarget('digitalData.cart', 'cart', 'digitalData.cart', 'digitalData.cart')).to.throw();
  });

  it('subject property must be defined and non-empty', () => {
    expect(() => new DataLayerTarget((globalThis as any).digitalData, '', 'digitalData.cart',
      'digitalData.cart')).to.throw();
  });

  it('a path must be defined and non-empty', () => {
    expect(() => new DataLayerTarget((globalThis as any).digitalData, 'cart', '')).to.throw();
  });

  it('it should target digitalData.cart', () => {
    const selectorInput = 'digitalData.cart';

    const target = DataLayerTarget.find(selectorInput);
    expect(target).to.not.be.undefined;

    const {
      subject, property, path, subjectPath, value, selector,
    } = target!;
    expect(selector).to.eq(selector);
    expect(subject).to.eq((globalThis as any).digitalData);
    expect(property).to.eq('cart');
    expect(path).to.eq('digitalData.cart');
    expect(subjectPath).to.eq('digitalData');
    expect(value).to.eq((globalThis as any).digitalData.cart);
    expect(target!.query()).to.eq((globalThis as any).digitalData.cart);
  });

  it('it should target digitalData.user.profile[0]', () => {
    const selectorInput = 'digitalData.user.profile[0]';

    const target = DataLayerTarget.find(selectorInput);
    expect(target).to.not.be.undefined;

    const {
      subject, property, path, subjectPath, value, selector,
    } = target!;
    expect(selector).to.eq(selector);
    expect(subject).to.eq((globalThis as any).digitalData.user);
    expect(property).to.eq('profile');
    expect(path).to.eq('digitalData.user.profile[0]');
    expect(subjectPath).to.eq('digitalData.user');
    expect(value).to.eq((globalThis as any).digitalData.user.profile[0]);
    expect(target!.query()).to.eq((globalThis as any).digitalData.user.profile[0]);
  });

  it('it should target digitalData.cart[(cartID,price)]', () => {
    const selectorInput = 'digitalData.cart[(cartID,price)]';

    const target = DataLayerTarget.find(selectorInput);
    expect(target).to.not.be.undefined;

    const {
      subject, property, path, subjectPath, value, selector,
    } = target!;
    expect(selector).to.eq(selector);
    expect(subject).to.eq((globalThis as any).digitalData);
    expect(property).to.eq('cart');
    expect(path).to.eq('digitalData.cart');
    expect(subjectPath).to.eq('digitalData');
    expect(value).to.eq((globalThis as any).digitalData.cart);
    expect(target!.query()).to.eql({
      cartID: (globalThis as any).digitalData.cart.cartID,
      price: (globalThis as any).digitalData.cart.price,
    });
  });

  it('it should target s[^(eVar)]', () => {
    const selectorInput = 's[^(eVar)]';

    const target = DataLayerTarget.find(selectorInput);
    expect(target).to.not.be.undefined;

    const {
      subject, property, path, subjectPath, value, selector,
    } = target!;
    expect(selector).to.eq(selector);
    expect(subject).to.eq(globalThis);
    expect(property).to.eq('s');
    expect(path).to.eq('s');
    expect(subjectPath).to.eq('');
    expect(value).to.eq((globalThis as any).s);
    expect(target!.query().eVar1).to.eq((globalThis as any).s.eVar1);
  });

  it('it should target digitalData.product[0].productInfo', () => {
    const selectorInput = 'digitalData.product[0].productInfo';

    const target = DataLayerTarget.find(selectorInput);
    expect(target).to.not.be.undefined;

    const {
      subject, property, path, subjectPath, value, selector,
    } = target!;
    expect(selector).to.eq(selector);
    expect(subject).to.eq((globalThis as any).digitalData.product[0]);
    expect(property).to.eq('productInfo');
    expect(path).to.eq('digitalData.product[0].productInfo');
    expect(subjectPath).to.eq('digitalData.product[0]');
    expect(value).to.eq((globalThis as any).digitalData.product[0].productInfo);
    expect(target!.query()).to.eq((globalThis as any).digitalData.product[0].productInfo);
  });

  it('it should not fail if a filter returns false', () => {
    const selectorInput = 'digitalData.cart[?(cartID=incorrect)]';

    const target = DataLayerTarget.find(selectorInput);
    expect(target).to.not.be.undefined;
  });
});
