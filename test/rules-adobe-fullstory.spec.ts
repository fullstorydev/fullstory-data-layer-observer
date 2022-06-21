import 'mocha';

import { expectEqual, expectMatch, expectUndefined } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';
import { basicAppMeasurement, AppMeasurement } from './mocks/adobe';

import '../rulesets/adobe-app-measurement.js';

const adobeRulesKey = '_dlo_rules_adobe_am';
const adobeRules = (window as Record<string, any>)[adobeRulesKey];

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var s: AppMeasurement;
}

describe('Ruleset: Adobe to FullStory rules', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      afterEach(async () => {
        await testHarness.tearDown();
      });

      after(async () => {
        await testEnv.tearDown();
      });

      it('sends Adobe eVars and props to FS.event', async () => {
        testHarness = await testEnv.createTestHarness(adobeRules, {
          s: {
            eVar1: '',
            eVar10: '',
            eVar20: '',
            eVar50: '',
            eVar60: '',
            prop1: '',
            prop10: '',
            prop20: '',
            prop50: '',
            prop60: '',
            pageName: '',
          } as AppMeasurement,
        });

        await testHarness.execute(([localAppMeasurement]) => {
          globalThis.s.eVar1 = localAppMeasurement.eVar1;
          globalThis.s.eVar10 = localAppMeasurement.eVar10;
          globalThis.s.eVar20 = localAppMeasurement.eVar20;
          globalThis.s.eVar50 = localAppMeasurement.eVar50;
          globalThis.s.eVar60 = localAppMeasurement.eVar60;

          globalThis.s.prop1 = localAppMeasurement.prop1;
          globalThis.s.prop10 = localAppMeasurement.prop10;
          globalThis.s.prop20 = localAppMeasurement.prop20;
          globalThis.s.prop50 = localAppMeasurement.prop50;
          globalThis.s.prop60 = localAppMeasurement.prop60;

          globalThis.s.pageName = localAppMeasurement.pageName;
        }, [basicAppMeasurement]);

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'props');
        expectMatch(basicAppMeasurement, payload, 'prop1', 'prop10', 'prop20', 'prop50', 'prop60');
        expectUndefined(payload, 'pageName');

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'eVars');
        expectMatch(basicAppMeasurement, payload, 'eVar1', 'eVar10', 'eVar20', 'eVar50', 'eVar60');
        expectUndefined(payload, 'pageName');
      });

      it('does not send empty eVar or prop objects to FS.event', async () => {
        testHarness = await testEnv.createTestHarness(adobeRules, { s: basicAppMeasurement });

        await testHarness.execute(() => {
          globalThis.s.eVar1 = undefined;
          globalThis.s.prop1 = undefined;
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
