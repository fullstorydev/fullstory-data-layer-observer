/* eslint-disable max-classes-per-file */
/* eslint prefer-destructuring: ["error", {AssignmentExpression: {array: false}}] */

// Memoized Paths or false if the path cannot be parsed
const parsedPaths: { [path: string]: Path | false } = {};

enum ElementKind {
  Pluck = 'pluck', // color
  Index = 'index', // colors[-2]
  Pick = 'pick', // colors[(favorite, hated, ...)]
  Omit = 'omit', // colors[!(hated, loved, ...)]
  Prefix = 'prefix', // colors[^(fav, lov, ...)]
  Suffix = 'suffix', // colors[$(orite, ove, ...)]
  Filter = 'filter' // colors[?(favorite=red, hated, ...)]
}

const kindSniffers: { [key: string]: any } = {
  pluck: (raw: string): boolean => raw.includes('[') === false && raw.includes('(') === false,
  index: (raw: string): boolean => /.+\[-?\d+\]$/.test(raw),
  pick: (raw: string): boolean => /.+\[\(.*\)\]$/.test(raw),
  omit: (raw: string): boolean => /.+\[!\(.*\)\]$/.test(raw),
  prefix: (raw: string): boolean => /.+\[\^\(.*\)\]$/.test(raw),
  suffix: (raw: string): boolean => /.+\[\$\(.*\)\]$/.test(raw),
  filter: (raw: string): boolean => /.+\[\?\(.*\)\]$/.test(raw),
};

enum OpKind {
  Pick = '',
  Omit = '!',
  Prefix = '^',
  Suffix = '$',
  Filter = '?',
  Index = 'index'
}

/**
OpProp is a property name and optional value like `foo=bar` or 'blatz'
For now we assume equality ('=') but in the future we could add prop ops types like `<=`
*/
class OpProp {
  name: string;

  value: string | null;

  operator: string | null;

  constructor(public raw: string) {
    this.raw = raw.trim();

    let start = 0;
    let end = 0;

    for (let i = 0; i < raw.length; i += 1) {
      const codePoint = raw.charCodeAt(i);
      // the codePoint appears to be some form of comparison operator we support
      if (codePoint === 33 || (codePoint >= 60 && codePoint <= 62)) {
        // mark the start pos of the operator
        if (start === 0) {
          start = i;
        }
      } else {
        // this is a letter (not a comparison operator at least)
        // eslint-disable-next-line no-lonely-if
        if (start > 0) {
          end = i;
          // break to mark the end pos of the operator since the rest of raw will be letters/digits
          break;
        }
      }
    }

    const operator = raw.substring(start, end);

    if (operator.length !== 0) {
      const tokens = this.raw.split(operator);
      if (tokens.length > 2) throw new Error(`Invalid OpProp: ${raw}`);
      if (tokens.length !== 2) throw new Error(`Invalid OpProp: ${raw}`);
      this.name = tokens[0];
      this.value = tokens[1];
      // NOTE use loose equality because opValue is always a string (= can be shorthand for ==)
      this.operator = (operator === '=' || operator === '===') ? '==' : operator;
    } else {
      this.name = this.raw;
      this.value = null;
      this.operator = null;
    }
  }
}

/**
Op is an operator inside brackets with a list of properies
For example: `!(foo=bar, blatz)` where `!` is the kind and `foo=bar` and `blatz` are parsed into
OpProps
*/
class Op {
  kind: OpKind;

  index: number = 0;

  props: OpProp[] = [];

  propNames: string[]; // Used often when iterating during selection

  constructor(public raw: string) {
    this.raw = raw.trim();
    switch (this.raw[0]) {
      case '(':
        if (this.raw[this.raw.length - 1] !== ')') throw new Error(`Could not parse Op: ${raw}`);
        this.kind = OpKind.Pick;
        this.parseProps(this.raw.substring(1, this.raw.length - 1));
        break;
      case '!':
        if (this.raw[1] !== '(') throw new Error(`Could not parse Op: ${raw}`);
        if (this.raw[this.raw.length - 1] !== ')') throw new Error(`Could not parse Op: ${raw}`);
        this.kind = OpKind.Omit;
        this.parseProps(this.raw.substring(2, this.raw.length - 1));
        break;
      case '^':
        if (this.raw[1] !== '(') throw new Error(`Could not parse Op: ${raw}`);
        if (this.raw[this.raw.length - 1] !== ')') throw new Error(`Could not parse Op: ${raw}`);
        this.kind = OpKind.Prefix;
        this.parseProps(this.raw.substring(2, this.raw.length - 1));
        break;
      case '$':
        if (this.raw[1] !== '(') throw new Error(`Could not parse Op: ${raw}`);
        if (this.raw[this.raw.length - 1] !== ')') throw new Error(`Could not parse Op: ${raw}`);
        this.kind = OpKind.Suffix;
        this.parseProps(this.raw.substring(2, this.raw.length - 1));
        break;
      case '?':
        if (this.raw[1] !== '(') throw new Error(`Could not parse Op: ${raw}`);
        if (this.raw[this.raw.length - 1] !== ')') throw new Error(`Could not parse Op: ${raw}`);
        this.kind = OpKind.Filter;
        this.parseProps(this.raw.substring(2, this.raw.length - 1));
        break;
      default:
        this.index = Number.parseInt(this.raw, 10);
        if (Number.isNaN(this.index)) throw new Error(`Could not parse the Op: ${raw}`);
        this.kind = OpKind.Index;
    }
    this.propNames = this.props.map((op) => op.name);
  }

  parseProps(rawProps: string) {
    const raw = rawProps.trim();
    if (raw.length === 0) throw new Error(`Could not parse operation properties: ${raw}`);
    const tokens = raw.split(',');
    tokens.forEach((token) => {
      this.props.push(new OpProp(token));
    });
  }
}

/**
Brackets holds parsed info for selections like `foo[(prop1=23, prop2)]`
*/
class Brackets {
  op: Op; // the operation from `foo[!(operation)]`

  prop: string; // `foo` from `foo[...]`

  constructor(public raw: string) {
    this.raw = this.raw.trim();
    if (this.raw.includes('[') === false) throw new Error(`Could not parse brackets: ${this.raw}`);
    if (this.raw.endsWith(']') === false) throw new Error(`Could not parse brackets: ${this.raw}`);
    const tokens = this.raw.split('[');
    if (tokens.length !== 2) throw new Error(`Could not parse brackets: ${this.raw}`);
    this.prop = tokens[0];
    this.op = new Op(tokens[1].substring(0, tokens[1].length - 1));
  }
}

class PathElement {
  kind: ElementKind;

  brackets?: Brackets;

  parsedInfo: { [key: string]: any } = {}; // per-kind info populated in `parse` calls

  // This throws an exception if `raw` can not be parsed
  constructor(public raw: string) {
    this.kind = PathElement.sniffKind(raw);
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
      case ElementKind.Omit:
        return this.selectOmit(target);
      case ElementKind.Prefix:
        return this.selectPrefix(target);
      case ElementKind.Suffix:
        return this.selectSuffix(target);
      case ElementKind.Filter:
        return this.selectFilter(target);
      default:
        throw new Error(`Unknown PathElement.kind: ${this.kind}`);
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
        throw new Error(`Invalid PathElement kind: ${this.kind}`);
    }
  }

  selectPluck(target: any): any | undefined {
    return target[this.raw];
  }

  selectIndex(target: any): any | undefined {
    if (!this.brackets || this.brackets.op.kind !== OpKind.Index) {
      throw new Error(`Invalid brackets state!${this}`);
    }

    const prop = target[this.brackets.prop];
    if (typeof prop === 'undefined') return undefined;

    let { index } = this.brackets.op;
    if (index >= prop.length) return undefined;
    if (index < 0) {
      index = prop.length + index;
    }
    if (index < 0) return undefined;

    try {
      return prop[index];
    } catch (e) {
      // TODO (van) use Logger console.log('Index fail', this.brackets, e);
      return undefined;
    }
  }

  selectPick(target: any): any | undefined {
    if (!this.brackets || this.brackets.op.kind !== OpKind.Pick) {
      throw new Error(`Invalid brackets state!${this}`);
    }

    const prop: any = target[this.brackets.prop];
    if (typeof prop === 'undefined') return undefined;

    const results: { [key: string]: any } = {};
    let atLeastOne = false;
    this.brackets.op.props.forEach((opProp) => {
      if (typeof prop[opProp.name] !== 'undefined') {
        results[opProp.name] = prop[opProp.name];
        atLeastOne = true;
      }
    });
    if (atLeastOne === false) return undefined;
    return results;
  }

  selectOmit(target: any): any | undefined {
    if (!this.brackets || this.brackets.op.kind !== OpKind.Omit) {
      throw new Error(`Invalid brackets state!${this}`);
    }

    const prop: any = target[this.brackets.prop];
    if (typeof prop === 'undefined') return undefined;

    const results: { [key: string]: any } = {};
    let atLeastOne = false;
    const propNames = Object.getOwnPropertyNames(prop);
    for (let i = 0; i < propNames.length; i += 1) {
      const key = propNames[i];
      if (this.brackets.op.propNames.includes(key)) continue;
      results[key] = prop[key];
      atLeastOne = true;
    }
    if (atLeastOne === false) return undefined;
    return results;
  }

  selectPrefix(target: any): any | undefined {
    if (!this.brackets || this.brackets.op.kind !== OpKind.Prefix) {
      throw new Error(`Invalid brackets state!${this}`);
    }

    const prop: any = target[this.brackets.prop];
    if (typeof prop === 'undefined') return undefined;

    const results: { [key: string]: any } = {};
    let atLeastOne = false;

    const propNames = Object.getOwnPropertyNames(prop);
    for (let i = 0; i < propNames.length; i += 1) {
      const key = propNames[i];
      for (let j = 0; j < this.brackets.op.propNames.length; j += 1) {
        if (key.startsWith(this.brackets.op.propNames[j])) {
          results[key] = prop[key];
          atLeastOne = true;
          break;
        }
      }
    }
    if (atLeastOne === false) return undefined;
    return results;
  }

  selectSuffix(target: any): any | undefined {
    if (!this.brackets || this.brackets.op.kind !== OpKind.Suffix) {
      throw new Error(`Invalid brackets state!${this}`);
    }

    const prop: any = target[this.brackets.prop];
    if (typeof prop === 'undefined') return undefined;

    const results: { [key: string]: any } = {};
    let atLeastOne = false;
    const propNames = Object.getOwnPropertyNames(prop);
    for (let i = 0; i < propNames.length; i += 1) {
      const key = propNames[i];
      for (let j = 0; j < this.brackets.op.propNames.length; j += 1) {
        if (key.endsWith(this.brackets.op.propNames[j])) {
          results[key] = prop[key];
          atLeastOne = true;
          break;
        }
      }
    }
    if (atLeastOne === false) return undefined;
    return results;
  }

  selectFilter(target: any): any | undefined {
    if (!this.brackets || this.brackets.op.kind !== OpKind.Filter) {
      throw new Error(`Invalid brackets state!${this}`);
    }

    const prop: any = target[this.brackets.prop];
    if (typeof prop === 'undefined') return undefined;

    // Check that all of the filter properties are matched (by existence or value)

    for (let i = 0; i < this.brackets.op.props.length; i += 1) {
      const opProp = this.brackets.op.props[i];
      if (typeof prop[opProp.name] === 'undefined') return undefined;
      if (opProp.value === null) continue; // Existance is enough
      /*
      Values come in as strings so we use loose matching (== not ===) to take advantage of JS's built-in fast parsing and evaluation
      */
      try {
        switch (typeof prop[opProp.name]) {
          case 'boolean':
            if (prop[opProp.name] !== (opProp.value.toLowerCase() === 'true')) return undefined;
            break;
          case 'string':
            // eslint-disable-next-line no-eval
            if (!eval(`'${prop[opProp.name]}' ${opProp.operator} '${opProp.value}'`)) return undefined;
            break;
          case 'number':
            // eslint-disable-next-line no-eval
            if (!eval(`${prop[opProp.name]} ${opProp.operator} '${opProp.value}'`)) return undefined;
            break;
          default:
            throw new Error(`Unsupported comparison ${opProp.raw}`);
        }
      } catch (err) {
        throw new Error(`Failed to compare ${opProp.raw} ${err.message}`);
      }
    }

    return prop;
  }

  static sniffKind(raw: string): ElementKind {
    if (raw.length === 0) throw new Error(`Invalid path element: ${raw}`);
    const snifferKeys = Object.keys(kindSniffers);
    for (let i = 0; i < snifferKeys.length; i += 1) {
      const kind = snifferKeys[i];
      if (kindSniffers[kind](raw)) return kind as ElementKind;
    }
    throw new Error(`Could not sniff kind of ${raw}`);
  }
}

export class Path {
  tokens: string[];

  elements: PathElement[] = [];

  constructor(public path: string) {
    this.path = path.trim();
    this.tokens = this.path.split('.');
    this.tokens.forEach((token) => {
      this.elements.push(new PathElement(token)); // Will throw an exception if it can't parse
    });
  }

  select(target: object): any | undefined {
    let selection = target;
    for (let i = 0; i < this.elements.length; i += 1) {
      selection = this.elements[i].select(selection);
      if (typeof selection === 'undefined') return undefined;
    }
    return selection;
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
- Filter: object[?(property=value, ...)] -> object or null if the object's `property` does not compare to `value`

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
  return parsedPath.select(target || globalThis);
}

/**
@param path - a selection path
@return true if the `path` can be used as a `path` parameter to `select`
*/
export function validate(path: string): boolean {
  return parsePath(path) !== false;
}
