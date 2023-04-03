# Parse Operator

The `parse` operator can be used to parse a string value contained in a specified `property` into individual part.  It supports multiple delimiter values (`propertyDelimiters`) for nested parsing, and supports a separate `keyValue` delimiter for parsing into key/value properties.  The `output` of the `parse` operator can either be in `key: value` pairs (default value of `keyValue`) or in an `array` that replaces the original specified `property` with the parsed values as elements in the array.  

The `parse` operator is designed to feed into other operators such as [query](https://github.com/fullstorydev/fullstory-data-layer-observer/blob/main/docs/operator_query.md) for selecting individual parsed properties in `keyValue` mode, or [fan-out](https://github.com/fullstorydev/fullstory-data-layer-observer/blob/main/docs/operator_fan-out.md) when in `array` mode.  (See the examples below)
## Options

Options with an asterisk are required. Note that `keyValue` cannot be used without output of `array`.

| Option                | Type                      | Default     | Description                                                                                                                                                                                                   |
|-----------------------|---------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `propertyDelimiters`* | `string[]`                | `undefined` | An array of delimiters used to parse the properties.                                                                                                                                                          | 
| `property`*           | `string`                  | `undefined` | The property to parse.  (Value of property must be a string)                                                                                                                                                  | 
| `keyValueDelimiter`   | `string`                  | `undefined` | If the output type is set to `keyValue`, will be used to parse individual entries into `key: value` pairs.  If an individual property does not have the `keyValueDelimiter` it will be just `<property>: null` |
| `output`              | `keyValue` &#124; `array` | `keyValue`  | Sets the output of the operator.  If `keyValue` then will output parsed elements as `key: value` pairs.  If `array` will replace `property` with an array of `<property>`.  If `keyValue` is specified and a given property is not a valid input for [FullStory injestion](https://help.fullstory.com/hc/en-us/articles/360020623234#property-name-requirements),  it will be sent as if you had specified `array` as the `output`.  (Valid properties will still be in `key: value` format)  | 


## Usage

## Data examples
To simplify understanding, some simple parsing examples will be placed here to show what the output would be of the operator.  Many real world examples would only be interested in one property of the parsed values, and this section will give more details on what is flowing through the operator.  They will start with a `data` value as input to the operator, then show the output the operator would produce.
> **Note:** These Data Examples are not full DLO rules.  They are meant to show the input and output of the parse operator under various circumstances. 

### Simple Parsing
Many uses of the `parse` operator will just want to parse a property based on one delimiter.  That is readily supported
```javascript
data = {
  events: 'event1,event2,event13,purchase',
}

operator = {
    name: 'parse',
    propertyDelimiters: [','],
    property: 'events'
}

// output
{
    event1: null,
    event2: null,
    event13: null,
    purchase: null
}	
```

### Array Output
Demonstrating what the `array` output would produce from a simple parse.  
```javascript
data = {
    events: 'event1,event2,event13,purchase',
}

operator = { 
    name: 'parse',
    propertyDelimiters: [','],
    output: 'array',
    property: 'events'
}

// output
{
    events: [ 'event1', 'event2', 'event13', 'purchase' ]
}
```
### Key/Value Parsing
Demonstrating how key/value parsing works with simply properties getting `null` values.   
```javascript
data = {
    events: 'event1,event2=foo',
}
operator = {
    name: 'parse',
    propertyDelimiters: [','],
    keyValueDelimiter: '=',
    property: 'events',
}

// output
{
    event1: null,
    event2: 'foo'
}
```
### Invalid Property Names
If you use key/value parsing, but have propert(ies) that are not [valid](https://help.fullstory.com/hc/en-us/articles/360020623234#property-name-requirements) they will be placed into an array of the original property name. 
```javascript
data = {
    events: 'event1,12Foo,Hello_1234,_data=some,_foo,event2=foo,3piece=bar',
}
operator = {
    name: 'parse',
    propertyDelimiters: [','],
    keyValueDelimiter: '=',
    property: 'events'
};

// output
{
    event1: null,
    Hello_1234: null,
    event2: 'foo'
    events: [ '12Foo', '_data=some', '_foo', '3piece=bar' ]
}
```

### Advanced Scenario
This example will show an advanced scenario with multiple `propertyDelimiters`, invalid property names, etc. 
```javascript
 data = {
    products: 'Example;1;3.50;event1=4.99|event2=5.99;eVar1=Example value 1|eVar2=Example value 2',
}

operator = {
    name: 'parse',
    propertyDelimiters: [';', '|'],
    keyValueDelimiter: '=',
    property: 'products',
}

// output
{
    Example: null,
    event1: 4.99,
    event2: 5.99,
    eVar1: 'Example value 1',
    eVar2: 'Example value 2',
    events: [ '1', '3.50' ]
}
```
## Full DLO Examples
This section will show some real-world examples of parsing inside full DLC rules.  

### Rule

```json
{
    "id": "simple", 
    "source":"s[(events)]", 
    "operators":
    [{
        "name": "parse",
        "parseDelimiters": "[ ',' ]",
        "keyValueDelimiter": "=",
        "property": "events"
      },
      {
            "name": "query",
            "select": "$[(event13)]"
      },
      {
            "name": "insert",
            "value": "Event Initiated"
      }],
        "destination":  "FS.event"
}    
```

### Input

```javascript
s {
  events: 'event1,event2=foo,event13,purchase',
  products: 'Example product;1;event1=4.99|event2=5.99;eVar1',
}
```

### Output

```json
[
 "Event Initiated",
 {}
]
```


### Rule

```json
{
  "id": "complex",
  "source": "s[(events)]",
  "operators": [{
      "name": "parse",
    "parseDelimiters": "[ ‘,’ ]",
    "keyValueDelimiter": "=",
    "property": "events"
  },
  {
      "name": "query",
      "select": "$[(event2)]"
  },
  {
      "name": "rename",
      "properties": {
        "event2": "amount"
      }
  }, 
  {
      "name": "insert",
      "value": "Purchase"
   }

  ],
  "destination": "FS.event"
}
```

### Input

```javascript
 s {
    events: 'event1,event2=4.99,event13,purchase',
    products: 'Example product;1;event1=4.99|event2=5.99;eVar1'
};
```

### Output

```javascript
[
 "Purchase",
 {
  amount: 4.99
 }
]
```

### Rule

```json
{
  "id": "fan-example",
  "source": "s[(events)]",
  "operators": [{
      "name": "parse",
      "parseDelimiters": "[ ‘,’ ]",
      "property": "events",
      "output": "array"
  },
  {
      "name": "fan-out",
  }],
  "destination": "FS.event"
}
```

### Input

```javascript
 s {
    events: 'event1,event13,purchase'
};
```

### Output

```javascript
[
  "event1",
  {},
  "event13",
  {},
  "purchase",
  {},
    
]
```
