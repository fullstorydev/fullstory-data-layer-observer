# FullStory Data Layer Observer Rulesets

Rulesets provide out of the box rules that are compatible with common data layers and analytics vendors. Where possible, rules follow vendor guidelines and have associated test cases to ensure operation.

## Adobe App Measturement

- [Ruleset](./adobe-app-measurement.js)
- [Vendor Guidelines](https://experienceleague.adobe.com/docs/analytics/implementation/vars/page-vars/page-variables.html?lang=en)
- [Tests](../test/rules-adobe-fullstory.spec.ts)

## Google

### Event Measurement (GA4 / gtag)

- [Ruleset](./google-event-measurement-ga4.js)
- [Vendor Guidelines](https://support.google.com/analytics/answer/9216061?hl=en)
- [Tests](../test/rules-google-event-measurement-ga4-fullstory.spec.ts)

### Event Measurement (Universal Analytics / Google Tag Manager)

- [Ruleset](./google-event-measurement-ua.js)
- [Vendor Guidelines](https://developers.google.com/analytics/devguides/collection/analyticsjs/events)
- [Tests](../test/rules-google-event-measurement-ua-fullstory.spec.ts)

### Enhanced Ecommerce (GA4)

- [Ruleset](./google-enhanced-ecommerce-ga4.js)
- [Vendor Guidelines](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag)
- [Tests](../test/rules-google-enhanced-ecommerce-ga4-fullstory.spec.ts)

### Enhanced Ecommerce (Universal Analytics)

- [Ruleset](./google-enhanced-ecommerce-ua.js)
- [Vendor Guidelines](https://developers.google.com/tag-manager/enhanced-ecommerce)
- [Tests](../test/rules-google-enhanced-ecommerce-ua-fullstory.spec.ts)

## Customer Experience Digital Data Layer 1.0 (CEDDL)

- [Ruleset](./ceddl.js)
- [Vendor Guidelines](https://www.w3.org/2013/12/ceddl-201312.pdf)
- [Tests](../test/rules-ceddl-fullstory.spec.ts)

## Tealium Retail

- [Ruleset](./tealium-retail.js)
- [Vendor Guidelines](https://docs.tealium.com/platforms/getting-started-web/data-layer/definitions/retail/)
- [Tests](../test/rules-tealium-fullstory.spec.ts)
