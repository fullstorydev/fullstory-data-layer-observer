import 'mocha';

import { rules } from '../examples/rules/ceddl-fullstory.json';

import { basicDigitalData } from './mocks/CEDDL';
import {
  expectEqual, expectRule, expectFS, expectMatch, expectType, expectUndefined, ExpectObserver, setupGlobals,
  expectGlobal,
} from './utils/mocha';

describe('CEDDL to FullStory rules', () => {
  beforeEach(() => setupGlobals([
    ['digitalData', basicDigitalData],
    ['_dlo_rules', rules],
  ]));

  afterEach(() => {
    ExpectObserver.getInstance().cleanup();
  });

  it('it should send any CEDDL user property to FS.setUserVars', () => {
    expectGlobal('digitalData').user.profile[0].job = 'developer'; // inject custom property

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-uservars-ceddl-user-all')], readOnLoad: true,
    });

    const [payload] = expectFS('setUserVars');
    expectMatch(basicDigitalData.user.profile[0].profileInfo, payload, 'profileID', 'userName');
    expectMatch(basicDigitalData.user.profile[0].address, payload,
      'line1', 'line2', 'city', 'stateProvince', 'postalCode', 'country', 'line2', 'line2', 'line2', 'line2');
    expectUndefined(payload, 'segment', 'social', 'attributes');
    expectEqual(payload.job, 'developer'); // verify custom property
  });

  it('it should send any CEDDL user property to FS.identify', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-identify-ceddl-user-all')], readOnLoad: true,
    });

    const [uid, payload] = expectFS('identify');
    expectEqual(uid, basicDigitalData.user.profile[0].profileInfo.profileID);
    expectEqual(payload.userName, basicDigitalData.user.profile[0].profileInfo.userName);
    expectEqual(payload.line1, basicDigitalData.user.profile[0].address.line1);
    expectUndefined(payload, 'segment');
  });

  it('it should send only allowed CEDDL user properties to FS.identify', () => {
    expectGlobal('digitalData').user.profile[0].password = 'pa$$w0rd'; // inject sensitive property

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-identify-ceddl-user-allowed')], readOnLoad: true,
    });

    const [uid, payload] = expectFS('identify');
    expectEqual(uid, basicDigitalData.user.profile[0].profileInfo.profileID);
    expectEqual(payload.userName, basicDigitalData.user.profile[0].profileInfo.userName);
    expectEqual(payload.line1, basicDigitalData.user.profile[0].address.line1);
    expectUndefined(payload, 'password');
  });

  it('it should send the first CEDDL product to FS.event', () => {
    expectGlobal('digitalData').product[0].customProp = 'Foo'; // inject custom property

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-event-ceddl-product')], readOnLoad: true,
    });

    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'product');
    expectMatch(payload, basicDigitalData.product[0].productInfo, 'sku', 'productID', 'productName');
    expectMatch(payload, basicDigitalData.product[0].category, 'primaryCategory');
    expectEqual(payload.customProp, 'Foo');
  });

  it('it should send CEDDL cart to FS.event', () => {
    expectGlobal('digitalData').cart.promotion = 'LaborDay2020'; // inject custom property

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-event-ceddl-cart')], readOnLoad: true,
    });

    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'cart');
    expectEqual(payload.cartID, basicDigitalData.cart.cartID);
    expectEqual(payload.basePrice, basicDigitalData.cart.price.basePrice);
    // @ts-ignore custom property
    expectEqual(payload.promotion, 'LaborDay2020');
  });

  it('it should convert strings to reals and send CEDDL cart properties to FS.event', () => {
    const { price: { basePrice, priceWithTax, cartTotal } } = basicDigitalData.cart;

    // convert to strings for testing
    expectGlobal('digitalData').cart.price.basePrice = basePrice.toString();
    expectGlobal('digitalData').cart.price.priceWithTax = priceWithTax.toString();
    expectGlobal('digitalData').cart.price.cartTotal = cartTotal.toString();

    expectType('string', expectGlobal('digitalData').cart.price.basePrice);
    expectType('string', expectGlobal('digitalData').cart.price.priceWithTax);
    expectType('string', expectGlobal('digitalData').cart.price.cartTotal);

    ExpectObserver.getInstance().create(
      { rules: [expectRule('fs-event-ceddl-cart')], readOnLoad: true },
    );

    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'cart');

    // NOTE these are flattened but you could also simply send digitalData.cart.price
    expectMatch(payload, basicDigitalData.cart.price, 'basePrice', 'priceWithTax', 'cartTotal');
  });

  it('it should send CEDDL page properties to FS.event', () => {
    expectGlobal('digitalData').page.framework = 'react'; // inject custom property

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-event-ceddl-page')], readOnLoad: true,
    });

    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'page');

    // NOTE these are flattened but you could also simply send digitalData.page
    expectMatch(payload, basicDigitalData.page.pageInfo,
      'pageID', 'pageName', 'sysEnv', 'variant', 'breadcrumbs', 'author', 'language', 'industryCodes', 'publisher');

    expectEqual(payload.primaryCategory, basicDigitalData.page.category.primaryCategory);
    expectEqual(payload.framework, 'react'); // verify custom property

    // check converted values
    expectEqual(payload.version, 1.14);
    expectEqual(payload.issueDate.toString(), new Date(basicDigitalData.page.pageInfo.issueDate).toString());
    expectEqual(payload.effectiveDate.toString(), new Date(basicDigitalData.page.pageInfo.effectiveDate).toString());
    expectEqual(payload.expiryDate.toString(), new Date(basicDigitalData.page.pageInfo.expiryDate).toString());

    // NOTE we have other ways in FullStory to see these
    expectUndefined(payload, 'destinationURL', 'referringURL');
  });

  it('it should send CEDDL transaction transactionID and total properties to FS.event', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-event-ceddl-transaction')], readOnLoad: true,
    });

    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'transaction');
    expectEqual(payload.transactionID, basicDigitalData.transaction.transactionID);
    expectMatch(payload, basicDigitalData.transaction.total,
      'basePrice', 'voucherCode', 'voucherDiscount', 'currency', 'taxRate', 'shipping', 'shippingMethod',
      'priceWithTax', 'transactionTotal');
  });

  it('it should send CEDDL event to FS.event', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-event-ceddl-event')], readOnLoad: true,
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'event'); // NOTE this tests non-compliant data layers that do not defined eventName
    expectEqual(payload.eventAction, 'cart-item-removed');
    expectEqual(payload.primaryCategory, 'cart');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'Cart Item Added');
    expectEqual(payload.eventAction, 'cart-item-added');
    expectEqual(payload.primaryCategory, 'cart');
  });
});
