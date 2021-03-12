import 'mocha';

import { rules } from '../examples/rules/google-tags-fullstory.json';

import { basicGoogleTags } from './mocks/google-tags';
import {
  expectEqual, expectRule, expectFS, setupGlobals, ExpectObserver, global, expectUndefined,
} from './utils/mocha';

describe('Google Tags to FullStory rules', () => {
  beforeEach(() => setupGlobals([
    ['dataLayer', basicGoogleTags],
    ['_dlo_rules', rules],
  ]));

  afterEach(() => {
    ExpectObserver.getInstance().cleanup();
  });

  it('should read pageview', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-ga-pageview')],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'pageview');
    expectEqual(payload.pageType, 'Home');

    global('dataLayer').push({
      pageType: 'Test',
      pageName: 'test',
    });

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'pageview');
    expectEqual(payload.pageName, 'test');
  });

  it('should read enhanced ecommerce detail', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ga-e-commerce-detail-product'),
        { ...expectRule('fs-ga-e-commerce-detail-action'), source: 'dataLayer[5]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'detail');
    expectEqual(payload.list, 'Product Gallery');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'detail_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.price, 2.99);
  });

  it('should read enhanced ecommerce click', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ga-e-commerce-click-product'),
        { ...expectRule('fs-ga-e-commerce-click-action'), source: 'dataLayer[4]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'click');
    expectEqual(payload.list, 'Search Results');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'click_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.price, 2.99);
  });

  it('should read enhanced ecommerce add', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ga-e-commerce-add-product'),
        { ...expectRule('fs-ga-e-commerce-add-action'), source: 'dataLayer[6]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'add');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'add_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.price, 2.99);
  });

  it('should read enhanced ecommerce remove', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ga-e-commerce-remove-product'),
        { ...expectRule('fs-ga-e-commerce-remove-action'), source: 'dataLayer[7]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'remove');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'remove_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.price, 2.99);
  });

  it('should read enhanced ecommerce promo_click', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ga-e-commerce-promo_click-promotion'),
        { ...expectRule('fs-ga-e-commerce-promo_click-action'), source: 'dataLayer[9]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'promo_click');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'promo_click_promotion');
    expectEqual(payload.id, '1004-Blueberries123321');
  });

  it('should read enhanced ecommerce purchase', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ga-e-commerce-purchase-product'),
        { ...expectRule('fs-ga-e-commerce-purchase-action'), source: 'dataLayer[11]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'purchase');
    expectEqual(payload.shipping, 5.99);

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'purchase_product');
    expectEqual(payload.id, '668ebb86-60b5-451e-92d3-044157d27823');
    expectEqual(payload.price, 15.55);

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'purchase_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.price, 2.99);
  });

  it('should read enhanced ecommerce checkout', () => {
    ExpectObserver.getInstance().create({
      rules: [
        { ...expectRule('fs-ga-e-commerce-checkout-product') },
        { ...expectRule('fs-ga-e-commerce-checkout-action'), source: 'dataLayer[10]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'checkout');
    expectEqual(payload.step, 1);

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'checkout_product');
    expectEqual(payload.id, '668ebb86-60b5-451e-92d3-044157d27823');
    expectEqual(payload.price, 15.55);

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'checkout_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.price, 2.99);
  });

  it('should read enhanced ecommerce refund', () => {
    ExpectObserver.getInstance().create({
      rules: [
        { ...expectRule('fs-ga-e-commerce-refund-product') },
        { ...expectRule('fs-ga-e-commerce-refund-action'), source: 'dataLayer[12]' },
      ],
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'refund');
    expectEqual(payload.id, 'T12345');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'refund_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.quantity, 1);
  });

  it('should set the user', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-ga-user-vars')],
    });

    let [eventName, payload] = expectFS('setUserVars');
    expectEqual(eventName, '101');
    expectEqual(payload.userType, 'member');

    global('dataLayer').push({
      userProfile: {
        userId: '201',
        userType: 'admin',
        loyaltyProgram: 'early-adopter',
        hashedEmail: '555-12232-2332232-222',
      },
    });

    [eventName, payload] = expectFS('setUserVars');
    expectEqual(eventName, '201');
    expectEqual(payload.userType, 'admin');
  });

  it('should read any event not containing ecommerce and remove event ID', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-ga-event')],
    });

    const payload = expectFS('event')[1];
    expectUndefined(payload, 'ecommerce', 'gtm.uniqueEventId');
  });
});
