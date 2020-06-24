/**
 * Mocks a CEDDL compliant data layer.
 * See https://www.w3.org/2013/12/ceddl-201312.pdf
 */

/**
 * The root JavaScript Object (JSO) MUST be window.digitalData.
 * All data properties within this specification MUST fall within the hierarchy of the digitalData object.
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
 * Because of the wide range of methods for categorization, an object literal is provided for categories.
 */
export interface PageCategory {
  primaryCategory: string;
  subCategory1?: string;
  pageType?: string;
}

/**
 * The Page object carries significant details about the page, and the most commonly used data elements are captured by
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
 * The Product object carries details about a particular product with frequently used properties listed below. This is
 * intended for data about products displayed on pages or other content. For products added to a shopping cart or
 * ordered in a transaction, see the Cart and Transaction objects below.
 */
export interface Product {
  productInfo: ProductInfo;
  category: ProductCategory;
  linkedProduct: LinkedProduct[];
  attributes: { [key: string]: any };
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
 * The Cart object carries details about a shopping cart or basket and the products that have been added to it. The Cart
 * object is intended for a purchase that has not yet been completed. See the Transaction object below for completed
 * orders.
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
 * The Transaction object is similar to the Cart object, but represents a completed order. The Transaction object
 * contains analogous sub-objects to the Cart object as well as additional subobjects specific to completed orders.
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
 * The Event object collects information about an interaction event by the user. An event might be a button click,
 * the addition of a portal widget, playing a video, adding a product to the shopping cart, etc. Any action on the page
 * could be captured by an Event object.
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
  timeStamp: Date;
  effect: string;
}

export interface EventCategory {
  primaryCategory: string;
  subCategory1?: string;
  attributes: { [key: string]: any };
}

/**
 * The Component object is intended to capture information about a content component included as part of a page, such
 * as a video. Interactions with the component — such as playing the video — would be an Event, captured by the Event
 * object above.
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
 * 2. Together with Security objects described below, secure access to individual objects within the JSO by categories
 * of tracking technologies.
 */
export interface Privacy {
  accessCategories: AccessCategory[];
}

export interface AccessCategory {
  categoryName: string;
  domains: string[];
}

/*

export const digitalData: CEDDL = {
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
      publisher: 'FullStory'
    },
    category: {
      primaryCategory: 'homepage'
    }
  },
  product: [],
  cart: {
    cartID: 'cart-1234',
    price: 23.04,
    attributes: {},
    item: {}
  },
  transaction: {},
  event: [],
  component: [],
  user: {},
  privacy: {},
  version: '1.0.0'
}
*/