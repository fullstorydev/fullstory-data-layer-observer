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
  const target = tokens.length === 1 ? globalThis : traverseObject(globalThis, tokens.slice(0,
    tokens.length - 1)); // e.g. dataLayer
  const property = tokens.length === 1 ? tokens[0] : tokens[tokens.length - 1]; // e.g. page

  return [target, property];
}
