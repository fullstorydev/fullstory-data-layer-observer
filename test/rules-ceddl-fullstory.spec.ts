import 'mocha';

import { expectEqual, expectMatch, expectUndefined } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';
import { basicDigitalData, CEDDL } from './mocks/CEDDL';

import '../rulesets/ceddl.js';

const ceddlRulesKey = '_dlo_rules_ceddl';
const ceddlRules = (window as Record<string, any>)[ceddlRulesKey];

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var digitalData: CEDDL;
}

describe('Ruleset: CEDDL to FullStory', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      beforeEach(async () => {
        testHarness = await testEnv.createTestHarness(ceddlRules, { digitalData: basicDigitalData });
      });

      afterEach(async () => {
        await testHarness.tearDown();
      });

      after(async () => {
        await testEnv.tearDown();
      });

      it('sends the first CEDDL product to FS.event', async () => {
        await testHarness.execute(() => {
          globalThis.digitalData.product[0].attributes = { customProp: 'foo' };
        });

        const [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'product');
        expectMatch(payload, basicDigitalData.product[0].productInfo, 'sku', 'productID', 'productName');
        expectMatch(payload, basicDigitalData.product[0].category, 'primaryCategory');
        expectEqual(payload.customProp, 'foo');
      });

      it('sends CEDDL cart to FS.event', async () => {
        await testHarness.execute(() => {
          globalThis.digitalData.cart.attributes = { promotion: 'LaborDay2020' };
        });

        const [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'cart');
        expectEqual(payload.cartID, basicDigitalData.cart.cartID);
        expectEqual(payload.basePrice, basicDigitalData.cart.price.basePrice);
        expectEqual(payload.promotion, 'LaborDay2020');
      });

      it('sends dynamic CEDDL cart item additions to FS.event', async () => {
        const firstProduct = basicDigitalData.product[0];

        const secondProduct = {
          ...firstProduct,
          productInfo: {
            ...firstProduct.productInfo,
            sku: 'test',
          },
        };

        await testHarness.execute(([localFirstProduct]) => {
          globalThis.digitalData.cart.item.push(localFirstProduct);
        }, [firstProduct]);

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'cart_item');
        expectEqual(payload.productInfo.sku, firstProduct.productInfo.sku);
        expectUndefined(payload, 'linkedProduct');

        await testHarness.execute(([localSecondProduct]) => {
          globalThis.digitalData.cart.item.push(localSecondProduct);
        }, [secondProduct]);

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'cart_item');
        expectEqual(payload.productInfo.sku, secondProduct.productInfo.sku);
        expectUndefined(payload, 'linkedProduct');
      });

      it('sends CEDDL page properties to FS.event', async () => {
        await testHarness.execute(() => {
          globalThis.digitalData.page.attributes = { framework: 'react' };
        });

        const [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'page');

        // NOTE these are flattened but you could also simply send digitalData.page
        expectMatch(payload, basicDigitalData.page.pageInfo,
          'pageID', 'pageName', 'sysEnv', 'variant', 'breadcrumbs', 'author', 'language', 'industryCodes', 'publisher');

        expectEqual(payload.primaryCategory, basicDigitalData.page.category.primaryCategory);
        expectEqual(payload.framework, 'react'); // verify custom property
        expectEqual(payload.version, basicDigitalData.page.pageInfo.version);

        // check converted values
        expectEqual(payload.issueDate.toString(), new Date(basicDigitalData.page.pageInfo.issueDate).toString());
        expectEqual(payload.effectiveDate.toString(),
          new Date(basicDigitalData.page.pageInfo.effectiveDate).toString());
        expectEqual(payload.expiryDate.toString(), new Date(basicDigitalData.page.pageInfo.expiryDate).toString());

        // NOTE we have other ways in FullStory to see these
        expectUndefined(payload, 'destinationURL', 'referringURL');
      });

      it('sends CEDDL transaction transactionID and total properties to FS.event', async () => {
        await testHarness.execute(() => {
          globalThis.digitalData.transaction.attributes = { customProp: 'foo' };
        });

        const [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'transaction');
        expectEqual(payload.transactionID, basicDigitalData.transaction.transactionID);
        expectMatch(payload, basicDigitalData.transaction.total,
          'basePrice', 'voucherCode', 'voucherDiscount', 'currency', 'taxRate', 'shipping', 'shippingMethod',
          'priceWithTax', 'transactionTotal');
        expectEqual(payload.customProp, 'foo');
      });

      it('sends CEDDL event to FS.event', async () => {
        await testHarness.execute(() => {
          // Push events that already exist on basicDigitalData.event to trigger rules and simplify assertions
          globalThis.digitalData.event.push(globalThis.digitalData.event[0]);
        });

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, basicDigitalData.event[0].eventInfo.eventName);
        expectEqual(payload.eventAction, basicDigitalData.event[0].eventInfo.eventAction);
        expectEqual(payload.primaryCategory, basicDigitalData.event[0].category.primaryCategory);

        await testHarness.execute(() => {
          globalThis.digitalData.event.push(globalThis.digitalData.event[1]);
        });

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'event'); // NOTE this tests non-compliant data layers that do not defined eventName
        expectEqual(payload.eventAction, basicDigitalData.event[1].eventInfo.eventAction);
        expectEqual(payload.primaryCategory, basicDigitalData.event[1].category.primaryCategory);
      });
    });
  });
});
