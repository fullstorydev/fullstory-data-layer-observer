# Fan-Out Operator

The fan-out operator can be used to execute the remaining operator chain on each element in a list.  The fan-out operator supports operating on elements within a traditional array or a list of properties within an object.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index` | `number` | `0` | Position of the object to fan-out in the operator input list. |
| `properties`* | `string` or `string[]` | `undefined` | Desired list of properties to obtain the values and execute the remaining operators. |

## Usage

## Sending multiple events from a list (automatic)

### Rule

```javascript
{
  source: 'dataLayer[0].ecommerce.promoView.promotions',
  operators: [{ name: 'insert', value: 'Viewed Promotion' }],
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

## Sending multiple events from an object's properties

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
    promotions: {
     0: {
      id: '1004-Blueberries123321',
      name: 'Fruits',
      creative: 'Blueberries123321',
      position: 'Feature'
     },
     1: {
      id: '1001-Strawberries222333',
      name: 'Fruits',
      creative: 'Strawberries222333',
      position: 'Sub1'
     },
    }
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
