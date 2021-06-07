import { expect } from 'chai';
import 'mocha';

import '../rulesets/google-ua-enhanced-ecommerce.js';
import '../rulesets/google-event-measurement.js';

import {
  expectEqual, expectRule, expectFS, setupGlobals, ExpectObserver, expectGlobal, expectNoCalls, expectCall,
} from './utils/mocha';

enum Ruleset {
  Ecommerce = '_dlo_rules_google_ecommerce',
  EnhancedEcommerce = '_dlo_rules_google_enhanced_ecommerce',
  EventMeasurement = '_dlo_rules_google_measurement',
}

describe('Google Analytics Event Measurement rules', () => {
  beforeEach(() => setupGlobals([
    ['dataLayer', []],
  ]));

  afterEach(() => {
    ExpectObserver.getInstance().cleanup();
  });

  it('sends an object-based event to FS.event with the same event name', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-ga-event', Ruleset.EventMeasurement)],
    });

    // NOTE that this follows the object-based convention seen in most GA events
    expectGlobal('dataLayer').push({ event: 'helloWord' });
    const [eventName] = expectFS('event');
    expectEqual(eventName, 'helloWord');
  });

  it('sends an list-based event to FS.event with the same event name', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-gtg-event', Ruleset.EventMeasurement)],
    });

    // NOTE that this follows the list-based convention seen in later versions of gtg.js
    expectGlobal('dataLayer').push(['event', 'screen_view', { firebase_screen_class: 'app-products' }]);
    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'screen_view');
    expect(payload).to.not.be.undefined;
    expectEqual(payload.firebase_screen_class, 'app-products');
  });

  it('ignores gtm, optimize.domChange, and enhanced ecommerce related events', () => {
    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-ga-event', Ruleset.EventMeasurement)],
    });

    // verify the call queue expect code is working
    expectGlobal('dataLayer').push({ event: 'helloWord' });
    expectCall(expectGlobal('FS'), 'event');

    // now check that no calls get queued

    // object-based
    expectGlobal('dataLayer').push({ event: 'checkout', ecommerce: { total: 99.99 } });
    expectNoCalls(expectGlobal('FS'), 'event');

    expectGlobal('dataLayer').push({ event: 'gtm.click' });
    expectNoCalls(expectGlobal('FS'), 'event');

    expectGlobal('dataLayer').push({ event: 'optimize.domChange' });
    expectNoCalls(expectGlobal('FS'), 'event');

    // list-based
    expectGlobal('dataLayer').push(['event', 'checkout', { ecommerce: { total: 99.99 } }]);
    expectNoCalls(expectGlobal('FS'), 'event');

    expectGlobal('dataLayer').push(['event', 'gtm.click', {}]);
    expectNoCalls(expectGlobal('FS'), 'event');

    expectGlobal('dataLayer').push(['event', 'optimize.domChange', {}]);
    expectNoCalls(expectGlobal('FS'), 'event');
  });
});

describe('Google Analytics Enhanced Ecommerce rules', () => {
  beforeEach(() => setupGlobals([
    ['dataLayer', []],
  ]));

  afterEach(() => {
    ExpectObserver.getInstance().cleanup();
  });

  it('should read pageview', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ua-pageview', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      pageType: 'Home',
      pageName: 'Home: Fruit shoppe',
    });

    // TODO (van) change rule to setVars API after go live
    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'pageview');
    expectEqual(payload.pageType, 'Home');
    expectEqual(payload.pageName, 'Home: Fruit shoppe');
  });

  it('should read enhanced ecommerce detail', () => {
    ExpectObserver.getInstance().create({
      rules: [
        expectRule('fs-ua-e-commerce-detail-product', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-detail-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      ecommerce: {
        detail: {
          actionField: { action: 'detail', list: 'Product Gallery' },
          products: [
            {
              name: 'Heritage Huckleberries',
              id: 'P000525722',
              price: '2.99',
              brand: 'Heritage',
              category: 'product gallery',
              variant: '',
            },
          ],
        },
      },
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
        expectRule('fs-ua-e-commerce-click-product', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-click-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      event: 'productClick',
      ecommerce: {
        click: {
          actionField: { action: 'click', list: 'Search Results' },
          products: [
            {
              name: 'Heritage Huckleberries',
              id: 'P000525722',
              price: '2.99',
              brand: 'Heritage',
              category: 'homepage product recs',
              variant: '',
              position: 1,
            },
          ],
        },
      },
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
        expectRule('fs-ua-e-commerce-add-product', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-add-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      event: 'addToCart',
      ecommerce: {
        currencyCode: 'USD',
        add: {
          actionField: { action: 'add' },
          products: [
            {
              name: 'Heritage Huckleberries',
              id: 'P000525722',
              price: '2.99',
              brand: 'Heritage',
              category: 'product',
              variant: '',
              quantity: 2,
            },
          ],
        },
      },
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
        expectRule('fs-ua-e-commerce-remove-product', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-remove-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      event: 'removeFromCart',
      ecommerce: {
        currencyCode: 'USD',
        remove: {
          actionField: { action: 'remove' },
          products: [
            {
              name: 'Heritage Huckleberries',
              id: 'P000525722',
              price: '2.99',
              brand: 'Heritage',
              category: 'product',
              variant: '',
              quantity: 1,
            },
          ],
        },
      },
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
        expectRule('fs-ua-e-commerce-promo_click-promotion', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-promo_click-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      event: 'promotionClick',
      ecommerce: {
        promoClick: {
          actionField: { action: 'promo_click' },
          promotions: [
            {
              id: '1004-Blueberries123321',
              name: 'Fruits',
              creative: 'Blueberries123321',
              position: 'Feature',
            },
          ],
        },
      },
      eventCallback() {
        console.log('Callback called');
      },
      'gtm.uniqueEventId': 6,
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
        expectRule('fs-ua-e-commerce-purchase-product', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-purchase-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      ecommerce: {
        purchase: {
          actionField: {
            action: 'purchase',
            id: 'T12345',
            affiliation: 'Online Store',
            revenue: '35.43',
            tax: '4.90',
            shipping: '5.99',
            coupon: '',
          },
          products: [
            {
              name: 'Heritage Huckleberries',
              id: 'P000525722',
              price: '2.99',
              brand: 'Heritage',
              category: 'fruit',
              variant: '',
              quantity: 1,
              coupon: '',
            },
            {
              name: 'Cosmic Crisp Apple',
              id: '668ebb86-60b5-451e-92d3-044157d27823',
              price: '15.55',
              brand: 'Washington State Apple Farm',
              category: 'fruit',
              variant: '',
              quantity: 1,
            },
          ],
        },
      },
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
        expectRule('fs-ua-e-commerce-checkout-product', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-checkout-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      event: 'checkout',
      ecommerce: {
        checkout: {
          actionField: {
            action: 'checkout',
            step: 1,
            option: 'Visa',
          },
          products: [
            {
              name: 'Heritage Huckleberries',
              id: 'P000525722',
              price: '2.99',
              brand: 'Heritage',
              category: 'fruit',
              variant: '',
              quantity: 1,
            },
            {
              name: 'Cosmic Crisp Apple',
              id: '668ebb86-60b5-451e-92d3-044157d27823',
              price: '15.55',
              brand: 'Washington State Apple Farm',
              category: 'fruit',
              variant: '',
              quantity: 1,
            },
          ],
        },
      },
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
        expectRule('fs-ua-e-commerce-refund-product', Ruleset.EnhancedEcommerce),
        expectRule('fs-ua-e-commerce-refund-action', Ruleset.EnhancedEcommerce),
      ],
    });

    expectGlobal('dataLayer').push({
      ecommerce: {
        refund: {
          actionField: {
            action: 'refund',
            id: 'T12345',
          },
          products: [
            {
              id: 'P000525722',
              quantity: 1,
            },
          ],
        },
      },
    });

    let [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'refund');
    expectEqual(payload.id, 'T12345');

    [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'refund_product');
    expectEqual(payload.id, 'P000525722');
    expectEqual(payload.quantity, 1);
  });
});
