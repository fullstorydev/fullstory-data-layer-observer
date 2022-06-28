import 'mocha';
import { expect } from 'chai';

import { expectEqual, expectUndefined } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';

import '../rulesets/google-event-measurement.js';

const eventMeasurementRulesKey = '_dlo_rules_google_em';
const eventMeasurementRules = (window as Record<string, any>)[eventMeasurementRulesKey];

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var dataLayer: any[];
}

describe('Ruleset: Google Analytics Event Measurement to FullStory', () => {
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

      it('sends an object-based event to FS.event with the same event name', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push({ event: 'test' });
        });

        // NOTE that this follows the object-based convention seen in most GA events
        const [eventName] = await testHarness.popEvent();
        expectEqual(eventName, 'test');
      });

      it('ignores gtm, optimize.domChange, and enhanced ecommerce related events', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push(
            { event: 'test', ecommerce: { total: 99.99 }, 'gtm.uniqueEventId': 'event-id' },
          );
        });

        const [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'test');
        expectUndefined(payload, 'ecommerce');
        expectUndefined(payload, 'gtm.uniqueEventId');

        await testHarness.execute(() => {
          globalThis.dataLayer.push({ event: 'gtm.click' });
          globalThis.dataLayer.push({ event: 'optimize.domChange' });
        });

        // now check that no calls get queued
        expect(await testHarness.popEvent(500)).to.be.undefined;
      });

      it('gracefully handles a "clear" event', async () => {
        await testHarness.execute(() => {
          globalThis.dataLayer.push(
            null,
          );
        });

        const event = await testHarness.popEvent();
        expect(event).to.be.undefined;
      });
    });
  });
});
