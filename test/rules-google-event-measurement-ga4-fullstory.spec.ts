import 'mocha';
import { expect } from 'chai';

import { expectEqual } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';

import '../rulesets/google-event-measurement-ga4.js';

const eventMeasurementRulesKey = '_dlo_rules_google_em_ga4';
const eventMeasurementRules = (window as Record<string, any>)[eventMeasurementRulesKey];

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var dataLayer: any[];
}

describe('Ruleset: Google Analytics Event Measurement (GA4) to FullStory', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      beforeEach(async () => {
        testHarness = await testEnv.createTestHarness(eventMeasurementRules, { dataLayer: [] });
      });

      afterEach(async () => {
        await testHarness.tearDown();
      });

      after(async () => {
        await testEnv.tearDown();
      });

      it('sends an event to FS.event with the same event name', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push(['event', 'some-event-name', { prop1: 'value1' }]);
        });

        const [eventName, eventProps] = await testHarness.popEvent();
        expectEqual(eventName, 'some-event-name');
        expectEqual(eventProps, {
          gtgCommand: 'event',
          gtgAction: 'some-event-name',
          prop1: 'value1',
        });
      });

      it('ignores gtm events', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push(['event', 'gtm.click']);
        });

        const event = await testHarness.popEvent(500);

        expect(event).to.be.undefined;
      });

      it('ignores optimize.domChange events', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push(['event', 'optimize.domChange']);
        });

        const event = await testHarness.popEvent(500);

        expect(event).to.be.undefined;
      });

      it('ignores enhanced ecommerce events', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push(
            ['event', 'add_to_cart', {
              items: [{
                id: '123', name: 'T-Shirt', price: '19.00', quantity: 1,
              }],
            }],
          );
        });

        const event = await testHarness.popEvent(500);

        expect(event).to.be.undefined;
      });

      it('gracefully handles a "clear" event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push(
            null,
          );
        });

        const event = await testHarness.popEvent(500);
        expectEqual(event, undefined);

        const error = await testHarness.popError(500);
        expectEqual(error, undefined);
      });
    });
  });
});
