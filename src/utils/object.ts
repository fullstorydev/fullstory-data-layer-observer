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
