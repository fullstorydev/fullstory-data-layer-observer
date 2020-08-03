# Query Operator

The query operator executes a selector to return an object.  While a `source` selector can be used to also query an object, there are times when subsequent queries are needed.  One example is when picking or omitting properties must also accompany a filter.

The query operator has one slight difference when compared to a `source` selector: it must begin with `$`.  The `$` denotes the object from the operator input list at a given `index`.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index` | `number` | `0` | Position of the object to query in the operator input list. |
| `select`* | `string` | `undefined` | Selector used to perform the query. |

## Usage

## Picking properties from an element in a list

### Rule

```javascript
{
 source: 'digitalData.user.profile[0]',
 operators: [
  { name: 'query', select: '$[(profileInfo,social)]' },
  { name: 'flatten' }
 ],
 destination: 'FS.setUserVars'
}
```

### Input

```javascript
[{
 profile: [{
  profileInfo: {
   profileID: 'pr-12333211',
   userName: 'JohnyAppleseed',
  },
  address: {
   line1: '123 Easy St.',
   line2: '',
   city: 'Athens',
   stateProvince: 'GA',
   postalCode: '30606',
   country: 'USA',
  },
  social: {
   twitter: 'fsjonapples'
  }
 }]
}]
```

### Output

```javascript
[{
 profileID: 'pr-12333211',
 userName: 'JohnyAppleseed',
 twitter: 'fsjonapples'
}]
```

## Filtering and omitting properties

### Rule

```javascript
{
 source: 'digitalData.user.profile[0].address',
 operators: [
  { name: 'query', select: '$[?(country=USA)]' },
  { name: 'query', select: '$[!(line1,line2)]' }
 ],
 destination: 'FS.setUserVars'
}
```

### Input

```javascript
[{
 profile: [{
  profileInfo: {
   profileID: 'pr-12333211',
   userName: 'JohnyAppleseed',
  },
  address: {
   line1: '123 Easy St.',
   line2: '',
   city: 'Athens',
   stateProvince: 'GA',
   postalCode: '30606',
   country: 'USA',
  },
  social: {
   twitter: 'fsjonapples'
  }
 }]
}]
```

### Output

```javascript
{
 city: 'Athens',
 stateProvince: 'GA',
 postalCode: '30606',
 country: 'USA'
}
```
