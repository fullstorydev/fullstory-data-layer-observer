import 'mocha';

import DataHandler from '../src/handler';
import { rules } from '../examples/rules/tealium-fullstory.json';

import { tealiumRetail } from './mocks/tealium';
import {
  expectEqual, expectRule, expectFS, setupGlobals, ExpectObserver, expectNoCalls, global, expectUndefined, expectMatch,
} from './utils/mocha';

describe('Tealium to FullStory rules', () => {
  beforeEach(() => setupGlobals([
    ['utag', { data: tealiumRetail }], // NOTE the expando becomes utag.data
    ['_dlo_rules', rules],
  ]));

  afterEach(() => {
    ExpectObserver.getInstance().cleanup();
  });

  it('should read tealium_event', () => {
    global('utag').data.tealium_event = 'product_view';

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-tealium-event')],
    });

    const [id, payload] = expectFS('event');
    expectEqual(id, 'product_view');
    expectMatch(payload, tealiumRetail, 'product_id');
    expectEqual(payload.order_total, 54.47);
    expectEqual(payload.product_discount_amount, 2.98); // NOTE list reduced to single value
    expectUndefined(payload, 'customer_first_name', 'customer_last_name', 'customer_email');
  });

  it('should not monitor properties not included in the source', (done) => {
    global('utag').data.tealium_event = 'product_view';

    ExpectObserver.getInstance().create({
      // ensure this rule never reads on load
      rules: [{ ...expectRule('fs-tealium-event'), readOnLoad: false }],
    });

    // NOTE this is a valid property to monitor
    global('utag').data.product_id = ['PROD789'];

    // check the assignment
    setTimeout(() => {
      const [id, payload] = expectFS('event');
      expectEqual(id, 'product_view');
      expectEqual(payload.product_id, 'PROD789');
    }, DataHandler.debounceTime * 1.5);

    // NOTE this is an invalid property to monitor because it is not picked
    global('utag').data.outsideScope = true;

    // check the assignment
    setTimeout(() => {
      expectNoCalls(global('FS'), 'event');
      done();
    }, DataHandler.debounceTime * 1.5);
  });

  it('should identify user', () => {
    global('utag').data.tealium_event = 'user_registration';

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-tealium-user-registration')],
    });

    const [uid, payload] = expectFS('identify');
    expectEqual(uid, tealiumRetail.customer_id);
    expectUndefined(payload, 'customer_first_name'); // NOTE renamed to displayName
    expectMatch(payload, tealiumRetail, 'customer_last_name', 'customer_city');
    expectEqual(payload.email, tealiumRetail.customer_email);
    expectEqual(payload.displayName, tealiumRetail.customer_first_name);
  });

  it('should setUserVars', () => {
    global('utag').data.tealium_event = 'user_update';

    ExpectObserver.getInstance().create({
      rules: [expectRule('fs-tealium-user-update')],
    });

    const [payload] = expectFS('setUserVars');
    expectMatch(payload, tealiumRetail, 'customer_first_name', 'customer_last_name', 'customer_city');
  });
});
