window['_dlo_rules_google_enhanced_ecommerce'] = [
  {
    "id": "fs-ua-pageview",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$[?(pageType, pageName)]"
      },
      {
        "name": "insert",
        "value": "pageview"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-detail-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.detail.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "detail"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-detail-product",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.detail.products[0]"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "detail_product"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-click-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.click.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "click"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-click-product",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.click.products[0]"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "click_product"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-add-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.add.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "add"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-add-product",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.add.products[0]"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "add_product"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-remove-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.remove.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "remove"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-remove-product",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.remove.products[0]"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "remove_product"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-promo_click-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.promoClick.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "promo_click"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-promo_click-promotion",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.promoClick.promotions[0]"
      },
      {
        "name": "insert",
        "value": "promo_click_promotion"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-checkout-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.checkout.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "checkout"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-checkout-product",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.checkout.products"
      },
      {
        "name": "fan-out"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "checkout_product"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-purchase-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.purchase.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "purchase"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-purchase-product",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.purchase.products"
      },
      {
        "name": "fan-out"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "purchase_product"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-refund-action",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.refund.actionField"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "refund"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ua-e-commerce-refund-product",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$.ecommerce.refund.products"
      },
      {
        "name": "fan-out"
      },
      {
        "name": "convert",
        "enumerate": true
      },
      {
        "name": "insert",
        "value": "refund_product"
      }
    ],
    "destination": "FS.event"
  }
];