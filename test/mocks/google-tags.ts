/* eslint-disable import/prefer-default-export */
export const basicGoogleTags = [
  {
    pageType: 'Home',
    pageName: 'Home: Fruit shoppe',
  },
  {
    'gtm.start': 1598892794094,
    event: 'gtm.js',
    'gtm.uniqueEventId': 1,
  },
  {
    userProfile: {
      userId: '101',
      userType: 'member',
      loyaltyProgram: 'early-adopter',
      hashedEmail: '555-12232-2332232-232332',
    },
  },
  {
    ecommerce: {
      impressions: [
        {
          name: 'Heritage Huckleberries',
          id: 'P000525722',
          price: '2.99',
          category: 'homepage product recs',
          variant: '',
          list: 'homepage product recs',
          position: 1,
          dimension3: 4.7,
        },
        {
          name: 'Classic Corn',
          id: 'P000614444',
          price: '4.00',
          category: 'homepage product recs',
          variant: '',
          list: 'homepage product recs',
          position: 2,
          dimension3: 5,
        },
      ],
    },
    'gtm.uniqueEventId': 28,
  },
  {
    event: 'productClick',
    ecommerce: {
      click: {
        actionField: { action: 'click', list: 'Search Results' },
        products: [
          {
            name: 'Heritage Huckleberries',
            id: 'P000525722',
            price: '2.99',
            brand: 'Heritage',
            category: 'homepage product recs',
            variant: '',
            position: 1,
          },
        ],
      },
    },
    eventCallback() {
      console.log('Callback called');
    },
  },
  {
    ecommerce: {
      detail: {
        actionField: { action: 'detail', list: 'Product Gallery' },
        products: [
          {
            name: 'Heritage Huckleberries',
            id: 'P000525722',
            price: '2.99',
            brand: 'Heritage',
            category: 'product gallery',
            variant: '',
          },
        ],
      },
    },
  },
  {
    event: 'addToCart',
    ecommerce: {
      currencyCode: 'USD',
      add: {
        actionField: { action: 'add' },
        products: [
          {
            name: 'Heritage Huckleberries',
            id: 'P000525722',
            price: '2.99',
            brand: 'Heritage',
            category: 'product',
            variant: '',
            quantity: 2,
          },
        ],
      },
    },
  },
  {
    event: 'removeFromCart',
    ecommerce: {
      currencyCode: 'USD',
      remove: {
        actionField: { action: 'remove' },
        products: [
          {
            name: 'Heritage Huckleberries',
            id: 'P000525722',
            price: '2.99',
            brand: 'Heritage',
            category: 'product',
            variant: '',
            quantity: 1,
          },
        ],
      },
    },
  },
  {
    ecommerce: {
      promoView: {
        promotions: [
          {
            id: '1004-Blueberries123321',
            name: 'Fruits',
            creative: 'Blueberries123321',
            position: 'Feature',
          },
          {
            id: '1001-Strawberries222333',
            name: 'Fruits',
            creative: 'Strawberries222333',
            position: 'Sub1',
          },
        ],
      },
    },
    'gtm.uniqueEventId': 6,
  },
  {
    event: 'promotionClick',
    ecommerce: {
      promoClick: {
        actionField: { action: 'promo_click' },
        promotions: [
          {
            id: '1004-Blueberries123321',
            name: 'Fruits',
            creative: 'Blueberries123321',
            position: 'Feature',
          },
        ],
      },
    },
    eventCallback() {
      console.log('Callback called');
    },
    'gtm.uniqueEventId': 6,
  },
  {
    event: 'checkout',
    ecommerce: {
      checkout: {
        actionField: {
          action: 'checkout',
          step: 1,
          option: 'Visa',
        },
        products: [
          {
            name: 'Heritage Huckleberries',
            id: 'P000525722',
            price: '2.99',
            brand: 'Heritage',
            category: 'fruit',
            variant: '',
            quantity: 1,
          },
          {
            name: 'Cosmic Crisp Apple',
            id: '668ebb86-60b5-451e-92d3-044157d27823',
            price: '15.55',
            brand: 'Washington State Apple Farm',
            category: 'fruit',
            variant: '',
            quantity: 1,
          },
        ],
      },
    },
    eventCallback() {
      console.log('Callback called');
    },
  },
  {
    ecommerce: {
      purchase: {
        actionField: {
          action: 'purchase',
          id: 'T12345',
          affiliation: 'Online Store',
          revenue: '35.43',
          tax: '4.90',
          shipping: '5.99',
          coupon: '',
        },
        products: [
          {
            name: 'Heritage Huckleberries',
            id: 'P000525722',
            price: '2.99',
            brand: 'Heritage',
            category: 'fruit',
            variant: '',
            quantity: 1,
            coupon: '',
          },
          {
            name: 'Cosmic Crisp Apple',
            id: '668ebb86-60b5-451e-92d3-044157d27823',
            price: '15.55',
            brand: 'Washington State Apple Farm',
            category: 'fruit',
            variant: '',
            quantity: 1,
          },
        ],
      },
    },
  },
  {
    ecommerce: {
      refund: {
        actionField: {
          action: 'refund',
          id: 'T12345',
        },
        products: [
          {
            id: 'P000525722',
            quantity: 1,
          },
        ],
      },
    },
  },
  {
    event: 'gtm.dom',
    'gtm.uniqueEventId': 12,
  },
  {
    event: 'Social-media Loaded',
    'gtm.uniqueEventId': 27,
  },
  {
    event: 'gtm.load',
    'gtm.uniqueEventId': 42,
  },
  {
    event: 'gtm.click',
    'gtm.element': {},
    'gtm.elementClasses': 'x-icon',
    'gtm.elementId': '',
    'gtm.elementTarget': '',
    'gtm.elementUrl': '',
    'gtm.uniqueEventId': 45,
  },
];
