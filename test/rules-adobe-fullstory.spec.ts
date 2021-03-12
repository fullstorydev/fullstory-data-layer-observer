import 'mocha';

import { rules } from '../examples/rules/adobe-fullstory.json';
import { basicAppMeasurement } from './mocks/adobe';
import {
  expectEqual, expectMatch, expectRule, expectFS, setupGlobals, ExpectObserver, expectUndefined,
} from './utils/mocha';

describe('Adobe to FullStory rules', () => {
  beforeEach(() => setupGlobals([
    ['s', basicAppMeasurement],
    ['_dlo_rules', rules],
  ]));

  afterEach(() => {
    ExpectObserver.getInstance().cleanup();
  });

  it('it should send just Adobe eVars to FS.event', () => {
    ExpectObserver.getInstance().create(
      { rules: [expectRule('fs-event-adobe-evars')], readOnLoad: true },
    );

    const [eventName, payload] = expectFS('event');
    expectEqual(eventName, 'Adobe eVars');
    expectMatch(basicAppMeasurement, payload, 'eVar1', 'eVar10', 'eVar20', 'eVar50', 'eVar60');
    expectUndefined(payload, 'prop1', 'pageName');
  });

  it('it should FS.identify using specific Adobe eVars', () => {
    ExpectObserver.getInstance().create(
      { rules: [expectRule('fs-identify-adobe-evars')], readOnLoad: true },
    );

    const [uid, payload] = expectFS('identify');
    expectEqual(uid, basicAppMeasurement.eVar1);
    expectMatch(basicAppMeasurement, payload, 'eVar10', 'eVar20');
    expectUndefined(payload, 'prop1', 'pageName');
  });
});
