# Flatten Operator

The flatten operator recursively copies all properties up to a desired depth into an object with a single depth.  Properties with empty objects as values will be removed from the flattened object.

Flatten is most useful when paired with `FS.setUserVars` and `FS.identify` but can be used to simplify an object's structure prior to using `FS.event`.

> **Tip:**  Property names may overlap between parent and child objects. Flatten will overwrite any same-named properties with the value from the last property seen.  To prevent overwriting data, consider creating multiple rules to select individual objects or picking specific, unique properties.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index`  | `number` | `0` | Position of the object to flatten in the operator input list. |
| `maxDepth` | `number` | `10` | Maximum depth to search for properties to be flattened. |

## Usage

## Flatten user properties

### Rule

```javascript
{
 source: "digitalData.user.profile[0]",
 operators: [ { name: "flatten" } ],
 destination: "FS.setUserVars"
}
```

### Input

```javascript
[{
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
}]
```

### Output

```javascript
[{
 profileID: 'pr-12333211',
 userName: 'JohnyAppleseed',
 line1: '123 Easy St.',
 line2: '',
 city: 'Athens',
 stateProvince: 'GA',
 postalCode: '30606',
 country: 'USA',
}]
```
