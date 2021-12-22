import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import { basicDigitalData, CEDDL } from './mocks/CEDDL';

declare global {
  interface Window {
    events: any[][];
    warnings: any[][];
    errors: any[][];
    FS: any;
    // eslint-disable-next-line camelcase
    _dlo_observer?: any;
    digitalData?: CEDDL;
    dataLayer: any[];
  }
}

let page: Page;

test.beforeEach(async ({ context }) => {
  page = await context.newPage();

  await page.evaluate(() => {
    window.warnings = [];
    window.errors = [];
    window.events = [];

    window.console.warn = (...args) => {
      window.warnings.push(args);
    };

    window.console.error = (...args) => {
      window.errors.push(args);
    };

    window.FS = {
      event: (...args: any) => { window.events.push(args); },
    };
  });
});

/**
 * Initializes the test browser session with the given rules and data layer.
 * @param rulesetFileName the file name containing the rulesets within the /rulesets folder
 * @param dataLayer the data layer to load into the test browser session
 */
const initBrowserState = async (rulesetFileName: string, dataLayer: any) => {
  const ruleset = fs.readFileSync(path.resolve(__dirname, `../rulesets/${rulesetFileName}`), 'utf8');
  const scriptSrc = process.env.PLAYWRIGHT_DLO_SCRIPT_SRC;

  if (!scriptSrc) {
    throw Error('PLAYWRIGHT_DLO_SCRIPT_SRC should define the hosted DLO script URL to be loaded for browser testing');
  }

  await page.evaluate(([rules, data, dloScriptSrc]) => {
    // We're eval'ing a script string from a local file that is under our control in a playwright-managed
    // browser context
    // eslint-disable-next-line no-eval
    window.eval(rules);

    Object.keys(data).forEach((key) => {
      window[key] = data[key];
    });

    const dloScriptTag = document.createElement('script');
    dloScriptTag.src = dloScriptSrc;
    document.body.appendChild(dloScriptTag);
  }, [ruleset, dataLayer, scriptSrc]);

  // eslint-disable-next-line no-underscore-dangle
  await page.waitForFunction(() => window._dlo_observer); /* Wait for DLO to be initialized */
};

/**
 * Returns any console-logged warnings and errors as well as args passed to any FS.event calls.
 * Clears existing warnings, errors, and events when called.
 */
const popState = async () => {
  const [warnings, errors, events] = await page.evaluate(() => {
    const state = [
      window.warnings,
      window.errors,
      window.events,
    ];

    window.warnings = [];
    window.errors = [];
    window.events = [];

    return state;
  });

  return { warnings, errors, events };
};

/**
 * Waits for the presence of the given number of FS.event calls (default: 1).
 * @param eventCount the number of FS.event calls to wait for
 */
const waitForEvents = async (eventCount = 1) => {
  await page.waitForFunction((count) => window.events.length === count, eventCount, { timeout: 2000 });
};

/**
 * Matches values of keys from expected against the same keys in actual -- excluding given keysToExclude.
 * @param actual the object to compare against the expected object
 * @param expected the object to compare against the actual object
 * @param keysToExclude any keys from the expected object to exclude from comparison
 */
const expectMatch = (actual: any, expected: any, keysToExclude: string[] = []) => {
  Object.keys(expected)
    .filter((key) => !keysToExclude.includes(key))
    .forEach((key) => {
      expect(actual[key]).toEqual(expected[key]);
    });
};

test.describe.parallel('CEDDL', () => {
  test.beforeEach(async () => {
    await initBrowserState('ceddl.js', { digitalData: basicDigitalData });
  });

  // TODO(nate): It would be nice if we could reuse logic from rules-ceddl-fullstory.spec.ts since we're
  //  duplicating a lot of arrangement and assertion logic here.

  test('sends digitalData.cart to FS.event', async () => {
    await page.evaluate(() => {
      window.digitalData.cart.attributes = { newProperty: 'new-value' };
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const [eventName, payload] = events[0];
    expect(eventName).toEqual('cart');

    // Cart values are flattended, so nested properties are promoted to root properties
    expect(payload.cartID).toEqual(basicDigitalData.cart.cartID);
    expectMatch(payload, basicDigitalData.cart.price);
    expect(payload.newProperty).toEqual('new-value');
    expect(payload.item).toBeUndefined();
  });

  test('sends digitalData.cart.item to FS.event', async () => {
    await page.evaluate(() => {
      window.digitalData.cart.item.push(window.digitalData.cart.item[0]);
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const [eventName, payload] = events[0];
    expect(eventName).toEqual('cart_item');

    // Cart item values are not flattended, so properties will remain nested
    const expectedCartItem = basicDigitalData.cart.item[0];
    expect(payload.quantity).toEqual(expectedCartItem.quantity);
    expectMatch(payload.productInfo, expectedCartItem.productInfo);
    expectMatch(payload.category, expectedCartItem.category);
    expectMatch(payload.price, expectedCartItem.price);
    expectMatch(payload.attributes, expectedCartItem.attributes);
    expect(payload.linkedProduct).toBeUndefined();
  });

  test('sends digitalData.page to FS.event', async () => {
    await page.evaluate(() => {
      window.digitalData.page.attributes = { newProperty: 'new-value' };
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const [eventName, payload] = events[0];
    expect(eventName).toEqual('page');

    // Page values are flattended, so nested properties are promoted to root properties
    expectMatch(payload, basicDigitalData.page.pageInfo, [
      'destinationURL', 'referringURL', 'issueDate', 'effectiveDate', 'expiryDate']);
    expect(payload.issueDate).toEqual(new Date(basicDigitalData.page.pageInfo.issueDate));
    expect(payload.effectiveDate).toEqual(new Date(basicDigitalData.page.pageInfo.effectiveDate));
    expect(payload.expiryDate).toEqual(new Date(basicDigitalData.page.pageInfo.expiryDate));
    expectMatch(payload, basicDigitalData.page.category);
    expect(payload.newProperty).toEqual('new-value');
  });

  test('sends digitalData.product[0] to FS.event', async () => {
    await page.evaluate(() => {
      window.digitalData.product[0].attributes = { newProperty: 'new-value' };
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const [eventName, payload] = events[0];
    expect(eventName).toEqual('product');

    // Product values are flattended, so nested properties are promoted to root properties
    const expectedProduct = basicDigitalData.product[0];
    expectMatch(payload, expectedProduct.productInfo);
    expectMatch(payload, expectedProduct.category);
    expectMatch(payload.newProperty, 'new-value');
    expect(payload.linkedProduct).toBeUndefined();
  });

  test('sends digitalData.transaction to FS.event', async () => {
    await page.evaluate(() => {
      window.digitalData.transaction.attributes = { newProperty: 'new-value' };
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const [eventName, payload] = events[0];
    expect(eventName).toEqual('transaction');

    // Transaction values are flattended, so nested properties are promoted to root properties
    expect(payload.transactionID).toEqual(basicDigitalData.transaction.transactionID);
    expectMatch(payload, basicDigitalData.transaction.total);
    expectMatch(payload.newProperty, 'new-value');
    expect(payload.profile).toBeUndefined();
    expect(payload.item).toBeUndefined();
  });

  test('sends digitalData.event to FS.event', async () => {
    await page.evaluate(() => {
      window.digitalData.event.push(window.digitalData.event[0]);
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const expectedEvent = basicDigitalData.event[0];
    const [eventName, payload] = events[0];
    expect(eventName).toEqual(expectedEvent.eventInfo.eventName);

    // Event values are flattended, so nested properties are promoted to root properties
    expectMatch(payload, expectedEvent.eventInfo, ['timeStamp']);
    expectMatch(payload, expectedEvent.category, ['attributes']);
  });
});

// TODO(nate): It would be nice if we could reuse logic from rules-google-fullstory.spec.ts since we're
//  duplicating a lot of arrangement and assertion logic here.

test.describe.parallel('Google Analytics Event Measurement', () => {
  test.beforeEach(async () => {
    await initBrowserState('google-event-measurement.js', { dataLayer: [] });
  });

  test('sends object-based events to FS.event', async () => {
    await page.evaluate(() => {
      window.dataLayer.push({ event: 'test' });
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const [eventName] = events[0];
    expect(eventName).toEqual('test');
  });

  test('ignores gtm and optimize.domChange', async () => {
    await page.evaluate(() => {
      window.dataLayer.push({ event: 'gtm.click' });
      window.dataLayer.push({ event: 'optimize.domChange' });
    });

    await page.waitForTimeout(1000);

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(0);
  });
});

test.describe.parallel('Google Analytics Enhanced Ecommerce', () => {
  test.beforeEach(async () => {
    await initBrowserState('google-ua-enhanced-ecommerce.js', { dataLayer: [] });
  });

  test('sends page views to FS.event', async () => {
    await page.evaluate(() => {
      window.dataLayer.push({ pageType: 'test-type', pageName: 'test-name' });
    });

    await waitForEvents();

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(1);

    const [eventName, payload] = events[0];
    expect(eventName).toEqual('pageview');

    expect(payload.pageType).toEqual('test-type');
    expect(payload.pageName).toEqual('test-name');
  });

  ['detail', 'click', 'add', 'remove'].forEach((eventType) => {
    test(`sends ecommerce ${eventType} events to FS.event`, async () => {
      await page.evaluate((ecommerceEventType) => {
        window.dataLayer.push({
          ecommerce: {
            [ecommerceEventType]: {
              actionField: { action: 'test-action', someProperty: '99.99' },
              products: [{
                name: 'test-name',
                id: 'test-id',
                price: '99.99',
              }],
            },
          },
        });
      }, eventType);

      await waitForEvents(2);

      const { warnings, errors, events } = await popState();

      expect(warnings).toHaveLength(0);
      expect(errors).toHaveLength(0);
      expect(events).toHaveLength(2);

      const [actionEvent, productEvent] = events;

      let [eventName, payload] = actionEvent;
      expect(eventName).toEqual(eventType);
      expect(payload.action).toEqual('test-action');
      // Action payloads are converted, so numeric strings are converted to numbers
      expect(payload.someProperty).toEqual(99.99);

      [eventName, payload] = productEvent;
      expect(eventName).toEqual(`${eventType}_product`);
      expect(payload.name).toEqual('test-name');
      expect(payload.id).toEqual('test-id');
      // Product payloads are converted, so numeric strings are converted to numbers
      expect(payload.price).toEqual(99.99);
    });
  });

  test('sends promo click events to FS.event', async () => {
    await page.evaluate(() => {
      window.dataLayer.push({
        ecommerce: {
          promoClick: {
            actionField: { action: 'test-action', someProperty: '99.99' },
            promotions: [{
              name: 'test-name',
              id: 'test-id',
            }],
          },
        },
      });
    });

    await waitForEvents(2);

    const { warnings, errors, events } = await popState();

    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(events).toHaveLength(2);

    const [actionEvent, productEvent] = events;

    let [eventName, payload] = actionEvent;
    expect(eventName).toEqual('promo_click');
    expect(payload.action).toEqual('test-action');
    // Action payloads are converted, so numeric strings are converted to numbers
    expect(payload.someProperty).toEqual(99.99);

    [eventName, payload] = productEvent;
    expect(eventName).toEqual('promo_click_promotion');
    expect(payload.name).toEqual('test-name');
    expect(payload.id).toEqual('test-id');
  });

  ['checkout', 'purchase', 'refund'].forEach((eventType) => {
    test(`sends ${eventType} events to FS.event`, async () => {
      await page.evaluate((ecommerceEventType) => {
        window.dataLayer.push({
          ecommerce: {
            [ecommerceEventType]: {
              actionField: { action: 'test-action', someProperty: '99.99' },
              products: [
                {
                  name: 'test-name-1',
                  id: 'test-id-1',
                  price: '1.00',
                },
                {
                  name: 'test-name-2',
                  id: 'test-id-2',
                  price: '2.00',
                },
              ],
            },
          },
        });
      }, eventType);

      await waitForEvents(3);

      const { warnings, errors, events } = await popState();

      expect(warnings).toHaveLength(0);
      expect(errors).toHaveLength(0);
      expect(events).toHaveLength(3);

      // Product events fan out, creating an event for each product
      const [actionEvent, firstProductEvent, secondProductEvent] = events;

      let [eventName, payload] = actionEvent;
      expect(eventName).toEqual(eventType);
      expect(payload.action).toEqual('test-action');
      // Action payloads are converted, so numeric strings are converted to numbers
      expect(payload.someProperty).toEqual(99.99);

      [eventName, payload] = firstProductEvent;
      expect(eventName).toEqual(`${eventType}_product`);
      expect(payload.name).toEqual('test-name-1');
      expect(payload.id).toEqual('test-id-1');
      // Product payloads are converted, so numeric strings are converted to numbers
      expect(payload.price).toEqual(1.00);

      [eventName, payload] = secondProductEvent;
      expect(eventName).toEqual(`${eventType}_product`);
      expect(payload.name).toEqual('test-name-2');
      expect(payload.id).toEqual('test-id-2');
      // Product payloads are converted, so numeric strings are converted to numbers
      expect(payload.price).toEqual(2.00);
    });
  });
});
