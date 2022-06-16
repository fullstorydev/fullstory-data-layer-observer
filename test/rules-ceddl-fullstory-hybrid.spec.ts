import 'mocha';

import { expectEqual, expectMatch, expectUndefined } from './utils/mocha';
import { RulesetTestHarness, getRulesetTestEnvironments } from './utils/ruleset-test-harness';
import { basicDigitalData } from './mocks/CEDDL';

import '../rulesets/ceddl.js';

const ceddlRulesKey = '_dlo_rules_ceddl';
const ceddlRules = (window as Record<string, any>)[ceddlRulesKey];

describe('CEDDL hybrid node and browser tests', () => {
  getRulesetTestEnvironments().forEach((testEnv) => {
    describe(`test environment: ${testEnv.name}`, () => {
      let testHarness: RulesetTestHarness;

      beforeEach(async () => {
        testHarness = await testEnv.createTestHarness(ceddlRules, { digitalData: basicDigitalData });
      });

      afterEach(async () => {
        await testHarness.tearDown();
      });

      it('sends the first CEDDL product to FS.event', async () => {
        await testHarness.execute(() => {
          ((globalThis || window) as any).digitalData.product[0].attributes = { customProp: 'foo' };
        });

        const [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'product');
        expectMatch(payload, basicDigitalData.product[0].productInfo, 'sku', 'productID', 'productName');
        expectMatch(payload, basicDigitalData.product[0].category, 'primaryCategory');
        expectEqual(payload.customProp, 'foo');
      });

      it('sends CEDDL cart to FS.event', async () => {
        await testHarness.execute(() => {
          ((globalThis || window) as any).digitalData.cart.attributes = { promotion: 'LaborDay2020' };
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
          ((globalThis || window) as any).digitalData.cart.item.push(localFirstProduct);
        }, [firstProduct]);

        let [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'cart_item');
        expectEqual(payload.productInfo.sku, firstProduct.productInfo.sku);
        expectUndefined(payload, 'linkedProduct');

        await testHarness.execute(([localSecondProduct]) => {
          ((globalThis || window) as any).digitalData.cart.item.push(localSecondProduct);
        }, [secondProduct]);

        [eventName, payload] = await testHarness.popEvent();
        expectEqual(eventName, 'cart_item');
        expectEqual(payload.productInfo.sku, secondProduct.productInfo.sku);
        expectUndefined(payload, 'linkedProduct');
      });

      it('does not send CEDDL cart item products to FS.event on load', (done) => {
        // digitalData.cart.item already has an item. Here, we're verifying no FS.event
        // calls were made as would be the case with readOnLoad: true.
        testHarness.popEvent(500)
          .then(() => {
            throw new Error('Expected rejected promise.');
          })
          .catch(() => {
            done();
          });
      });

      it('sends CEDDL page properties to FS.event', async () => {
        await testHarness.execute(() => {
          ((globalThis || window) as any).digitalData.page.attributes = { framework: 'react' };
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
    });
  });
});
