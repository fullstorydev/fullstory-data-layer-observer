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
