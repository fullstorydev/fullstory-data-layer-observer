# Convert Operator

The convert operator can be used to convert values from one type to another.  Values can be converted to and from the following types: `bool`, `date`, `int`, `real`, or `string`.  If the value to be converted is an array, each element in the list will be converted to the desired type.  If the array has only a single value, the property will be set to the single converted value.  For example, `price: ['24.99']` would become `price: 24.99` if the desired conversion is to a `real` value.

Convert is most useful when paired with `FS.event` for cart and checkout events where the data layer property is a string and the value should ideally be numeric.

## Options

Options with an asterisk are required. Note that `enumerate` can be used by itself or with `properties`.

| Option           | Type                   | Default     | Description                                                                                                                                                                                                         |
|------------------|------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `enumerate`*     | `boolean`              | `false`     | Automatically converts all string values into their numeric equivalent.                                                                                                                                             |
| `ignore`         | `string` or `string[]` | `undefined` | Can be paired with `enumerate` option to ignore one or more properties when performing the `enumerate`.                                                                                                             |
| `ignoreSuffixed` | `boolean` | `false`      | Can be paired with `enumerate` option to ignore any properties that are suffixed when performing the `enumerate`.  [Suffixes](https://help.fullstory.com/hc/en-us/articles/360020623234#property-name-requirements) |
| `force`         | `boolean` | `false` | If the property is undefined or has value `null`, forcibly add the property with value `0`, `0.0`,`false` or empty string.                                                                                          |
| `index`         | `number` | `0` | Position of the object to convert in the operator input list.                                                                                                                                                       |
| `preserveArray` | `boolean` | `false` | If the conversion value is a list, keep the array type even if the array has a single value.                                                                                                                        |
| `properties`*   | `string` or `string[]` | `undefined` | List of properties to convert.                                                                                                                                                                                      |
| `type`*         | `string` | `undefined` | The desired type to convert properties to.                                                                                                                                                                          |

> **Tip:** Set the `properties` option to the string `*` to convert *all* properties in an object to a desired type.

## Usage

## Converting specific cart prices

### Rule

```javascript
{
 source: 'digitalData.cart.price',
 operators: [
   { name: 'convert', properties: 'basePrice,taxRate,shipping,priceWithTax,cartTotal', type: 'real' },
   { name: 'insert', value: 'Product Viewed' },
 ],
 destination: 'FS.event'
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
 'Product Viewed',
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

## Automatically convert all "numeric" strings

### Rule

```javascript
{
 source: 'digitalData.cart.price[(available,basePrice,cartTotal,priceWithTax)]',
 operators: [
   { name: 'convert', enumerate: true },
   { name: 'insert', value: 'Product Viewed' },
 ],
 destination: 'FS.event'
}
```

### Input

```javascript
[
 {
  available: 'false',
  basePrice: '15.55',
  priceWithTax: '16.95',
  cartTotal: '21.95',
 }
]
```

### Output

```javascript
[
 'Product Viewed',
 {
  available: 'false',
  basePrice: 15.55,
  priceWithTax: 16.95,
  cartTotal: 21.95,
 }
]
```

## Automatically convert all "numeric" strings ignoring a specific property

### Rule

```javascript
{
 source: 'digitalData.cart.price[(userId, available,basePrice,cartTotal,priceWithTax)]',
 operators: [
   { name: 'convert', enumerate: true, ignore: 'userId' },
   { name: 'insert', value: 'Product Viewed' },
 ],
 destination: 'FS.event'
}
```

### Input

```javascript
[
 {
  userId: '300456',
  available: 'false',
  basePrice: '15.55',
  priceWithTax: '16.95',
  cartTotal: '21.95',
 }
]
```

### Output

```javascript
[
 'Product Viewed',
 {
  userId: '300456',
  available: 'false',
  basePrice: 15.55,
  priceWithTax: 16.95,
  cartTotal: 21.95,
 }
]
```
## Automatically convert all "numeric" strings ignoring suffixed property

### Rule

```javascript
{
 source: 'digitalData.cart.price[(userId, available,basePrice,cartTotal,priceWithTax)]',
 operators: [
   { name: 'convert', enumerate: true, ignoreSuffixed: true }, 
   { name: 'rename', properties: { userId: 'userId_str' } },     
   { name: 'insert', value: 'Product Viewed' },
 ],
 destination: 'FS.event'
}
```

### Input

```javascript
[
 {
  userId: '300456',
  available: 'false',
  basePrice: '15.55',
  priceWithTax: '16.95',
  cartTotal: '21.95',
 }
]
```

### Output

```javascript
[
 'Product Viewed',
 {
  userId_str: '300456',
  available: 'false',
  basePrice: 15.55,
  priceWithTax: 16.95,
  cartTotal: 21.95,
 }
]
```
## Convert "numeric" strings with specific property conversions

### Rule

```javascript
{
 source: 'digitalData.cart.price[(basePrice,cartTotal,priceWithTax,available)]',
 operators: [
   { name: 'convert', enumerate: true, properties: 'available', type: 'bool' },
   { name: 'insert', value: 'Product Viewed' },
 ],
 destination: 'FS.event'
}
```

### Input

```javascript
[
 {
  available: 'false',
  basePrice: '15.55',
  priceWithTax: '16.95',
  cartTotal: '21.95',
 }
]
```

### Output

```javascript
[
 'Product Viewed',
 {
   available: false,
  basePrice: 15.55,
  priceWithTax: 16.95,
  cartTotal: 21.95,
 }
]
```
