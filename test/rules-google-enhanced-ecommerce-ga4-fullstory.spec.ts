import 'mocha';

import { expect } from 'chai';
import { expectEqual } from './utils/mocha';
import {
  RulesetTestHarness,
  getRulesetTestEnvironments,
} from './utils/ruleset-test-harness';

import '../rulesets/google-enhanced-ecommerce-ga4.js';

const ecommerceRulesKey = '_dlo_rules_google_ec_ga4';
const ecommerceRules = (window as Record<string, any>)[ecommerceRulesKey];
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var dataLayer: any[];
}

describe('Ruleset: Google Analytics Enhanced Ecommerce (GA4) to FullStory', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      beforeEach(async () => {
        testHarness = await testEnv.createTestHarness(ecommerceRules, {
          dataLayer: [],
        });
      });

      afterEach(async () => {
        await testHarness.tearDown();
      });

      after(async () => {
        await testEnv.tearDown();
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#select_item

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm#select_an_item_from_a_list
      */
      it('reads select_item gtm event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            event: 'select_item',
            ecommerce: {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                },
              ],
              item_list_name: 'some list',
            },
          });
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'select_item');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expect(eventProps.item_list_name).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#select_item

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#select_an_item_from_a_list
      */
      it('reads select_item gtag event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push([
            'event',
            'select_item',
            {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                },
              ],
              item_list_name: 'some list',
            },
          ]);
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'select_item');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expect(eventProps.item_list_name).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#view_item

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm#view_item_details
      */
      it('reads view_item gtm event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            event: 'view_item',
            ecommerce: {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                },
              ],
              currency: 'USD',
            },
          });
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'view_item');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expect(eventProps.currency).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#view_item

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#view_item_details
      */
      it('reads view_item gtag event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push([
            'event',
            'view_item',
            {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                },
              ],
              currency: 'USD',
            },
          ]);
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'view_item');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expect(eventProps.currency).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#add_to_cart

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm#add_or_remove_an_item_from_a_shopping_cart
      */
      it('reads add_to_cart gtm event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                  quantity: 1,
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                  quantity: 2,
                },
              ],
              currency: 'USD',
            },
          });
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'add_to_cart');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.currency).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#add_to_cart

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#add_or_remove_an_item_from_a_shopping_cart
      */
      it('reads add_to_cart gtag event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push([
            'event',
            'add_to_cart',
            {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                  quantity: 1,
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                  quantity: 2,
                },
              ],
              currency: 'USD',
            },
          ]);
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'add_to_cart');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.currency).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#remove_from_cart

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm#add_or_remove_an_item_from_a_shopping_cart
      */
      it('reads remove_from_cart gtm event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            event: 'remove_from_cart',
            ecommerce: {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                  quantity: 1,
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                  quantity: 2,
                },
              ],
              currency: 'USD',
            },
          });
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'remove_from_cart');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.currency).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#remove_from_cart

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#add_or_remove_an_item_from_a_shopping_cart
      */
      it('reads remove_from_cart gtag event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push([
            'event',
            'remove_from_cart',
            {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                  quantity: 1,
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                  quantity: 2,
                },
              ],
              currency: 'USD',
            },
          ]);
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'remove_from_cart');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.currency).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#select_promotion

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm#apply_promotions
      */
      it('reads select_promotion gtm event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            event: 'select_promotion',
            ecommerce: {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                  quantity: 1,
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                  quantity: 2,
                },
              ],
              promotion_name: 'some promotion',
            },
          });
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'select_promotion');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.promotion_name).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#select_promotion

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#apply_promotions
      */
      it('reads select_promotion gtag event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push([
            'event',
            'select_promotion',
            {
              items: [
                {
                  item_id: 'sku_123',
                  item_name: 'first item',
                  price: '1.23',
                  quantity: 1,
                },
                {
                  item_id: 'sku_456',
                  item_name: 'second item',
                  price: '4.56',
                  quantity: 2,
                },
              ],
              promotion_name: 'some promotion',
            },
          ]);
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'select_promotion');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.promotion_name).to.be.undefined;
      });

      // TODO(nate): view_promotion
      // TODO(nate): purchase
    });
  });
});
