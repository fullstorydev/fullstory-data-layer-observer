window['_dlo_rules_google_ec_ga4'] = [
  {
    "id": "fs-ga4-e-commerce-select_item",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(event=select_item)]" },
      { "name": "query", "select": "$.ecommerce.items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "select_item" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga4-e-commerce-view_item",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(event=view_item)]" },
      { "name": "query", "select": "$.ecommerce.items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "view_item" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga4-e-commerce-add_to_cart",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(event=add_to_cart)]" },
      { "name": "query", "select": "$.ecommerce.items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "add_to_cart" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga4-e-commerce-remove_from_cart",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(event=remove_from_cart)]" },
      { "name": "query", "select": "$.ecommerce.items[0]" },
      { "name": "convert", "enumerate": true },
      {
        "name": "insert", "value": "remove_from_cart"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga4-e-commerce-view_promotion",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(event=view_promotion)]" },
      { "name": "query", "select": "$.ecommerce.items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "view_promotion" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga4-e-commerce-select_promotion",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(event=select_promotion)]" },
      { "name": "query", "select": "$.ecommerce.items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "select_promotion" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-ga4-e-commerce-purchase",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[?(event=purchase)]" },
      { "name": "query", "select": "$.ecommerce" },
      { "name": "rename", "properties": { "items": "products" } },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "Order Completed" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg4-e-commerce-select_item",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(1=select_item)]" },
      { "name": "query", "select": "$[2].items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "select_item" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg4-e-commerce-view_item",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(1=view_item)]" },
      { "name": "query", "select": "$[2].items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "view_item" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg4-e-commerce-add_to_cart",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(1=add_to_cart)]" },
      { "name": "query", "select": "$[2].items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "add_to_cart" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg4-e-commerce-remove_from_cart",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(1=remove_from_cart)]" },
      { "name": "query", "select": "$[2].items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "remove_from_cart" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg4-e-commerce-view_promotion",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(1=view_promotion)]" },
      { "name": "query", "select": "$[2].items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "view_promotion" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg4-e-commerce-select_promotion",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(1=select_promotion)]" },
      { "name": "query", "select": "$[2].items[0]" },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "select_promotion" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg4-e-commerce-purchase",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(1=purchase)]" },
      { "name": "query", "select": "$[2]" },
      { "name": "rename", "properties": { "items": "products" } },
      { "name": "convert", "enumerate": true },
      { "name": "insert", "value": "Order Completed" }
    ],
    "destination": "FS.event"
  }
];