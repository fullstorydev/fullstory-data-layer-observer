# Function Operator

The function operator applies a function on a list of arguments and returns the result.  This operator supports the `destination` feature of a data layer rule; however, it can be used within a list of `operators` to perform more sophisticated transformations.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `func`* | `string | function` | `undefined` | Function to apply on the operator input list. |
| `thisArg` | `string | object` | `globalThis` | Object or selector used as the `this` context with the function. |

If a selector is used with `func` or `thisArg`, the selector will be evaluated to find the function or object.

## Usage

## Converting a list of objects to a list of strings

### Rule

```javascript
{
 source: 'digitalData.cart[(item)]',
 operators: [
   {
    name: 'function', func: (list) => {
     return list.item.reduce((o, item) => {
      o.productIDs.push(item.productInfo.productID);
      return o;
     }, { productIDs: [] });
    }
   },
   { name: 'insert', 'Products Purchased'}
 ],
 destination: 'FS.event'
}
```

### Input

```javascript
[
 {
  item: [{
   productInfo: {
     productID: '668ebb86-60b5-451e-92d3-044157d27823',
     productName: 'Cosmic Crisp Apple',
     description: 'A crisp and cosmic apple',
     productURL: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823',
     productImage: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/image',
     productThumbnail: 'https://fruitshoppe.firebaseapp.com/product/668ebb86-60b5-451e-92d3-044157d27823/thumbnail',
     manufacturer: 'Washington State Apple Farm',
     sku: 'cca-1234',
     color: 'red and white',
     size: 'medium',
   },
   category: { primaryCategory: 'fruit' },
   price: {
     basePrice: 15.55,
     voucherCode: '',
     voucherDiscount: 0,
     currency: 'USD',
     taxRate: 0.09,
     shipping: 5.0,
     shippingMethod: 'UPS-Ground',
     priceWithTax: 16.95,
   },
   quantity: 1,
   linkedProduct: [],
   attributes: {},
  }]
 }
]
```

### Output

```javascript
[
 'Products Purchased',
 { productIDs:['668ebb86-60b5-451e-92d3-044157d27823'] }
]
```
