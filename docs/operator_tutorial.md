# Operator Tutorial

This tutorial will walk through basic usage of a few, key operators.

## Sample Data

A CEDDL user object will be the target object from the data layer.

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

## Your First Operator, Flatten

Assume that the `user` object should be sent to the destination `FS.setUserVars`.  The [setUserVars function](https://developer.fullstory.com/user-variables) accepts a single argument that is an object with name value pairs.

The first step is properly identifying the appropriate object as the source.  This is done using the selector `digitalData.user.profile[0]`.  The selector locates the `profile` list and selects the first element in the list.  The returned object is effectively the “user”.

The following rule performs this task.

```javascript
   {
     id: "fs-uservars-ceddl-user-all",
     description: "send all CEDDL user properties to FS.setUserVars",
     source: "digitalData.user.profile[0]",
     operators: [],
     destination: "FS.setUserVars"
   }
```

As currently written, this rule would send the following object to `FS.setUserVars`.

```javascript
{
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
   }
```

A subtle problem is the [setUserVars function](https://developer.fullstory.com/user-variables) expects a simple object and not one that contains several depths of information. The properties `profileInfo`, `address`, `social`, and `attributes` are examples of properties that contain additional properties at a different depth.  The `FS.setUserVars` argument should be an object with no children and only name value pairs.

To fix this problem, the **flatten** operator is used to copy all properties at any depth into a single object.  This resolves the incompatibility, and the rule appears as the following and produces the next result.

```javascript
   {
     id: "fs-uservars-ceddl-user-all",
     description: "send all CEDDL user properties to FS.setUserVars",
     source: "digitalData.user.profile[0]",
     operators: [ { name: "flatten" } ],
     destination: "FS.setUserVars"
   }
```

```javascript
{
 profileID: 'pr-12333211',
 userName: 'JohnyAppleseed',
 line1: '123 Easy St.',
 line2: '',
 city: 'Athens',
 stateProvince: 'GA',
 postalCode: '30606',
 country: 'USA'
 }
```

Note that all properties now exist at the same level and properties with empty data have been removed.

## Creating Function Arguments with Insert

Now consider this, rather than calling `FS.setUserVars`, you want to call `FS.identify`.  The [identify function](https://developer.fullstory.com/identify) requires not one but two arguments: `identify(uid, object)` where `uid` is a string and the `object` is similar to the one used with `setUserVars`.  To correctly call the function, you need a string value for the first argument and an object for the second.  This use case can be accomplished with the following rule.

```javascript
{
  id: "fs-identify-ceddl-user-all",
  description: "send all CEDDL user properties to FS.identify using the profileID as the FullStory uid",
  source: "digitalData.user.profile[0]",
  operators: [ { name: "flatten" } , { name: "insert", select: "profileID" } ],
  destination: "FS.identify"
}
```

The first profile element still needs to be flattened, and this operator remains first.  An **insert** operator is added next.  Each time you add an operator, data is transformed by the previous operator and is passed to the next operator in the sequence.  **Insert** adds a value to create a list of arguments (parameters) that are sent to functions.  The insert operator is configured using a `select` option set to `profileID`.  The `select` option uses selector syntax to find the value at `profileID` in the flattened object and insert it.  The result is a list.

```javascript
[
 'pr-12333211',
 {
  profileID: 'pr-12333211',
  userName: 'JohnyAppleseed',
  line1: '123 Easy St.',
  line2: '',
  city: 'Athens',
  stateProvince: 'GA',
  postalCode: '30606',
  country: 'USA'
  }
]
```

This list is then passed to `FS.identify` to create a function call that looks like `FS.identify('pr-12333211', <theProfileObject>)`.

Congratulations!  By converting data from the data layer using operators, you've essentially called a FullStory API without writing any JavaScript code.

## More About Insert

The insert operator is used quite frequently.  For example the following creates an `FS.event('View Cart', object)` function call using insert's `value` option.  Rather than referencing a property's value from inside an object, the rule creator can specify the *actual* value - "View Cart" cart in this case.  This approach is helpful when you need to name a [Custom Event](https://developer.fullstory.com/custom-events) to provide more clarity to business users.

```javascript
{
  id: "fs-event-ceddl-cart",
  description: "send CEDDL cart's cartID and price properties to FS.event as a 'View Cart' event",
  source: "digitalData.cart[(cartID,price)]",
  operators: [ { name: "insert", value: "View Cart" } ],
  destination: "FS.event"
}
```

## Converting Values

Continuing with the user profile example, the `postalCode` property is currently a string (text).  Since it would be more helpful for users to search for profiles in the southeastern United States (300000-39999), you'll convert the `postalCode` to an integer using the **convert** operator.  **Convert** is placed between flatten and insert.

```javascript
{
  id: 'fs-identify-ceddl-user-zip',
  description: 'send CEDDL user with numeric zip to FS.identify',
  source: 'digitalData.user.profile[0]',
  operators: [{ name: "flatten" }, { name: "convert", properties: "postalCode", type: "int" }, { name: "insert", select: "profileID" }],
  destination: 'FS.identify',
}
```

This produces a result where only the specified `properties` have been converted to the desired `type`.

```javascript
{
 profileID: 'pr-12333211',
 userName: 'JohnyAppleseed',
 line1: '123 Easy St.',
 line2: '',
 city: 'Athens',
 stateProvince: 'GA',
 postalCode: 30606,
 country: 'USA'
}
```

## Filtering and Choosing Data

Let's do one last set of transformations to reduce the amount of information collected based on a few business requirements.

- Identifying users should only be done on a checkout page since that requires the user to be logged in.
- The business doesn't need to record address information since the `profileID` can be used to look up customer records.
- The business would also prefer to identify users only if they are located in the United States, which is denoted by the `country` property.

To accomplish the above, you'll leverage the **query** operator.  **Query** can be used to pick or omit properties from an object.  The decision to use pick versus omit is that former allows *only* the properties you specify while the latter allows *any* properties but *removes* the properties specified.  If there's a chance a developer could add an unwanted property in the future, you'd leverage pick over omit.  The below rule uses omit.

Filtering is added also using the **query** operator and selector syntax.  While not shown, there are more comparisons that equality (e.g. greater than, not equal, etc).

```javascript
{
       id: 'fs-identify-ceddl-user-no-address',
       description: 'send CEDDL user with numeric zip to FS.identify',
       source: 'digitalData.user.profile[0]',
       operators: [
         { name: "flatten" },
         { name: "query", select: "$[?(country=USA)]" },
         { name: "query", select: "$[!(line1,line2)]" },
         { name: "convert", properties: "postalCode", type: "int" },
         { name: "insert", select: "profileID" }],
       destination: 'FS.identify'
     }
```

The result of this rule is a call to `FS.identify` with only the desired properties under the desired circumstances.

## Next Steps

A full list of the available operators and how to configure them is found in the [Operator Reference](https://github.com/fullstorydev/fullstory-data-layer-observer/tree/main#operator-reference).  Many examples also exist in the rules directory of this repository.
