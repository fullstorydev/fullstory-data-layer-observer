import 'mocha';

import { DataLayerRule } from '../src/observer';
import {
  expectEqual, waitForFS, setupGlobals, ExpectObserver, expectGlobal, expectNoCalls,
} from './utils/mocha';

describe('Custom rules', () => {
  afterEach(() => {
    ExpectObserver.getInstance().cleanup();
  });

  it('should only trigger rules for property changes that match rule selector', async function test() {
    (this as any)!.timeout(3000);

    const s = {
      eVar11: 'test',
      eVar22: 'test',
    };

    setupGlobals(([
      ['s', s],
    ]));

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

    ExpectObserver.getInstance().create({ rules });

    expectGlobal('s').eVar11 = 11;

    // Wait for event dispatch to result in rule destination calls
    let [eventName, payload] = await waitForFS('event');
    expectEqual('eVar1', eventName);
    expectEqual(11, payload.eVar11);

    expectGlobal('s').eVar22 = 22;

    [eventName, payload] = await waitForFS('event');
    expectEqual('eVar2', eventName);
    expectEqual(22, payload.eVar22);

    // Verify no other calls were made to rule destinations
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        expectNoCalls(expectGlobal('FS'), 'event');
        resolve();
      }, 1000);
    });
  });
});
