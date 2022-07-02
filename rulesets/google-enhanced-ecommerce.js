window['_dlo_rules_google_ec'] = [
  {
    "id": "fs-ga-pageview", "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(pageType, pageName)]" },
      { "name": "insert", "value": "pageview" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-detail-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.detail.actionField" },
      { "name": "insert", "value": "detail" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-detail-product",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.detail.products[0]" },
      { "name": "insert", "value": "detail_product" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-click-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.click.actionField" },
      { "name": "insert", "value": "click" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-click-product",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.click.products[0]" },
      { "name": "insert", "value": "click_product" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-add-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.add.actionField" },
      { "name": "insert", "value": "add" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-add-product",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.add.products[0]" },
      { "name": "insert", "value": "add_product" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-remove-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.remove.actionField" },
      { "name": "insert", "value": "remove" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-remove-product",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.remove.products[0]" },
      { "name": "insert", "value": "remove_product" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-promo_click-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.promoClick.actionField" },
      { "name": "insert", "value": "promo_click" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-promo_click-promotion",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.promoClick.promotions[0]" },
      { "name": "insert", "value": "promo_click_promotion" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-checkout-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.checkout.actionField" },
      { "name": "insert", "value": "checkout" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-checkout-product",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.checkout.products" },
      { "name": "fan-out" },
      { "name": "insert", "value": "checkout_product" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-purchase-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.purchase.actionField" },
      { "name": "insert", "value": "purchase" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-purchase-product",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.purchase.products" },
      { "name": "fan-out" },
      { "name": "insert", "value": "purchase_product" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-refund-action",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.refund.actionField" },
      { "name": "insert", "value": "refund" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga-e-commerce-refund-product",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$.ecommerce.refund.products" },
      { "name": "fan-out" },
      { "name": "insert", "value": "refund_product" }
    ],
    "destination": "FS.event"
  }
];