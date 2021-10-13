window['_dlo_rules_ceddl'] = [
  {
    "id": "fs-event-ceddl-cart", "source": "digitalData.cart",
    "operators": [
      { "name": "query", "select": "$[!(item)]" },
      { "name": "flatten" },
      { "name": "insert", "value": "cart" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-event-ceddl-page", "source": "digitalData.page",
    "operators": [
      { "name": "flatten" },
      { "name": "query", "select": "$[!(destinationURL,referringURL)]" },
      { "name": "convert","properties": "issueDate,effectiveDate,expiryDate", "type": "date" },
      { "name": "insert", "value": "page" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-event-ceddl-product", "source": "digitalData.product[0]",
    "operators": [
      { "name": "query", "select": "$[!(linkedProduct)]" },
      { "name": "flatten" },
      { "name": "insert", "value": "product" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-event-ceddl-transaction", "source": "digitalData.transaction",
    "operators": [
      { "name": "query", "select": "$[!(profile,item)]" },
      { "name": "flatten" },
      { "name": "insert", "value": "transaction" }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-event-ceddl-event", "source": "digitalData.event",
    "operators": [
      { "name": "flatten" },
      { "name": "insert", "select": "eventName", "defaultValue": "event" }
    ],
    "destination": "FS.event"
  }
];