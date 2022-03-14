# Changelog

Data Layer Observer follows semantic versioning when releasing updates.

| Code status | Stage | Example version |
| ----------- | ----- | --------------- |
| Backward compatible bug fixes | Patch release | 1.0.1 |
| Backward compatible new features | Minor release| 1.1.0 |
| Changes that break backward compatibility | Major release | 2.0.0 |

## History

### 1.13.1

- Fixed an initialization bug which prevented configuring a log level of `0`

### 1.13.0

- Added telemetry provider and exporter concepts to measure timings, error counts, and other metrics. Telemetry is currently initialized but otherwise unused

### 1.12.1

- Change made to allow searching for empty strings with ```''``` or ```""```.  Technically any string comparison can be quoted, but this was specifically added for searching for empty string

### 1.12.0

- Rules can no longer be triggered by changes to properties which don't match a rule's selector

### 1.11.0

- Empty objects are no longer passed to rule operators. This prevents empty objects from being sent to configured rule destinations. Empty objects are defined as empty arrays or objects where all first-level child keys have `undefined` values

### 1.10.2

- Fixed `Object doesn't support property or method 'startsWith'` error in IE11

### 1.10.1

- `suffix` operator `maxProps` should not count properties with undefined values
- `suffix` operator explicitly stops processing if provided an undefined or null object to be suffixed

### 1.10.0

- Added rule options `waitUntil` and `maxRetry` related to scheduling rule registration
- Updated default behavior of rule registration: waiting for both a defined data layer object and at least one property defined
- Adjusted rule registration logic to schedule using exponential backoff times

### 1.9.0

- `suffix` operator limits number of properties in an object to `100` (configurable with `maxProps`)

### 1.8.0

- Performance improvement to prevent emitting change events for the same value
- Configurable `debounce` property for rules; allows waiting longer before handling data layer events
- Fix to prevent the `enumerate` option in the convert operator from converting empty strings to `0`

### 1.7.2

- Fix to allow rule-specific `readOnLoad` to override global `readOnLoad`

### 1.7.1

- Additional log messages when adding operators

### 1.7.0

- Updated `beforeDestination` to accept a list allowing multiple operators to execute
- Updated `convert` operator to accept negative `index` (read from end of a data list)

### 1.6.5

- Adjusted suffixing behavior for `pageName`, `displayName`, and `email` to support FS APIs

### 1.6.4

- Move `EmptyEvent` scenario from log level `warn` to `debug`

### 1.6.3

- Fix `flatten` operator bug related to mutating objects in list-based data layers

### 1.6.2

- Fix `console.error` messages related to logging appender

### 1.6.1

- Fix incorrect suffix behavior when using FS.event source parameter
- FullStoryAppender logger source updated to `dlo-log`

### 1.6.0

- `enumerate` option added to `convert` operator
- Tealium sample updated to use `enumerate` option
- Added `order_` property selector to Tealium sample

### 1.5.2

- Check if `push` and `unshift` exist in older browsers

### 1.5.1

- Fix `convert` operator to trim spaces if a space separated CSV is supplied

### 1.5.0

- Added `=` and `!=` `undefined` comparison for object properties

### 1.4.4

- Bug fix in string `!=` comparison

### 1.4.3

- Expose logging level as config option `_dlo_logLevel`

### 1.4.2

- Debouncing added to limit the number of log events for similar error messages

### 1.4.1

- Normalized numbers as `real` by default to prevent ambiguous `int` for numbers like `200.00`

### 1.4.0

- Monitoring properties is limited to only the properties in the object returned from the `source` selector, which may be a subset of all properties
- Added `!^` and `=^` comparison for query operator
- Updated Google rules to better ignore `gtm.*` events
- Added Google rule to support `gtg` `Arguments` object in the `dataLayer`

### 1.3.3

- Log message cleanup

### 1.3.2

- Fix bug related to usage of `globalThis` in older browsers

### 1.3.1

- Fix bug in query selector syntax that prevented parsing rules with `.` in the property or value
- Fix timing related issue with rule registration
- Add clarity around rule registration failure message

### 1.3.0

- Added `defaultValue` option for insert operator

### 1.2.1

- Addressed bug in convert operator where an undefined property is created and set to a value of `0`, `0.0`, or `false` depending on the conversion type

### 1.2.0

- Automatically monitor array `unshift` similar to existing `push` monitoring
- Performance benchmarks added to docs
- Convert operator supports arrays and reduces to a single value for single element arrays

### 1.1.0

- Monitor property changes on data layer objects
- Monitor function calls (e.g. dataLayer.push)
- Two new operators added: Rename and Fan-Out
- Google Analytics examples
- Updated packaging to support NPM and programmatic usage

### 1.0.0

- Initial release supporting static data layers
- CEDDL compatibility with examples
