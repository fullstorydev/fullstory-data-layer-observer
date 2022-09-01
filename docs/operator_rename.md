# Rename Operator

The rename operator can be used to rename properties.  Values will remain unchanged.

Rename is most useful when paired with `FS.identify`, which has specific naming conventions.  For example, you can rename an existing property `emailAddress` to the required property `email`.

## Options

Options with an asterisk are required.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `index` | `number` | `0` | Position of the object with properties in the operator input list. |
| `properties`* | `object` | `undefined` | Dictionary of existing property to renamed property pairs. |

## Usage

## Renaming userName to displayName

### Rule

```javascript
{
 source: 'digitalData.user.profile[0]',
 operators: [ { name: 'rename', properties: {userName: 'displayName'} } ],
 destination: 'FS.identify'
}
```

### Input

```javascript
[{
 profile: [{
  profileInfo: {
   profileID: 'pr-12333211',
   userName: 'JohnyAppleseed',
  }
 }]
}]
```

### Output

```javascript
[{
  profileID: 'pr-12333211',
  displayName: 'JohnyAppleseed',
  }
]
```
