# Suffix Operator

The suffix operator can be used to automatically apply the appropriate type suffix to properties in an object.  Since the suffix operator is useful for every `FS` API, it is included as the default `window['_dlo_beforeDestination']` configuration option and is not needed in the `operators` list.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index` | `number` | `0` | Position of the object to suffix in the operator input list. |
| `maxDepth` | `number` | `10` | Maximum depth to search for properties to be suffixed. |
| `preferReal` | `boolean` | `true` | When false whole numbers like `200.00` will be suffixed `int` and not `real`. |

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
