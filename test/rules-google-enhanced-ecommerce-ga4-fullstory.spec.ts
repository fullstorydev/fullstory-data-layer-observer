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

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#view_promotion

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm#apply_promotions
      */
      it('reads view_promotion gtm event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            event: 'view_promotion',
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
        expectEqual(eventName, 'view_promotion');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.promotion_name).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#view_promotion

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#apply_promotions
      */
      it('reads view_promotion gtag event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push([
            'event',
            'view_promotion',
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
        expectEqual(eventName, 'view_promotion');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expectEqual(eventProps.quantity, 1);
        expect(eventProps.promotion_name).to.be.undefined;
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm#purchase

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm#make_a_purchase_or_issue_a_refund
      */
      it('reads purchase gtm event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({
            event: 'purchase',
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
        expectEqual(eventName, 'Order Completed');
        expectEqual(eventProps.currency, 'USD');
        expectEqual(eventProps.products.length, 2);

        const firstProduct = eventProps.products[0];
        expectEqual(firstProduct.item_id, 'sku_123');
        expectEqual(firstProduct.item_name, 'first item');
        // Enhanced Ecommerce specifies that price and quantity are numbers. This assertion
        // demonstrates that we won't convert these values if they're strings. This is currently
        // a limitation of the DLO library which doesn't traverse into child objects or arrays
        // when converting properties.
        expectEqual(firstProduct.price, '1.23');
        expectEqual(firstProduct.quantity, 1);

        const secondProduct = eventProps.products[1];
        expectEqual(secondProduct.item_id, 'sku_456');
        expectEqual(secondProduct.item_name, 'second item');
        expectEqual(secondProduct.price, '4.56');
        expectEqual(secondProduct.quantity, 2);
      });

      /*
      Event reference:
      https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#purchase

      Examples:
      https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#make_a_purchase_or_issue_a_refund
      */
      it('reads purchase gtag event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push([
            'event',
            'purchase',
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
        expectEqual(eventName, 'Order Completed');
        expectEqual(eventProps.currency, 'USD');
        expectEqual(eventProps.products.length, 2);

        const firstProduct = eventProps.products[0];
        expectEqual(firstProduct.item_id, 'sku_123');
        expectEqual(firstProduct.item_name, 'first item');
        // Enhanced Ecommerce specifies that price and quantity are numbers. This assertion
        // demonstrates that we won't convert these values if they're strings. This is currently
        // a limitation of the DLO library which doesn't traverse into child objects or arrays
        // when converting properties.
        expectEqual(firstProduct.price, '1.23');
        expectEqual(firstProduct.quantity, 1);

        const secondProduct = eventProps.products[1];
        expectEqual(secondProduct.item_id, 'sku_456');
        expectEqual(secondProduct.item_name, 'second item');
        expectEqual(secondProduct.price, '4.56');
        expectEqual(secondProduct.quantity, 2);
      });

      [
        'select_item',
        'view_item',
        'add_to_cart',
        'remove_from_cart',
        'select_promotion',
        'view_promotion',
      ].forEach((eventName) => {
        it(`gracefully handles empty ecommerce.items for ${eventName} gtm events`, async () => {
          await testHarness.execute(() => {
            globalThis.dataLayer.push({
              event: eventName,
              ecommerce: {
                items: [],
              },
            });
          });

          const event = await testHarness.popEvent();
          expect(event).to.be.undefined;

          const error = await testHarness.popError();
          expect(error).to.be.undefined;
        });

        it(`gracefully handles empty items for ${eventName} gtag events`, async () => {
          await testHarness.execute(() => {
            globalThis.dataLayer.push([
              'event',
              eventName,
              {
                items: [],
              },
            ]);
          });

          const event = await testHarness.popEvent();
          expect(event).to.be.undefined;

          const error = await testHarness.popError();
          expect(error).to.be.undefined;
        });
      });
    });
  });
});
