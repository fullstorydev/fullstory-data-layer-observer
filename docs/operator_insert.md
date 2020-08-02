# Insert Operator

The insert operator inserts a value into the operator input list at a specified position. This operator is most frequently used to build function arguments before a destination.

A value can be inserted in two ways:

- Explicitly providing it using the `value` option.
- Referencing it from an object in the operator input list by using the `select` option.

Insert is most useful when paired with `FS.identify` and `FS.event`.

## Options

| Option | Default | Description |
| ------ | ------- | ----------- |
| index  | `0` | Index of the object from the operator input list to apply `select` on. |
| position | `0` | The position of insertion in the output list, a negative position will insert from the end. |
| select | `undefined` | Value inserted, which is found using selector syntax. |
| value  | `undefined` | Literal value to insert. |

The option `value` or `select` is required and are mutually exclusive.

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
