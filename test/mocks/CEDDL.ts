/**
 * Mocks a CEDDL compliant data layer.
 * See https://www.w3.org/2013/12/ceddl-201312.pdf
 */

export const ceddlVersion = '1.0';

/**
 * The root JavaScript Object (JSO) MUST be window.digitalData.
 * All data properties within this specification MUST fall within the hierarchy of the digitalData
 * object.
 */
export interface CEDDL {
  pageInstanceID: string;
  page: Page;
  product: Product[];
  cart: Cart;
  transaction: Transaction;
  event: Event[];
  component: Component[];
  user: User;
  privacy: Privacy;
  version: string;
}

/**
 * Because of the wide range of methods for categorization, an object literal is provided for
 * categories.
 */
export interface PageCategory {
  primaryCategory: string;
  subCategory1?: string;
  pageType?: string;
}

/**
 * The Page object carries significant details about the page, and the most commonly used data
 * elements are captured by
 * the specification below.
 */
export interface Page {
  pageInfo: PageInfo;
  category: PageCategory;
  attributes?: { [key: string]: any };
}

/**
 * Describes details about the page.
 */
export interface PageInfo {
  pageID: string;
  pageName: string;
  destinationURL: string;
  referringURL: string;
  sysEnv: string;
  variant: string;
  version: string;
  breadcrumbs: string[];
  author: string;
  issueDate: string | Date;
  effectiveDate: string | Date;
  expiryDate: string | Date;
  language: string;
  industryCodes: string;
  publisher: string;
}

/**
 * The Product object carries details about a particular product with frequently used properties
 * listed below. This is intended for data about products displayed on pages or other content. For
 * products added to a shopping cart or ordered in a transaction, see the Cart and Transaction
 * objects below.
 */
export interface Product {
  productInfo: ProductInfo;
  category: ProductCategory;
  linkedProduct: LinkedProduct[];
  attributes?: { [key: string]: any };
}

export interface ProductInfo {
  productID: string;
  productName: string;
  description: string;
  productURL: string;
  productImage: string;
  productThumbnail: string;
  manufacturer: string;
  sku: string;
  color: string;
  size: string;
}

export interface ProductCategory {
  primaryCategory: string;
  subCategory1?: string;
  productType?: string;
}

export interface LinkedProduct {
  productInfo: ProductInfo
}

/**
 * The Cart object carries details about a shopping cart or basket and the products that have been
 * added to it. The Cart object is intended for a purchase that has not yet been completed. See the
 * Transaction object below for completed orders.
 */
export interface Cart {
  cartID: string;
  price: TotalCartPrice;
  attributes: { [key: string]: any };
  item: ProductItem[];
}

export interface Price {
  basePrice: number;
  voucherCode: string;
  voucherDiscount: number;
  currency: string; // ISO 4217 is RECOMMENDED
  taxRate: number;
  shipping: number;
  shippingMethod: string;
  priceWithTax: number;
}

export interface TotalCartPrice extends Price {
  cartTotal: number;
}

export interface ProductItem {
  productInfo: ProductInfo;
  category: ProductCategory;
  quantity: number;
  price: Price;
  linkedProduct: LinkedProduct[];
  attributes: { [key: string]: any };
}

/**
 * The Transaction object is similar to the Cart object, but represents a completed order. The
 * Transaction object contains analogous sub-objects to the Cart object as well as additional
 * subobjects specific to completed orders.
 */
export interface Transaction {
  transactionID: string;
  profile: TransactionProfile;
  total: TotalTransactionPrice;
  attributes: { [key: string]: any };
  item: ProductItem[];
}

export interface TransactionProfile {
  profileInfo: ProfileInfo;
  address: Address;
  shippingAddress: Address;
}

export interface TotalTransactionPrice extends Price {
  transactionTotal: number;
}

/**
 * The Event object collects information about an interaction event by the user. An event might be a
 * button click, the addition of a portal widget, playing a video, adding a product to the shopping
 * cart, etc. Any action on the page could be captured by an Event object.
 */
export interface Event {
  eventInfo: EventInfo;
  category: EventCategory;
}

export interface EventInfo {
  eventName: string;
  eventAction: string;
  eventPoints: number;
  type: string;
  timeStamp: string | Date;
  effect: string;
}

export interface EventCategory {
  primaryCategory: string;
  subCategory1?: string;
  attributes: { [key: string]: any };
}

/**
 * The Component object is intended to capture information about a content component included as
 * part of a page, such as a video. Interactions with the component — such as playing the
 * video — would be an Event, captured by the Event object above.
 */
export interface Component {
  componentInfo: ComponentInfo;
  category: ComponentCategory;
}

export interface ComponentInfo {
  componentID: string;
  componentName?: string;
  description?: string;
}

export interface ComponentCategory {
  primaryCategory: string;
  subCategory1?: string;
  componentType: string;
  attributes: { [key: string]: any };
}

/**
 * The User object captures the profile of a user who is interacting with the website.
 */
export interface User {
  segment: UserSegment;
  profile: UserProfile[];
}

export interface UserSegment {}

export interface UserProfile {
  profileInfo: ProfileInfo;
  address: Address;
  social: UserSocial;
  attributes: { [key: string]: any };
}

export interface ProfileInfo {
  profileID: string;
  userName: string;
  email?: string;
  language?: string;
  returningStatus?: string;
  type?: string;
}

export interface Address {
  line1: string;
  line2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

export interface UserSocial {}

/**
 * The Privacy object holds the privacy policy settings that could be used to:
 * 1. Capture and enforce site visitor consent to use tracking technologies on the site.
 * 2. Together with Security objects described below, secure access to individual objects within the
 * JSO by categories of tracking technologies.
 */
export interface Privacy {
  accessCategories: AccessCategory[];
}

export interface AccessCategory {
  categoryName: string;
  domains: string[];
}

export const emptyDigitalData = {
  pageInstanceID: '',
  page: {
    pageInfo: {
      pageID: '',
      pageName: '',
      destinationURL: '',
      referringURL: '',
      sysEnv: '',
      variant: '',
      version: '',
      breadcrumbs: [],
      author: '',
      issueDate: '',
      effectiveDate: '',
      expiryDate: '',
      language: '',
      industryCodes: '',
      publisher: '',
    },
    category: {
      primaryCategory: '',
    },
    attributes: {},
  },
  product: [],
  cart: {
    cartID: '',
    price: {
      basePrice: 0,
      voucherCode: '',
      voucherDiscount: 0,
      currency: '',
      taxRate: 0.0,
      shipping: 0,
      shippingMethod: '',
      priceWithTax: 0,
      cartTotal: 0,
    },
    item: [],
    attributes: {},
  },
  transaction: {
    transactionID: '',
    profile: {
      profileInfo: {
        profileID: '',
        userName: '',
      },
      address: {
        line1: '',
        line2: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        country: '',
      },
      shippingAddress: {
        line1: '',
        line2: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        country: '',
      },
    },
    total: {
      basePrice: 0,
      voucherCode: '',
      voucherDiscount: 0,
      currency: '',
      taxRate: 0,
      shipping: 0,
      shippingMethod: '',
      priceWithTax: 0,
      transactionTotal: 0,
    },
    attributes: {},
    item: [],
  },
  event: [],
  component: [],
  user: {
    segment: {},
    profile: [],
  },
  privacy: {
    accessCategories: [],
  },
  version: ceddlVersion,
};

export const basicDigitalData: CEDDL = {
  pageInstanceID: '755ebb86-60b5-451e-92d3-044157d29965',
  page: {
    pageInfo: {
      pageID: '1745',
      pageName: 'The Fruit Shoppe',
      destinationURL: 'https://fruitshoppe.firebaseapp.com/',
      referringURL: 'https://www.google.com/url?&q=The%20Fruit%20Shoppe',
      sysEnv: 'desktop',
      variant: '2',
      version: '1.14',
      breadcrumbs: ['home', 'Products'],
      author: 'D Falco',
      issueDate: '2020-06-23',
      effectiveDate: '2020-07-23',
      expiryDate: '2021-06-23',
      language: 'en-US',
      industryCodes: '7372',
      publisher: 'FullStory',
    },
    category: {
      primaryCategory: 'homepage',
    },
    attributes: {},
  },
  product: [{
    productInfo: {
      productID: '668ebb86-60b5-451e-92d3-044157d27823',
      productName: 'Cosmic Crisp Apple',
      description: 'A crisp and cosmic apple',
      productURL: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823',
      productImage: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/image',
      productThumbnail: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/thumbnail',
      manufacturer: 'Washington State Apple Farm',
      sku: 'cca-1234',
      color: 'red and white',
      size: 'medium',
    },
    category: {
      primaryCategory: 'fruit',
    },
    linkedProduct: [],
    attributes: {},
  }],
  cart: {
    cartID: 'cart-1234',
    price: {
      basePrice: 15.55,
      voucherCode: '',
      voucherDiscount: 0,
      currency: 'USD',
      taxRate: 0.09,
      shipping: 5.0,
      shippingMethod: 'UPS-Ground',
      priceWithTax: 16.95,
      cartTotal: 21.95,
    },
    item: [{
      productInfo: {
        productID: '668ebb86-60b5-451e-92d3-044157d27823',
        productName: 'Cosmic Crisp Apple',
        description: 'A crisp and cosmic apple',
        productURL: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823',
        productImage: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/image',
        productThumbnail: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/thumbnail',
        manufacturer: 'Washington State Apple Farm',
        sku: 'cca-1234',
        color: 'red and white',
        size: 'medium',
      },
      category: { primaryCategory: 'fruit' },
      price: {
        basePrice: 15.55,
        voucherCode: '',
        voucherDiscount: 0,
        currency: 'USD',
        taxRate: 0.09,
        shipping: 5.0,
        shippingMethod: 'UPS-Ground',
        priceWithTax: 16.95,
      },
      quantity: 1,
      linkedProduct: [],
      attributes: {},
    }],
    attributes: {},
  },
  transaction: {
    transactionID: 'tr-235098236',
    profile: {
      profileInfo: {
        profileID: 'pr-12333211',
        userName: 'JohnyAppleseed',
      },
      address: {
        line1: '123 Easy St.',
        line2: '',
        city: 'Athens',
        stateProvince: 'GA',
        postalCode: '30606',
        country: 'USA',
      },
      shippingAddress: {
        line1: '123 Easy St.',
        line2: '',
        city: 'Athens',
        stateProvince: 'GA',
        postalCode: '30606',
        country: 'USA',
      },
    },
    total: {
      basePrice: 15.55,
      voucherCode: '',
      voucherDiscount: 0,
      currency: 'USD',
      taxRate: 0.09,
      shipping: 5.0,
      shippingMethod: 'UPS-Ground',
      priceWithTax: 16.95,
      transactionTotal: 16.95,
    },
    attributes: {},
    item: [{
      productInfo: {
        productID: '668ebb86-60b5-451e-92d3-044157d27823',
        productName: 'Cosmic Crisp Apple',
        description: 'A crisp and cosmic apple',
        productURL: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823',
        productImage: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/image',
        productThumbnail: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/thumbnail',
        manufacturer: 'Washington State Apple Farm',
        sku: 'cca-1234',
        color: 'red and white',
        size: 'medium',
      },
      category: { primaryCategory: 'fruit' },
      price: {
        basePrice: 15.55,
        voucherCode: '',
        voucherDiscount: 0,
        currency: 'USD',
        taxRate: 0.09,
        shipping: 5.0,
        shippingMethod: 'UPS-Ground',
        priceWithTax: 16.95,
      },
      quantity: 1,
      linkedProduct: [],
      attributes: {},
    }],
  },
  event: [{
    eventInfo: {
      eventName: 'Cart Item Added',
      eventAction: 'cart-item-added',
      eventPoints: 11,
      type: 'cart-modifier',
      timeStamp: new Date(),
      effect: 'cart has a new item',
    },
    category: {
      primaryCategory: 'cart',
      attributes: {},
    },
  },
  {
    // @ts-ignore NOTE this has no eventName to test non-compliant implementations
    eventInfo: {
      eventAction: 'cart-item-removed',
      eventPoints: 11,
      type: 'cart-modifier',
      timeStamp: new Date(),
      effect: 'cart has removed an item',
    },
    category: {
      primaryCategory: 'cart',
      attributes: {},
    },
  }],
  component: [{
    componentInfo: {
      componentID: 'c-54123',
      componentName: 'Cosmic Crisp Promo Video',
      description: 'A video showing you just how cosmic and just how crisp is this apple.',
    },
    category: {
      primaryCategory: 'promo-video',
      componentType: 'video',
      attributes: {},
    },
  }],
  user: {
    segment: {},
    profile: [{
      profileInfo: {
        profileID: 'pr-12333211',
        userName: 'JohnyAppleseed',
      },
      address: {
        line1: '123 Easy St.',
        line2: '',
        city: 'Athens',
        stateProvince: 'GA',
        postalCode: '30606',
        country: 'USA',
      },
      social: {},
      attributes: {},
    }],
  },
  privacy: {
    accessCategories: [{
      categoryName: 'analytics',
      domains: ['fruitshoppe.firebaseapp.com'],
    }],
  },
  version: ceddlVersion,
};
