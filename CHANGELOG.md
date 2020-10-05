# Changelog

Data Layer Observer follows semantic versioning when releasing updates.

| Code status | Stage | Example version |
| ----------- | ----- | --------------- |
| Backward compatible bug fixes | Patch release | 1.0.1 |
| Backward compatible new features | Minor release| 1.1.0 |
| Changes that break backward compatibility | Major release | 2.0.0 |

## History

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
