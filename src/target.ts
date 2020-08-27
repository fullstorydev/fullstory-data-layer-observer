import { parsePath, ElementKind, select } from './selector';

/**
 * DataLayerTarget refers to the subject to be observed from a data layer.
 * Selectors are commonly used to access objects or functions in a data layer; however, a selector can sometimes return
 * a copy of an object. For example, picking or omitting returns an intermediate object - not the original
 * object from the data layer. DataLayerTarget retains the subject and path to the subject for the purposes
 * of storing a reference to the actual data layer object or function.
 */
export default class DataLayerTarget {
  readonly subject: Object | Function;

  readonly path: string;

  get value(): any {
    return typeof this.subject === 'object' ? select(this.selector) : null;
  }

  constructor(public readonly selector: string) {
    const parsedPath = parsePath(selector);

    if (!parsedPath) {
      throw new Error('Failed to parse target selector');
    }

    const { elements } = parsedPath;

    let path: string = '';

    for (let i = 0; i < elements.length; i += 1) {
      const { kind, raw, brackets } = elements[i];
      // traverse the path elements to the point where a copy would otherwise be returned
      if (kind !== ElementKind.Pluck && kind !== ElementKind.Index) {
        if (brackets) {
          path = selector.substring(0, selector.indexOf(`[${brackets.op.raw}]`));
          break;
        } else {
          throw new Error(`Brackets expected in ${raw} but not found`);
        }
      }
    }

    this.path = !path ? selector : path;
    this.subject = select(this.path);
  }
}
