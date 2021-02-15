import deepcopy from 'deepcopy';
import { expect } from 'chai';
import 'mocha';

import { DataLayerObserver, DataLayerRule } from '../src/observer';
import * as adobeRules from '../examples/rules/adobe-fullstory.json';
import * as ceddlRules from '../examples/rules/ceddl-fullstory.json';
import * as googleTagsRules from '../examples/rules/google-tags-fullstory.json';
import * as tealiumRetailRules from '../examples/rules/tealium-fullstory.json';

import { basicAppMeasurement, AppMeasurement } from './mocks/adobe';
import { CEDDL, basicDigitalData } from './mocks/CEDDL';
import { basicGoogleTags } from './mocks/google-tags';
import { tealiumRetail } from './mocks/tealium';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
import { expectParams, ExpectObserver, expectNoCalls } from './utils/mocha';
import DataHandler from '../src/handler';

interface GlobalMock {
  digitalData: CEDDL,
  dataLayer: any[],
  FS: FullStory
  console: Console,
  s: AppMeasurement,
}

let globalMock: GlobalMock;

const rules = [
  ...adobeRules.rules, ...ceddlRules.rules, ...googleTagsRules.rules, ...tealiumRetailRules.rules,
];

function getRule(id: string) {
  const rule = rules.find((r: DataLayerRule) => r.id === id);
  expect(rule).to.not.be.undefined;

  return rule!;
}

describe('Google Tags to FullStory rules', () => {
  beforeEach(() => {
    (globalThis as any).dataLayer = deepcopy(basicGoogleTags);
    (globalThis as any).FS = new FullStory();
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).dataLayer;
    delete (globalThis as any).FS;
  });

  it('should read pageview', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-pageview'),
      ],
    });

    const [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('pageview');
    expect(payload.pageType).to.eq('Home');

    (globalThis as any).dataLayer.push({
      pageType: 'Test',
      pageName: 'test',
    });
    const [id3, payload3] = expectParams(globalMock.FS, 'event');
    expect(id3).to.eq('pageview');
    expect(payload3.pageName).to.eq('test');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce detail', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-e-commerce-detail-product'),
        { ...getRule('fs-ga-e-commerce-detail-action'), source: 'dataLayer[5]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('detail');
    expect(payload.list).to.eq('Product Gallery');

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('detail_product');
    expect(payload.id).to.eq('P000525722');
    expect(payload.price).to.eq(2.99);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce click', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-e-commerce-click-product'),
        { ...getRule('fs-ga-e-commerce-click-action'), source: 'dataLayer[4]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('click');
    expect(payload.list).to.eq('Search Results');

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('click_product');
    expect(payload.id).to.eq('P000525722');
    expect(payload.price).to.eq(2.99);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce add', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-e-commerce-add-product'),
        { ...getRule('fs-ga-e-commerce-add-action'), source: 'dataLayer[6]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('add');

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('add_product');
    expect(payload.id).to.eq('P000525722');
    expect(payload.price).to.eq(2.99);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce remove', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-e-commerce-remove-product'),
        { ...getRule('fs-ga-e-commerce-remove-action'), source: 'dataLayer[7]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('remove');

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('remove_product');
    expect(payload.id).to.eq('P000525722');
    expect(payload.price).to.eq(2.99);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce promo_click', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-e-commerce-promo_click-promotion'),
        { ...getRule('fs-ga-e-commerce-promo_click-action'), source: 'dataLayer[9]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('promo_click');

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('promo_click_promotion');
    expect(payload.id).to.eq('1004-Blueberries123321');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce purchase', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-e-commerce-purchase-product'),
        { ...getRule('fs-ga-e-commerce-purchase-action'), source: 'dataLayer[11]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('purchase');
    expect(payload.shipping).to.eq(5.99);

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('purchase_product');
    expect(payload.id).to.eq('668ebb86-60b5-451e-92d3-044157d27823');
    expect(payload.price).to.eq(15.55);

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('purchase_product');
    expect(payload.id).to.eq('P000525722');
    expect(payload.price).to.eq(2.99);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce checkout', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        { ...getRule('fs-ga-e-commerce-checkout-product') },
        { ...getRule('fs-ga-e-commerce-checkout-action'), source: 'dataLayer[10]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('checkout');
    expect(payload.step).to.eq(1);

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('checkout_product');
    expect(payload.id).to.eq('668ebb86-60b5-451e-92d3-044157d27823');
    expect(payload.price).to.eq(15.55);

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('checkout_product');
    expect(payload.id).to.eq('P000525722');
    expect(payload.price).to.eq(2.99);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read enhanced ecommerce refund', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        { ...getRule('fs-ga-e-commerce-refund-product') },
        { ...getRule('fs-ga-e-commerce-refund-action'), source: 'dataLayer[12]' },
      ],
    });
    expect(observer).to.not.be.undefined;
    let [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('refund');
    expect(payload.id).to.eq('T12345');

    [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('refund_product');
    expect(payload.id).to.eq('P000525722');
    expect(payload.quantity).to.eq(1);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should set the user', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-user-vars'),
      ],
    });
    expect(observer).to.not.be.undefined;
    const [id, payload] = expectParams(globalMock.FS, 'setUserVars');
    expect(id).to.eq('101');
    expect(payload.userType).to.eq('member');

    (globalThis as any).dataLayer.push({
      userProfile: {
        userId: '201',
        userType: 'admin',
        loyaltyProgram: 'early-adopter',
        hashedEmail: '555-12232-2332232-222',
      },
    });
    const [id2, payload2] = expectParams(globalMock.FS, 'setUserVars');
    expect(id2).to.eq('201');
    expect(payload2.userType).to.eq('admin');

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should read any event not containing ecommerce and remove event ID', () => {
    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-ga-event'),
      ],
    });
    expect(observer).to.not.be.undefined;
    const [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.not.be.empty;
    expect(payload.ecommerce).to.be.undefined;
    expect(payload['gtm.uniqueEventId']).to.be.undefined;

    ExpectObserver.getInstance().cleanup(observer);
  });
});

describe('CEDDL to FullStory rules', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = deepcopy(basicDigitalData);
    (globalThis as any).FS = new FullStory();
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
    delete (globalThis as any).FS;
  });

  it('it should send any CEDDL user property to FS.setUserVars', () => {
    const { profileInfo, address } = basicDigitalData.user.profile[0];

    (globalThis as any).digitalData.user.profile[0].job = 'developer'; // inject custom property

    const observer = new DataLayerObserver({ rules: [getRule('fs-uservars-ceddl-user-all')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [payload] = expectParams(globalMock.FS, 'setUserVars');
    expect(payload.profileID).to.eq(profileInfo.profileID);
    expect(payload.userName).to.eq(profileInfo.userName);
    expect(payload.line1).to.eq(address.line1);
    expect(payload.line2).to.eq(address.line2);
    expect(payload.city).to.eq(address.city);
    expect(payload.stateProvince).to.eq(address.stateProvince);
    expect(payload.postalCode).to.eq(address.postalCode);
    expect(payload.country).to.eq(address.country);
    expect(payload.segment).to.be.undefined;
    expect(payload.social).to.be.undefined;
    expect(payload.attributes).to.be.undefined;
    expect(payload.job).to.eq('developer'); // verify custom property
  });

  it('it should send any CEDDL user property to FS.identify', () => {
    const { profileInfo, address } = basicDigitalData.user.profile[0];

    const observer = new DataLayerObserver({ rules: [getRule('fs-identify-ceddl-user-all')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [uid, payload] = expectParams(globalMock.FS, 'identify');
    expect(uid).to.eq(profileInfo.profileID);
    expect(payload.userName).to.eq(profileInfo.userName);
    expect(payload.line1).to.eq(address.line1);
    expect(payload.segment).to.be.undefined;
  });

  it('it should send only allowed CEDDL user properties to FS.identify', () => {
    (globalThis as any).digitalData.user.profile[0].password = 'pa$$w0rd'; // inject sensitive property

    const { profileInfo, address } = basicDigitalData.user.profile[0];

    const observer = new DataLayerObserver({ rules: [getRule('fs-identify-ceddl-user-allowed')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [uid, payload] = expectParams(globalMock.FS, 'identify');
    expect(uid).to.eq(profileInfo.profileID);
    expect(payload.userName).to.eq(profileInfo.userName);
    expect(payload.line1).to.eq(address.line1);
    expect(payload.password).to.be.undefined;
  });

  it('it should send the first CEDDL product to FS.event', () => {
    const product = (globalThis as any).digitalData.product[0];
    (product as any).customProp = 'Foo'; // inject custom property

    const { primaryCategory } = product.category;
    const { sku, productID, productName } = product.productInfo;

    const observer = new DataLayerObserver({ rules: [getRule('fs-event-ceddl-product')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('product');
    expect(payload.sku).to.eq(sku);
    expect(payload.productID).to.eq(productID);
    expect(payload.productName).to.eq(productName);
    expect(payload.primaryCategory).to.eq(primaryCategory);
    expect(payload.customProp).to.eql((product as any).customProp);
  });

  it('it should send CEDDL cart to FS.event', () => {
    const { cartID, price } = basicDigitalData.cart;

    (globalThis as any).digitalData.cart.promotion = 'LaborDay2020'; // inject custom property

    const observer = new DataLayerObserver({ rules: [getRule('fs-event-ceddl-cart')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('cart');
    expect(payload.cartID).to.eq(cartID);
    expect(payload.basePrice).to.eq(price.basePrice);
    expect(payload.promotion).to.eq((globalThis as any).digitalData.cart.promotion);
  });

  it('it should convert strings to reals and send CEDDL cart properties to FS.event', () => {
    const { price: { basePrice, priceWithTax, cartTotal } } = basicDigitalData.cart;

    // convert to strings for testing
    (globalThis as any).digitalData.cart.price.basePrice = basePrice.toString();
    (globalThis as any).digitalData.cart.price.priceWithTax = priceWithTax.toString();
    (globalThis as any).digitalData.cart.price.cartTotal = cartTotal.toString();

    expect(typeof (globalThis as any).digitalData.cart.price.basePrice).to.eq('string');
    expect(typeof (globalThis as any).digitalData.cart.price.priceWithTax).to.eq('string');
    expect(typeof (globalThis as any).digitalData.cart.price.cartTotal).to.eq('string');

    const observer = new DataLayerObserver({ rules: [getRule('fs-event-ceddl-cart')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('cart');

    // NOTE these are flattened but you could also simply send digitalData.cart.price
    expect(payload.basePrice).to.eq(basePrice);
    expect(payload.priceWithTax).to.eq(priceWithTax);
    expect(payload.cartTotal).to.eq(cartTotal);

    // reset to original values
    (globalThis as any).digitalData.cart.price.basePrice = basePrice;
    (globalThis as any).digitalData.cart.price.priceWithTax = priceWithTax;
    (globalThis as any).digitalData.cart.price.cartTotal = cartTotal;
  });

  it('it should send CEDDL page properties to FS.event', () => {
    const { pageInfo, category } = basicDigitalData.page;

    (globalThis as any).digitalData.page.framework = 'react'; // inject custom property

    const observer = new DataLayerObserver({ rules: [getRule('fs-event-ceddl-page')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('page');

    // NOTE these are flattened but you could also simply send digitalData.page
    expect(payload.pageID).to.eq(pageInfo.pageID);
    expect(payload.pageName).to.eq(pageInfo.pageName);
    expect(payload.sysEnv).to.eq(pageInfo.sysEnv);
    expect(payload.variant).to.eq(pageInfo.variant);
    expect(payload.breadcrumbs).to.eql(pageInfo.breadcrumbs);
    expect(payload.author).to.eq(pageInfo.author);
    expect(payload.language).to.eq(pageInfo.language);
    expect(payload.industryCodes).to.eq(pageInfo.industryCodes);
    expect(payload.publisher).to.eq(pageInfo.publisher);
    expect(payload.primaryCategory).to.eq(category.primaryCategory);
    expect(payload.framework).to.eq('react'); // verify custom property

    // check converted values
    expect(payload.version).to.eq(1.14);
    expect(payload.issueDate.toString()).to.eq(new Date(pageInfo.issueDate).toString());
    expect(payload.effectiveDate.toString()).to.eq(new Date(pageInfo.effectiveDate).toString());
    expect(payload.expiryDate.toString()).to.eq(new Date(pageInfo.expiryDate).toString());

    // NOTE we have other ways in FullStory to see these
    expect(payload.destinationURL).to.be.undefined;
    expect(payload.referringURL).to.be.undefined;
  });

  it('it should send CEDDL transaction transactionID and total properties to FS.event', () => {
    const {
      transactionID, total: {
        basePrice, voucherCode, voucherDiscount, currency, taxRate, shipping,
        shippingMethod, priceWithTax, transactionTotal,
      },
    } = basicDigitalData.transaction;

    const observer = new DataLayerObserver({
      rules: [getRule('fs-event-ceddl-transaction')],
      readOnLoad: true,
    });
    expect(observer).to.not.be.undefined;

    const [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('transaction');
    expect(payload.transactionID).to.eq(transactionID);
    expect(payload.basePrice).to.eq(basePrice);
    expect(payload.voucherCode).to.eq(voucherCode);
    expect(payload.voucherDiscount).to.eq(voucherDiscount);
    expect(payload.currency).to.eq(currency);
    expect(payload.taxRate).to.eq(taxRate);
    expect(payload.shipping).to.eq(shipping);
    expect(payload.shippingMethod).to.eq(shippingMethod);
    expect(payload.priceWithTax).to.eq(priceWithTax);
    expect(payload.transactionTotal).to.eq(transactionTotal);
  });

  it('it should send CEDDL event to FS.event', () => {
    const observer = new DataLayerObserver({
      rules: [getRule('fs-event-ceddl-event')],
      readOnLoad: true,
    });
    expect(observer).to.not.be.undefined;

    let [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('event'); // NOTE this tests non-compliant data layers that do not defined eventName
    expect(payload.eventAction).to.eq('cart-item-removed');
    expect(payload.primaryCategory).to.eq('cart');

    [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('Cart Item Added');
    expect(payload.eventAction).to.eq('cart-item-added');
    expect(payload.primaryCategory).to.eq('cart');
  });
});

describe('Adobe to FullStory rules', () => {
  beforeEach(() => {
    (globalThis as any).s = basicAppMeasurement;
    (globalThis as any).FS = new FullStory();
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).s;
    delete (globalThis as any).FS;
  });

  it('it should send just Adobe eVars to FS.event', () => {
    const {
      eVar1, eVar10, eVar20, eVar50, eVar60,
    } = basicAppMeasurement;

    const observer = new DataLayerObserver({ rules: [getRule('fs-event-adobe-evars')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [eventName, payload] = expectParams(globalMock.FS, 'event');
    expect(eventName).to.eq('Adobe eVars');
    expect(payload.eVar1).to.eq(eVar1);
    expect(payload.eVar10).to.eq(eVar10);
    expect(payload.eVar20).to.eq(eVar20);
    expect(payload.eVar50).to.eq(eVar50);
    expect(payload.eVar60).to.eq(eVar60);
    expect(payload.prop1).to.be.undefined;
    expect(payload.pageName).to.be.undefined;
  });

  it('it should FS.identify using specific Adobe eVars', () => {
    const { eVar1, eVar10, eVar20 } = basicAppMeasurement;

    const observer = new DataLayerObserver({ rules: [getRule('fs-identify-adobe-evars')], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [uid, payload] = expectParams(globalMock.FS, 'identify');
    expect(uid).to.eq(eVar1);
    expect(payload.eVar10).to.eq(eVar10);
    expect(payload.eVar20).to.eq(eVar20);
    expect(payload.prop1).to.be.undefined;
    expect(payload.pageName).to.be.undefined;
  });
});

describe('Tealium to FullStory rules', () => {
  beforeEach(() => {
    (globalThis as any).utag = { data: deepcopy(tealiumRetail) };
    (globalThis as any).FS = new FullStory();

    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).utag;
    delete (globalThis as any).FS;
  });

  it('should read tealium_event', () => {
    (globalThis as any).utag.data.tealium_event = 'product_view';

    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-tealium-event'),
      ],
    });

    const [id, payload] = expectParams(globalMock.FS, 'event');
    expect(id).to.eq('product_view');
    expect(payload.product_id).to.eql(tealiumRetail.product_id);
    expect(payload.order_total).to.eql(54.47);
    expect(payload.product_discount_amount).to.eql(2.98); // NOTE list reduced to single value
    expect(payload.customer_first_name).to.be.undefined;
    expect(payload.customer_last_name).to.be.undefined;
    expect(payload.customer_email).to.be.undefined;

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should not monitor properties not included in the source', (done) => {
    (globalThis as any).utag.data.tealium_event = 'product_view';

    const observer = ExpectObserver.getInstance().create({
      rules: [
        { ...getRule('fs-tealium-event'), readOnLoad: false },
      ],
    });

    // NOTE this is a valid property to monitor
    (globalThis as any).utag.data.product_id = ['PROD789'];

    // check the assignment
    setTimeout(() => {
      const [id, payload] = expectParams(globalMock.FS, 'event');
      expect(id).to.eq('product_view');
      expect(payload.product_id).to.eql('PROD789');
    }, DataHandler.debounceTime * 1.5);

    // NOTE this is an invalid property to monitor because it is not picked
    (globalThis as any).utag.data.outsideScope = true;

    // check the assignment
    setTimeout(() => {
      expectNoCalls(globalMock.FS, 'event');
      ExpectObserver.getInstance().cleanup(observer);
      done();
    }, DataHandler.debounceTime * 1.5);
  });

  it('should identify user', () => {
    (globalThis as any).utag.data.tealium_event = 'user_registration';

    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-tealium-user-registration'),
      ],
    });

    const [id, payload] = expectParams(globalMock.FS, 'identify');
    expect(id).to.eq(payload.customer_id);
    expect(payload.customer_first_name).to.be.undefined; // NOTE renamed to displayName
    expect(payload.customer_last_name).to.eql(tealiumRetail.customer_last_name);
    expect(payload.customer_city).to.eql(tealiumRetail.customer_city);

    expect(payload.email).to.eql(tealiumRetail.customer_email);
    expect(payload.displayName).to.eql(tealiumRetail.customer_first_name);

    ExpectObserver.getInstance().cleanup(observer);
  });

  it('should setUserVars', () => {
    (globalThis as any).utag.data.tealium_event = 'user_update';

    const observer = ExpectObserver.getInstance().create({
      rules: [
        getRule('fs-tealium-user-update'),
      ],
    });

    const [payload] = expectParams(globalMock.FS, 'setUserVars');
    expect(payload.customer_first_name).to.eql(tealiumRetail.customer_first_name);
    expect(payload.customer_last_name).to.eql(tealiumRetail.customer_last_name);
    expect(payload.customer_city).to.eql(tealiumRetail.customer_city);

    ExpectObserver.getInstance().cleanup(observer);
  });
});
