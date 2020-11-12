# Changelog

Data Layer Observer follows semantic versioning when releasing updates.

| Code status | Stage | Example version |
| ----------- | ----- | --------------- |
| Backward compatible bug fixes | Patch release | 1.0.1 |
| Backward compatible new features | Minor release| 1.1.0 |
| Changes that break backward compatibility | Major release | 2.0.0 |

## History

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
