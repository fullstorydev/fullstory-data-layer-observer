import { parsePath, ElementKind, select } from './selector';

/**
 * To observe a data layer, additional metadata about the data layer must be known. DataLayerTarget retain metadata
 * about the "target" to be observed from a data layer.
 *
 * A target is normally constructed using the static `find` function when targeting window-based data layers.
 * If the data layer is a reference to an object not contained in the window, some limitations will exist because less
 * metadata is available. For example, the `path` member would not describe the dot path to the reference, and should
 * simply be an arbitrary, unique value.
 *
 * Selectors are commonly used to access objects or functions in a data layer; however, a selector can sometimes return
 * a copy of an object. Picking or omitting returns an intermediate object - not the original
 * object from the data layer. DataLayerTarget will retain information about the underlying data layer reference as well
 * as allowing selector queries to be run.
 */
export default class DataLayerTarget {
  /**
   * Returns the path to the subject. Note that this path is derived from the `path` member and may not be applicable
   * if the target is manually constructed by passing a reference.
   */
  get subjectPath(): string {
    return this.path.substring(0, this.path.lastIndexOf('.'));
  }

  /**
   * Returns the reference to the target object or function.
   */
  get value(): any {
    // TODO (van) there is a possibility that if the user is supplying the path to the constructor
    // that the path matches an unintended global object
    const val = select(this.path); // try a select first because window-based data layers are more common
    return val || (this.subject as any)[this.property];
  }

  type?: 'object' | 'function' | undefined; // the typeof target

  /**
   * Creates a DataLayerTarget.
   * @param subject object that normally defines a data layer (e.g. digitalData or dataLayer)
   * @param property that contains the object or function to observe
   * @param path that describes the path (or some unique identifier) to the property
   * @param selector that can optionally describe a query to be used when accessing the data layer
   */
  constructor(public readonly subject: Object, public readonly property: string, public readonly path: string,
    public readonly selector = '') {
    if (typeof subject !== 'object') {
      throw new Error('Data layer subject must be an object');
    }

    if (!property) {
      throw new Error('Data layer target property is missing');
    }

    if (!path) {
      throw new Error('Data layer subject must also have a path to broadcast changes or function calls');
    }

    // NOTE select using the path because a filter could not yet be valid
    const target = this.selector ? select(this.path) : (this.subject as any)[this.property];
    const type = typeof target;

    switch (type) {
      case 'object':
      case 'function':
        this.type = type;
        break;
      default:
        throw new Error('Data layer not found');
    }
  }

  /**
   * Returns the result of executing a selector. If a selector was not provided, `this.value` will be returned.
   */
  query(): any {
    return this.selector ? select(this.selector) : this.value;
  }

  /**
   * Finds a target in the data layer and constructs a DataLayerTarget.
   * @param selector used to build the target
   */
  static find(selector: string): DataLayerTarget {
    const parsedPath = parsePath(selector);

    if (!parsedPath) {
      throw new Error('Failed to parse selector');
    }

    let subjectPath: string = '';
    let targetPath: string = '';
    let property: string = '';

    const { elements } = parsedPath;

    // build a path to the target up to the point where a selector might return a deep copy
    for (let i = 0; i < elements.length; i += 1) {
      const { kind, raw, brackets } = elements[i];
      if (kind !== ElementKind.Pluck && kind !== ElementKind.Index) {
        if (brackets) {
          targetPath = selector.substring(0, selector.indexOf(`[${brackets.op.raw}]`));
          property = brackets.prop;
          break;
        } else {
          throw new Error(`Brackets expected in ${raw} but not found`);
        }
      } else {
        const pathProperty = !brackets ? raw : brackets.prop;

        subjectPath += !subjectPath ? raw : `.${raw}`;
        targetPath += !targetPath ? raw : `.${raw}`;
        property = pathProperty;
      }
    }

    // the target and subject match because the selector is all plucks and indexes
    if (subjectPath === targetPath) {
      // so backup one level to get the subject
      subjectPath = subjectPath.substring(0, subjectPath.lastIndexOf('.'));
    }

    // if the path is something like `s` the subject is unknown due to an empty subjectPath
    // so use the globalThis as the subject
    const subject = !subjectPath ? globalThis : select(subjectPath);

    return new DataLayerTarget(subject, property, targetPath, selector);
  }
}
