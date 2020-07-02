
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
  pluck: (raw: string): boolean =>  { return raw.includes('[') === false && raw.includes('(') === false },
  index: (raw: string): boolean =>  { return /.+\[-?\d+\]$/.test(raw) },
  pick: (raw: string): boolean =>   { return /.+\[\(.*\)\]$/.test(raw) },
  omit: (raw: string): boolean =>   { return /.+\[\!\(.*\)\]$/.test(raw) },
  prefix: (raw: string): boolean => { return /.+\[\^\(.*\)\]$/.test(raw) },
  suffix: (raw: string): boolean => { return /.+\[\$\(.*\)\]$/.test(raw) },
  filter: (raw: string): boolean => { return /.+\[\?\(.*\)\]$/.test(raw) },
}

enum OpKind {
  Pick = "",
  Omit = "!",
  Prefix = "^",
  Suffix = "$",
  Filter = "?",
  Index = "index"
}

/**
OpProp is a property name and optional value like `foo=bar` or 'blatz'
For now we assume equality ('=') but in the future we could add prop ops types like `<=`
*/
class OpProp {
  name: string;
  value?: string;

  constructor(public raw: string) {
    raw = raw.trim();
    const tokens = raw.split('=');
    if (tokens.length > 2) throw new Error('Invalid OpProp: ' + raw);
    if (raw.includes('=')) {
      let keyValTokens = raw.split('=');
      if (keyValTokens.length != 2) throw new Error('Invalid OpProp: ' + raw);
      this.name = keyValTokens[0];
      this.value = keyValTokens[1];
    } else {
      this.name = raw;
    }
  }
}

/**
Op is an operator inside brackets with a list of properies
For example: `!(foo=bar, blatz)` where `!` is the kind and `foo=bar` and `blatz` are parsed into OpProps
*/
class Op {
  kind: OpKind;
  index?: Number;
  props: OpProp[] = [];

  constructor(public raw: string) {
    raw = raw.trim();
    switch(raw[0]) {
      case '(':
        if (raw[raw.length - 1] !== ')') throw new Error('Could not parse Op: ' + raw);
        this.kind = OpKind.Pick;
        this.parseProps(raw.substring(1, raw.length - 1));
        break;
      case '!':
        if (raw[1] !== '(') throw new Error('Could not parse Op: ' + raw);
        if (raw[raw.length - 1] !== ')') throw new Error('Could not parse Op: ' + raw);
        this.kind = OpKind.Omit;
        this.parseProps(raw.substring(2, raw.length - 1));
        break;
      case '^':
        if (raw[1] !== '(') throw new Error('Could not parse Op: ' + raw);
        if (raw[raw.length - 1] !== ')') throw new Error('Could not parse Op: ' + raw);
        this.kind = OpKind.Prefix;
        this.parseProps(raw.substring(2, raw.length - 1));
        break;
      case '$':
        if (raw[1] !== '(') throw new Error('Could not parse Op: ' + raw);
        if (raw[raw.length - 1] !== ')') throw new Error('Could not parse Op: ' + raw);
        this.kind = OpKind.Suffix;
        this.parseProps(raw.substring(2, raw.length - 1));
        break;
      case '?':
        if (raw[1] !== '(') throw new Error('Could not parse Op: ' + raw);
        if (raw[raw.length - 1] !== ')') throw new Error('Could not parse Op: ' + raw);
        this.kind = OpKind.Filter;
        this.parseProps(raw.substring(2, raw.length - 1));
        break;
      default:
        const index = Number.parseInt(raw);
        if (Number.isNaN(index)) throw new Error('Could not parse the Op: ' + raw);
        this.kind = OpKind.Index;
        this.index = index;
    }
  }

  parseProps(rawProps: string) {
    rawProps = rawProps.trim();
    if (rawProps.length === 0) throw new Error('Could not parse operation properties: ' + rawProps);
    const tokens = rawProps.split(',');
    for (let token of tokens) {
      this.props.push(new OpProp(token));
    }
  }
}

/**
Brackets holds parsed info for selections like `foo[(prop1=23, prop2)]`
*/
class Brackets {
  op: Op; // the operation from `foo[!(operation)]`
  prop: string; // `foo` from `foo[...]`
  constructor(public raw: string) {
    raw = raw.trim();
    if (raw.includes('[') === false) throw new Error('Could not parse brackets: ' + raw);
    if (raw.endsWith(']') === false) throw new Error('Could not parse brackets: ' + raw);
    let tokens = raw.split('[');
    if (tokens.length != 2) throw new Error('Could not parse brackets: ' + raw);
    this.prop = tokens[0];
    this.op = new Op(tokens[1].substring(0, tokens[1].length - 1));
  }
}

class PathElement {
  kind: ElementKind;
  brackets?: Brackets;
  parsedInfo: { [key: string]: any }; // per-kind info populated in `parse` calls

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
        return this.selectPick(target);
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
       default:
         throw new Error('Unknown PathElement.kind: ' + this.kind);
    }
  }

  parse() {
    switch (this.kind) {
      case ElementKind.Pluck:
      /* No-op, we just use `raw` */
        break;
      case ElementKind.Index:
      case ElementKind.Pick:
      case ElementKind.Omit:
      case ElementKind.Prefix:
      case ElementKind.Suffix:
      case ElementKind.Filter:
        this.brackets = new Brackets(this.raw);
        break;
       default:
         throw new Error('Invalid PathElement kind: ' + this.kind);
    }
  }

  selectPluck(target: any): any | undefined {
    return target[this.raw]
  }

  selectIndex(target: any): any | undefined {
    throw new Error('TBD');
  }

  selectPick(target: any): any | undefined {
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

export class Path {
  tokens: string[];
  elements: PathElement[] = [];

  constructor(public path: string) {
    path = path.trim();
    this.tokens = path.split('.');
    for (let token of this.tokens) {
      this.elements.push(new PathElement(token)) // Will throw an exception if it can't parse
    }
  }

  select(target: object): any | undefined {
    let selection = target;
    for (let element of this.elements) {
      selection = element.select(selection);
      if (typeof selection === 'undefined') return undefined
    }
    return selection
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
