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

      it('reads select_item GTM event', async () => {
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
              currency: 'USD',
            },
          });
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'select_item');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expect(eventProps.currency).to.be.undefined;
      });

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
              currency: 'USD',
            },
          ]);
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'select_item');
        expectEqual(eventProps.item_id, 'sku_123');
        expectEqual(eventProps.item_name, 'first item');
        expectEqual(eventProps.price, 1.23);
        expect(eventProps.currency).to.be.undefined;
      });

      it('reads view_item GTM event', async () => {
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

      it('reads add_to_cart GTM event', async () => {
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
    });
  });
});
