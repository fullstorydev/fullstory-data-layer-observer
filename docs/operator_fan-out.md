# Fan-Out Operator

The fan-out operator can be used to execute the remaining operator chain on each element in a list.  The fan-out operator supports operating on elements within a traditional array or a list of properties within an object.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index` | `number` | `0` | Position of the object with properties in the operator input list. |
| `properties`* | `object` | `undefined` | Dictionary of existing property to renamed property pairs. |

## Usage

## Sending multiple events from a list

### Rule

```javascript
{
  source: 'dataLayer[0].ecommerce.promoView.promotions',
  operators: [{ name: 'fan-out' }, { name: 'insert', value: 'Viewed Promotion' }],
  destination: 'FS.event',
}
```

### Input

```javascript
[{
  event: 'impressions_loaded',
  ecommerce: {
   promoView: {
    promotions: [
     {
      id: '1004-Blueberries123321',
      name: 'Fruits',
      creative: 'Blueberries123321',
      position: 'Feature'
     },
     {
      id: '1001-Strawberries222333',
      name: 'Fruits',
      creative: 'Strawberries222333',
      position: 'Sub1'
     },
    ]
   }
  },
  'gtm.uniqueEventId': 6
}]
```

### Output

```javascript
[
  'Viewed Promotion',
  {
   id: '1004-Blueberries123321',
   name: 'Fruits',
   creative: 'Blueberries123321',
   position: 'Feature'
   }
]
```

```javascript
[
  'Viewed Promotion',
  {
   id: '1001-Strawberries222333',
   name: 'Fruits',
   creative: 'Strawberries222333',
   position: 'Sub1'
   }
]
```
