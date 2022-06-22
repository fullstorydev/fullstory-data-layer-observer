window['_dlo_rules_adobe_am'] = [
  {
    "id": "fs-event-adobe-evars",
    "source": "s[^(eVar)]",
    "operators": [
      {
        "name": "insert",
        "value": "eVars"
      }
    ],
    "destination": "FS.event"
  },
  {
    "id": "fs-event-adobe-props",
    "source": "s[^(prop)]",
    "operators": [
      {
        "name": "insert",
        "value": "props"
      }
    ],
    "destination": "FS.event"
  }
];