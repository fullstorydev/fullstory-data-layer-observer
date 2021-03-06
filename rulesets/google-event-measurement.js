window['_dlo_rules_google_measurement'] = [
  {
    "id": "fs-ga-event",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$[?(event!^gtm)]"
      },
      {
        "name": "query",
        "select": "$[?(event!=optimize.domChange)]"
      },
      {
        "name": "query",
        "select": "$[?(ecommerce=undefined)]"
      },
      {
        "name": "insert",
        "select": "event"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-gtg-event",
    "source": "dataLayer",
    "operators": [
      {
        "name": "query",
        "select": "$[(0,1,2)]"
      },
      {
        "name": "query",
        "select": "$[?(0=event)]"
      },
      {
        "name": "flatten"
      },
      {
        "name": "rename",
        "properties": {
          "0": "gtgCommand",
          "1": "gtgAction"
        }
      },
      {
        "name": "query",
        "select": "$[?(gtgCommand!^gtm)]"
      },
      {
        "name": "query",
        "select": "$[?(gtgCommand!=optimize.domChange)]"
      },
      {
        "name": "query",
        "select": "$[?(ecommerce=undefined)]"
      },
      {
        "name": "insert",
        "select": "gtgAction"
      }
    ],
    "destination": "FS.event"
  }
];