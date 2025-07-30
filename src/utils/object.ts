/**
 * Polyfill to support global reference.
 */
export function getGlobal() {
  /* eslint-disable no-restricted-globals */
  if (typeof globalThis !== 'undefined') { return globalThis; }
  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  // @ts-ignore
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
}

/**
 * Traverses an object for a given path of children.
 * @param root the root of the object hierarchy - usually window
 * @param path the properties that identify child nodes
 */
export function traverseObject(root: any, path: string[]): any | undefined {
  if (path.length === 0) {
    return root;
  }
  const child = root[path[0]];
  return child ? traverseObject(child, path.slice(1)) : undefined;
}

export function fromPath(path: string): [object, string] {
  const tokens = path.split('.'); // [dataLayer, page]
  const gThis = getGlobal();
  const target = tokens.length === 1 ? gThis : traverseObject(gThis, tokens.slice(0,
    tokens.length - 1)); // e.g. dataLayer
  const property = tokens.length === 1 ? tokens[0] : tokens[tokens.length - 1]; // e.g. page

  return [target, property];
}

/**
 * Returns true if the searchString sequence is the same as the corresponding target sequence
 * starting at the given target position (defaulting to 0); otherwise returns false.
 * @param target The string to search within.
 * @param searchString The string to search for.
 * @param position The position to start searching witin the target.
 */
export function startsWith(target: string, searchString: string, position?: number): boolean {
  // We provide our own startsWith implementation matching the ES2015 String.prototype.startsWith
  // function behavior since IE11 doesn't support String.prototype.startsWith
  let effectivePosition = 0;

  // 'foo'.startsWith('foo', -100) will return true
  if (position && position > 0) {
    effectivePosition = position;
  }

  return target.indexOf(searchString, effectivePosition) === effectivePosition;
}

/**
* Returns true if the target string ends with the searchString.
* When the position is defined, its calculated from the start of the string not the end,
* truncating the target to the specified position. If the position is greater
* than the length of the target string, it will also return true.
* Otherwise, it returns false.
*
 * @param target The string within which we are searching.
 * @param searchString The string we are looking to match at the end of the target string.
 * @param position Optional. If specified, function will consider the target as if it ends at this position, truncating the target string.
 */
export function endsWith(target: string, searchString: string, position?: number): boolean {
  // Create new variable pos
  let pos: number;
  // Default pos to string's length if not given or NaN
  if (position === undefined || isNaN(position)) {
    pos = target.length;
  } else if (position < 0) {
    // Treat negative position as 0
    pos = 0;
  } else {
    // Ensure pos does not exceed the target string's length
    pos = Math.min(position, target.length);
  }

  return target.slice(Math.max(0, pos - searchString.length), pos) === searchString;
}

/**
 * Deep clones an object.  Will use structuredClone if present, otherwise will fall back to a simple JSON serialize/deserialize
 * The fallback method will prune circular references for the 2nd time an object is seen.
 * @param obj
 */
export function deepClone(obj: any): any {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // Fall back to JSON-based clone with circular reference handling
    }
  }

  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return {}; // Replace circular reference with empty object
      }
      seen.add(value);
    }
    return value;
  }));
}
