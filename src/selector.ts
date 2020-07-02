
// Memoized Paths or false if the path cannot be parsed
let parsedPaths: { [path: string]: Path | false } = {};

enum ElementKind {
  Pluck = "pluck",    // color
  Index = "index",    // colors[-2]
  Pick = "pick",      // colors[(favorite, hated)]
  Omit = "omit",      // colors[!(hated)]
  Prefix = "prefix",  // colors[^(fav)]
  Suffix = "suffix",  // colors[$(orite)]
  Filter = "filter"   // colors[?(favorite=red, hated)]
}

const kindSniffers: { [key: string]: any } = {
  Pluck: (raw: string): boolean => { return raw.includes('[') === false && raw.includes('(') === false },
  Index: (raw: string): boolean => { return /.+\[-?\d+\]$/.test(raw) }
}

class PathElement {
  kind: ElementKind;
  parsedInfo: { [key: string]: any }; // per-kind info populated in `parse` call

  // This throws an exception if `raw` can not be parsed
  constructor(public raw: string) {
    this.kind = PathElement.sniffKind(raw);
    this.parsedInfo = {};
    this.parse();
  }

  select(target: any): any | undefined {
    switch (this.kind) {
      case ElementKind.Pluck:
        return this.selectPluck(target);
      case ElementKind.Index:
        return this.selectIndex(target);
      case ElementKind.Pick:
        throw new Error('TBD');
        break;
      case ElementKind.Omit:
        throw new Error('TBD');
        break;
      case ElementKind.Prefix:
        throw new Error('TBD');
        break;
      case ElementKind.Suffix:
        throw new Error('TBD');
        break;
      case ElementKind.Filter:
        throw new Error('TBD');
        break;
    }
  }

  parse() {
    switch (this.kind) {
      case ElementKind.Pluck:
      /* No-op, we just use `raw` */
        break;
      case ElementKind.Index:
        this.parseIndex();
        break;
      case ElementKind.Pick:
        throw new Error('TBD');
        break;
      case ElementKind.Omit:
        throw new Error('TBD');
        break;
      case ElementKind.Prefix:
        throw new Error('TBD');
        break;
      case ElementKind.Suffix:
        throw new Error('TBD');
        break;
      case ElementKind.Filter:
        throw new Error('TBD');
        break;
    }
  }

  parseIndex(){
    throw new Error('TBD');
  }

  selectPluck(target: any): any | undefined {

  }

  selectIndex(target: any): any | undefined {
    throw new Error('TBD');
  }

  static sniffKind(raw: string): ElementKind {
    if (raw.length == 0) throw new Error(`Invalid path element: ${ raw }`);
    for (let kind of Object.keys(kindSniffers)) {
      if (kindSniffers[kind](raw)) return kind as ElementKind;
    }
    throw new Error(`Could not sniff kind of ${ raw }`);
  }
}

class Path {
  tokens: string[];
  elements: PathElement[] = [];

  constructor(public path: string) {
    this.tokens = path.split('.');
    for (let token of this.tokens) {
      this.elements.push(new PathElement(token)) // Will throw an exception if it can't parse
    }
  }

  select(target: object): any | undefined {

    // THIS IS WHERE I STOPPED. Walk the elements and select if possible

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
- Filter: object[?(property, ...)]       -> object or null if object does not have property
- Filter: object[?(property=value, ...)] -> object or null if the object's `property` does not equal `value` 

Notations can be chained:

- parent.child.grandchild[3] -> fourth item in the grandchild array
- parent.child[-1].grandchild[(property)] -> last child's grandchild with only `property` set

@param path - a selection path
@param target - the object from which to select
@return an array of selected
*/
export function select(path: string, target?: object): any | undefined {
  const parsedPath: Path | false = parsePath(path);
  if (parsedPath === false) {
    return undefined;
  }
  return parsedPath.select(target ? target : globalThis);
}

/**
@param path - a selection path
@return true if the `path` can be used as a `path` parameter to `select`
*/
export function validate(path: string): boolean {
  return parsePath(path) !== false;
}
