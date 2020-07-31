# Flatten Operator

The flatten operator recursively copies all properties up to a desired depth into an object with a single depth.  Properties with empty objects as values will be removed from the flattened object.

Flatten is most useful when paired with `FS.setUserVars` but can be used to simplify an object's structure prior to using `FS.event`.

## Options

| Option | Default | Description |
| ------ | ------- | ----------- |
| index  | `0` | Position of the object to flatten in the operator input list. |
| maxDepth | `10` | Maximum depth to search for properties to be flattened. |

Options with an asterisk are required.

## Usage

### Input

```javascript
user: {
 segment: {},
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
   social: {},
   attributes: {},
  }],
}
```

### Output

```javascript
user: {
 profileID: 'pr-12333211',
 userName: 'JohnyAppleseed',
 line1: '123 Easy St.',
 line2: '',
 city: 'Athens',
 stateProvince: 'GA',
 postalCode: '30606',
 country: 'USA',
}
```
