# Convert Operator

The convert operator can be used to convert values from one type to another.  Values can be converted to and from the following types: `bool`, `date`, `int`, `real`, or `string`.  If the value to be converted is an array, each element in the list will be converted to the desired type.  If the array has only a single value, the property will be set to the single converted value.  For example, `price: ['24.99']` would become `price: 24.99` if the desired conversion is to a `real` value.

Convert is most useful when paired with `FS.event` for cart and checkout events where the data layer property is a string and the value should ideally be numeric.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `force` | `boolean` | `false` | If the property is undefined or has value `null`, forcibly add the property with value `0`, `0.0`,`false` or empty string. |
| `index` | `number` | `0` | Position of the object to convert in the operator input list. |
| `preserveArray` | `boolean` | `false` | If the conversion value is a list, keep the array type even if the array has a single value. |
| `properties`* | `string` or `string[]` | `undefined` | List of properties to convert. |
| `type`* | `string` | `undefined` | The desired type to convert properties to. |

> **Tip:** Set the `properties` option to the string `*` to convert *all* properties in an object to a desired type.

## Usage

## Converting specific cart prices

### Rule

```javascript
{
 source: 'digitalData.cart.price',
 operators: [ { name: 'convert', properties: 'basePrice,taxRate,shipping,priceWithTax,cartTotal', type: 'real' } ],
 destination: 'FS.identify'
}
```

### Input

```javascript
[
 {
  basePrice: '15.55',
  voucherCode: '',
  voucherDiscount: 0,
  currency: 'USD',
  taxRate: '0.09',
  shipping: '5.0',
  shippingMethod: 'UPS-Ground',
  priceWithTax: '16.95',
  cartTotal: '21.95',
 }
]
```

### Output

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

## Converting all cart prices

### Rule

```javascript
{
 source: 'digitalData.cart.price[(basePrice,cartTotal,priceWithTax)]',
 operators: [ { name: 'convert', properties: '*', type: 'real' } ],
 destination: 'FS.identify'
}
```

### Input

```javascript
[
 {
  basePrice: '15.55',
  priceWithTax: '16.95',
  cartTotal: '21.95',
 }
]
```

### Output

```javascript
[
 {
  basePrice: 15.55,
  priceWithTax: 16.95,
  cartTotal: 21.95,
 }
]
```
