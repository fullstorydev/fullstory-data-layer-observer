import 'mocha';

import { DataLayerRule } from '../src/observer';
import { expectEqual } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';
import { AppMeasurement } from './mocks/adobe';

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var s: AppMeasurement;
}

describe('Ruleset: Custom rules', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      afterEach(async () => {
        await testHarness.tearDown();
      });

      after(async () => {
        await testEnv.tearDown();
      });

      it('only triggers rules for property changes that match rule selector', async () => {
        const rules: DataLayerRule[] = [
          {
            source: 's[^(eVar1)]',
            operators: [
              {
                name: 'insert',
                value: 'eVar1',
              },
            ],
            destination: 'FS.event',
          },
          {
            source: 's[^(eVar2)]',
            operators: [
              {
                name: 'insert',
                value: 'eVar2',
              },
            ],
            destination: 'FS.event',
          },
        ];

        testHarness = await testEnv.createTestHarness(rules, {
          s: {
            eVar11: 'test',
            eVar22: 'test',
          },
        });

        await testHarness.execute(() => {
          globalThis.s.eVar11 = '11';
        });

        // Wait for event dispatch to result in rule destination calls
        let [eventName, payload] = await testHarness.popEvent();
        expectEqual('eVar1', eventName);
        expectEqual('11', payload.eVar11);

        await testHarness.execute(() => {
          globalThis.s.eVar22 = '22';
        });

        [eventName, payload] = await testHarness.popEvent();
        expectEqual('eVar2', eventName);
        expectEqual('22', payload.eVar22);

        // Verify no other calls were made to rule destinations
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
