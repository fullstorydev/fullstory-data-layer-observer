# Function Operator

The function operator applies a function on a list of arguments and returns the result.  This operator supports the `destination` feature of a data layer rule; however, it can be used within a list of `operators` to perform more sophisticated transformations.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `func`* | `string` or `function` | `undefined` | Function to apply on the operator input list. |
| `thisArg` | `string` or `object` | `globalThis` | Object or selector used as the `this` context with the function. |

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
     sku: 'cca-1234',
     color: 'red and white',
     size: 'medium',
   },
   category: { primaryCategory: 'fruit' },
   quantity: 1,
  },
  {
   productInfo: {
     productID: 'f98bd034-33c7-4f7f-be55-31bb7f84214b',
     sku: 'cca-5678',
     color: 'green and white',
     size: 'small',
   },
   category: { primaryCategory: 'fruit' },
   quantity: 2,
  }]
 }
]
```

### Output

```javascript
[
 'Products Purchased',
 { productIDs:['668ebb86-60b5-451e-92d3-044157d27823', 'f98bd034-33c7-4f7f-be55-31bb7f84214b'] }
]
```
