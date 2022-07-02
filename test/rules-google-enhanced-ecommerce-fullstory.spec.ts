import 'mocha';

import { expectEqual } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';

import '../rulesets/google-enhanced-ecommerce.js';

const ecommerceRulesKey = '_dlo_rules_google_ec';
const ecommerceRules = (window as Record<string, any>)[ecommerceRulesKey];
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var dataLayer: any[];
}

describe('Ruleset: Google Analytics Enhanced Ecommerce to FullStory', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      beforeEach(async () => {
        testHarness = await testEnv.createTestHarness(ecommerceRules, { dataLayer: [] });
      });

      afterEach(async () => {
        await testHarness.tearDown();
      });

      after(async () => {
        await testEnv.tearDown();
      });

      it('reads pageview', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({ pageType: 'Home', pageName: 'Home: Fruit shoppe' });
        });

        // TODO (van) change rule to setVars API after go live
        const [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'pageview');
        expectEqual(payload.pageType, 'Home');
        expectEqual(payload.pageName, 'Home: Fruit shoppe');
      });

      it('reads enhanced ecommerce detail', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'detail_product');
        expectEqual(payload.id, 'P000525722');
        expectEqual(payload.price, '2.99');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'detail');
        expectEqual(payload.list, 'Product Gallery');
      });

      it('reads enhanced ecommerce click', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'click_product');
        expectEqual(payload.id, 'P000525722');
        expectEqual(payload.price, '2.99');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'click');
        expectEqual(payload.list, 'Search Results');
      });

      it('reads enhanced ecommerce add', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'add_product');
        expectEqual(payload.id, 'P000525722');
        expectEqual(payload.price, '2.99');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'add');
      });

      it('reads enhanced ecommerce remove', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'remove_product');
        expectEqual(payload.id, 'P000525722');
        expectEqual(payload.price, '2.99');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'remove');
      });

      it('reads enhanced ecommerce promo_click', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
            'gtm.uniqueEventId': 6,
          });
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'promo_click_promotion');
        expectEqual(payload.id, '1004-Blueberries123321');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'promo_click');
      });

      it('reads enhanced ecommerce purchase', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'purchase_product');
        expectEqual(payload.id, '668ebb86-60b5-451e-92d3-044157d27823');
        expectEqual(payload.price, '15.55');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'purchase_product');
        expectEqual(payload.id, 'P000525722');
        expectEqual(payload.price, '2.99');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'purchase');
        expectEqual(payload.shipping, '5.99');
      });

      it('reads enhanced ecommerce checkout', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'checkout_product');
        expectEqual(payload.id, '668ebb86-60b5-451e-92d3-044157d27823');
        expectEqual(payload.price, '15.55');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'checkout_product');
        expectEqual(payload.id, 'P000525722');
        expectEqual(payload.price, '2.99');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'checkout');
        expectEqual(payload.step, 1);
      });

      it('reads enhanced ecommerce refund', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
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
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'refund_product');
        expectEqual(payload.id, 'P000525722');
        expectEqual(payload.quantity, 1);

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'refund');
        expectEqual(payload.id, 'T12345');
      });

      it('gracefully handles a "clear" event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            ecommerce: null,
          });
        });

        const event = await testHarness.popEvent();
        expectEqual(event, undefined);
      });
    });
  });
});
