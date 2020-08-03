# Insert Operator

The insert operator inserts a value into the operator input list at a specified position. This operator is most frequently used to build function arguments before a destination.

A value can be inserted in two ways:

- Explicitly providing it using the `value` option.
- Referencing it from an object in the operator input list by using the `select` option.

Insert is most useful when paired with `FS.identify` and `FS.event`.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index`  | `number` | `0` | Index of the object from the operator input list to apply `select` on. |
| `position` | `number` | `0` | Where to insert in the output list, negative position will insert from the end. |
| `select`* | `string` |  `undefined` | Value inserted, which is found using selector syntax. |
| `value`*  | `any` | `undefined` | Literal value to insert. |

The options `value` and `select` are required but are mutually exclusive.

## Usage

## Identifying a user

### Rule

```javascript
{
 source: 'digitalData.user.profile[0].profileInfo',
 operators: [ { name: 'insert', select: 'profileID' } ],
 destination: 'FS.identify'
}
```

### Input

```javascript
[
 {
  profileID: 'pr-12333211',
  userName: 'JohnyAppleseed'
 }
]
```

### Output

```javascript
[
 'pr-12333211',
 {
  profileID: 'pr-12333211',
  userName: 'JohnyAppleseed'
 }
]
```

## Order completed event

### Rule

```javascript
{
 source: 'digitalData.transaction.total',
 operators: [ { name: 'insert', value: 'Order Completed' } ],
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
  transactionTotal: 16.95
 }
]
```

### Output

```javascript
[
 'Order Completed',
 {
  basePrice: 15.55,
  voucherCode: '',
  voucherDiscount: 0,
  currency: 'USD',
  taxRate: 0.09,
  shipping: 5.0,
  shippingMethod: 'UPS-Ground',
  priceWithTax: 16.95,
  transactionTotal: 16.95
 }
]
```
