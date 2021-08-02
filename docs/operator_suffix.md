# Suffix Operator

The suffix operator can be used to automatically apply the appropriate type suffix to properties in an object.  Since the suffix operator is useful for every `FS` API, it is included as the default `window['_dlo_beforeDestination']` configuration option and is not needed in the `operators` list.

To support FullStory-specific APIs, the properties `displayName`, `pageName`, and `email` are not suffixed in a root object. Additionally, the number of properties in a suffixed object is limited to `100` by default. This prevents unintentional, large objects from being sent to the destination, which can result in performance issues or exceeding cardinality quotas. Increase the limit using the `maxProps` option.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index` | `number` | `0` | Position of the object to suffix in the operator input list. |
| `maxDepth` | `number` | `10` | Maximum depth to search for properties to be suffixed. |
| `mapProps` | `number` | `100` | Maximum number of properties allowed in a suffixed object. |

## Usage

## Suffixing cart properties

### Rule

```javascript
{
 source: 'digitalData.cart.price',
 operators: [ { name: 'suffix' } ],
 destination: 'FS.event'
}
```

### Input

```javascript
[
 {
  basePrice: 15.55,
  voucherCode: '',
  voucherDiscount: 0,
  currency: 'USD',
  taxRate: 0.09,
  shipping: 5.0,
  shippingMethod: 'UPS-Ground',
  priceWithTax: 16.95,
  cartTotal: 21.95,
 }
]
```

### Output

```javascript
[
 {
  basePrice_real: 15.55,
  voucherCode_str: '',
  voucherDiscount_real: 0,
  currency_str: 'USD',
  taxRate_real: 0.09,
  shipping_real: 5.0,
  shippingMethod_str: 'UPS-Ground',
  priceWithTax_real: 16.95,
  cartTotal_real: 21.95,
 }
]
```
