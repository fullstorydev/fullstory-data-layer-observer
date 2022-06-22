import 'mocha';

import { expectEqual, expectUndefined, expectMatch } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';
import { tealiumRetail, RetailDefinition } from './mocks/tealium';

import '../rulesets/tealium-retail.js';

const tealiumRulesKey = '_dlo_rules_tealium_retail';
const tealiumRules = (window as Record<string, any>)[tealiumRulesKey];

interface ExtendedRetailDefintion extends RetailDefinition {
  // eslint-disable-next-line camelcase
  tealium_event?: string;
  outsideScope?: boolean;
}

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var utag: {
    data: ExtendedRetailDefintion
  };
}

describe('Ruleset: Tealium to FullStory rules', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      beforeEach(async () => {
        testHarness = await testEnv.createTestHarness(tealiumRules, {
          utag: {
            data: {
              ...tealiumRetail,
              tealium_event: '',
            },
          },
        });
      });

      afterEach(async () => {
        await testHarness.tearDown();
      });

      after(async () => {
        await testEnv.tearDown();
      });

      it('monitors tealium_event', async () => {
        await testHarness.execute(() => {
          globalThis.utag.data.tealium_event = 'product_view';
        });

        const [id, payload] = await testHarness.popEvent();
        expectEqual(id, 'product_view');
        expectMatch(payload, tealiumRetail, 'product_id');
        expectEqual(payload.order_total, '54.47');
        expectEqual(payload.product_discount_amount, ['2.98']);
        expectUndefined(payload, 'customer_first_name', 'customer_last_name', 'customer_email');
      });

      it('does not monitor properties not included in the source', async () => {
        await testHarness.execute(() => {
          utag.data.outsideScope = true;
        });

        await new Promise<void>((resolve, reject) => {
          testHarness.popEvent(500)
            .then(() => {
              reject(new Error('Expected rejected promise due to no FS.event calls being present.'));
            })
            .catch(() => {
              resolve();
            });
        });
      });
    });
  });
});
