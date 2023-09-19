window["_dlo_rules_google_em_ga4"] = [
  {
    "id": "fs-gtg-event",
    "source": "dataLayer",
    "operators": [
      { "name": "query", "select": "$[(0,1,2)]" },
      { "name": "query", "select": "$[?(0=event)]" },
      { "name": "flatten" },
      { "name": "rename", "properties": { "0": "gtgCommand", "1": "gtgAction" } },
      { "name": "query", "select": "$[?(gtgAction!^gtm)]" },
      { "name": "query", "select": "$[?(gtgAction!=optimize.domChange)]" },
      { "name": "query", "select": "$[?(items=undefined)]" },
      { "name": "insert", "select": "gtgAction" }
    ],
    "destination": "FS.event"
  }
];