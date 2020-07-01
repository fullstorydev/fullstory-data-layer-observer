
// Memoized Paths or false if the path cannot be parsed
let parsedPaths: { [path: string]: Path | false } = {};

class PathElement {}

class Path {
  tokens: string[];
  elements: PathElement[];

  constructor(public path: string) {
    throw new Error('TBD');
  }

  select(target: object): any {
    throw new Error('TBD');
  }
}

// Parses and then memoizes a path for future calls
function parsePath(path: string): Path | false {
  if (typeof parsedPaths[path] === 'undefined') {
    try {
      parsedPaths[path] = new Path(path);
    } catch {
      parsedPaths[path] = false;
    }
  }
  return parsedPaths[path];
}

/**

Selection path notations:

- Pluck:  parent.child.grandchild        -> grandchild
- Index:  object[index]                  -> object[index] (a negative index steps back from the end, so -1 is the last item in the array)
- Pick:   object[(property, ...)]        -> object with properties
- Omit:   object[!(property, ...)]       -> [object] with properties removed
- Prefix: object[^(property, ...)]       -> [object] with only properties whose names begin with `property`
- Suffix: object[$(property, ...)]       -> [object] with only properties whose names end with `property`
- Exists: object[?(property, ...)]       -> object or null if object does not have property
- Filter: object[=(property=value, ...)] -> object or null if the object's `property` does not equal `value` 

Notations can be chained:

- parent.child.grandchild[3] -> fourth item in the grandchild array
- parent.child[-1].grandchild[(property)] -> last child's grandchild with only `property` set

@param path - a selection path
@param target - the object from which to select
@return an array of selected
*/
export function select(path: string, target: object): any | undefined {
  const parsedPath: Path | false = parsePath(path);
  if (parsedPath === false) {
    return undefined;
  }
  return parsedPath.select(target);
}

/**
@param path - a selection path
@return true if the `path` can be used as a `path` parameter to `select`
*/
export function validate(path: string): boolean {
  return parsePath(path) !== false;
}
