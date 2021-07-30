import {
  OperatorValidator, OperatorOptions, Operator, safeUpdate,
} from '../operator';

/**
 * A SuffixedObject is an object that has had FS types appended to properties.
 */
export type SuffixedObject = { [key: string]: SuffixableValue | SuffixedObject };

/**
 * A SuffixableValue is an allowed value for a suffix type.
 */
export type SuffixableValue = boolean | number | string | boolean[] | number[] | string[] | object | object[];

/**
 * Enum of allowed FullStory object suffixes.
 */
export enum Suffixes {
  Bool = '_bool',
  Bools = '_bools',
  Date = '_date',
  Dates = '_dates',
  Int = '_int',
  Ints = '_ints',
  Obj = '_obj',
  Objs = '_objs',
  String = '_str',
  Strings = '_strs',
  Real = '_real',
  Reals = '_reals',
}

export interface SuffixOperatorOptions extends OperatorOptions {
  maxProps?: number;
}

/**
 * SuffixOperator appends FullStory types to an object's properties.
 */
export class SuffixOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    maxDepth: { required: false, type: ['number'] },
    maxProps: { required: false, type: ['number'] },
  };

  static readonly DefaultMaxProps = 100;

  readonly index: number;

  readonly maxDepth: number;

  readonly maxProps: number;

  constructor(public options: SuffixOperatorOptions) {
    // NOTE the index is -1 because payloads to FS.event or FS.setUserVars are the last in the list of args
    const { index = -1, maxDepth = 10, maxProps = 100 } = options;

    this.index = index;
    this.maxDepth = maxDepth;
    this.maxProps = maxProps;
  }

  /**
   * Infers the type suffix for a numeric value (i.e. Int or Real).
   * @param value value property value used to infer type and return suffix
   */
  static coerceNumSuffix(): string {
    // NOTE numbers are a Real by default
    // this addresses a more difficult historical problem where
    // 1.00 will return _int but you might expect 1.00 as a _real suffix
    // this dual type situation makes searching difficult
    return Suffixes.Real;
  }

  /**
   * Infers the type suffix needed for FS API objects.
   * Returns `null` if the value is not supported and thus unable to be suffixed.
   * There are 10 valid type suffixes:
   * _bool, _date, _int, _real, _str, _bools, _dates, _ints, _reals, and _strs.
   * @param value the object to inspect and return suffix
   */
  static coerceSuffix(value: SuffixableValue): string | null {
    // arrays are pluralized
    if (Array.isArray(value)) {
      if (value.every((v: any) => typeof v === 'string')) {
        return Suffixes.Strings;
      }

      if (value.every((v: any) => typeof v === 'boolean')) {
        return Suffixes.Bools;
      }

      if (value.every((v: any) => typeof v === 'number')) {
        return Suffixes.Reals;
      }

      if (value.every((v: any) => v instanceof Date)) {
        return Suffixes.Dates;
      }

      if (value.every((v: any) => typeof v === 'object')) {
        return Suffixes.Objs;
      }

      // it's an array but doesn't have values that we can support or has multiple types
      return null;
    }

    if (value instanceof Date) {
      return Suffixes.Date;
    }

    // NOTE this needs to go here because the object check must occur after the Arrays check
    switch (typeof value) {
      case 'string':
        return Suffixes.String;
      case 'boolean':
        return Suffixes.Bool;
      case 'number':
        return SuffixOperator.coerceNumSuffix();
      case 'object':
        return Suffixes.Obj;
      default:
        // unable to coerce the type, which is expected for function types for example
        return null;
    }
  }

  /**
   * Maps a given object to an object with FS type suffixes on properties.
   * If a value can not be suffixed, it will not be included in the resulting object.
   * @param obj the Object to map
   * @param maxDepth the maximum number of levels to recursive suffix child objects
   * @param currentDepth the current depth if recursively suffixing object (this is not intended to be used externally)
   * @param totalProps the total number of props found within the object
   */
  mapToSuffix(obj: { [key: string]: any }, currentDepth = 0, totalProps = 0): SuffixedObject {
    const suffixedObj: SuffixedObject = {};

    // guard against error condition 'Cannot convert undefined or null to object'
    if (obj === undefined || obj === null) {
      return suffixedObj;
    }

    // count the props to guard against super-sized object being unknowingly added to a data layer
    // this reduces the likelihood of hitting cardinality but also prevents impacting site performance
    const numProps = totalProps + Object.getOwnPropertyNames(obj).length;

    if (numProps > this.maxProps) {
      throw Error(`Number of object properties exceeds the limit (${this.maxProps}); increase maxProps to ${numProps}`);
    }

    Object.getOwnPropertyNames(obj).forEach((prop: string) => {
      const value = obj[prop];

      // certain properties must adhere to exact naming conventions and should not be suffixed
      // NOTE this is only for root level objects used with FS.identify, setUserVars, setVars
      const suffix = currentDepth === 0 && (prop === 'pageName' || prop === 'displayName' || prop === 'email') ? ''
        : SuffixOperator.coerceSuffix(value);
      const suffixedProp = `${prop}${suffix}`;

      // if a suffix exists, it means we support the value
      if (suffix !== null) {
        switch (suffix) {
          case Suffixes.Obj:
            if (currentDepth < this.maxDepth) {
              suffixedObj[suffixedProp] = this.mapToSuffix(value, currentDepth + 1, numProps);
            }
            break;
          case Suffixes.Objs:
            if (currentDepth < this.maxDepth) {
              suffixedObj[suffixedProp] = value.map((item: any) => this.mapToSuffix(item, currentDepth + 1, numProps));
            }
            break;
          default:
            suffixedObj[suffixedProp] = value;
        }
      }
    });
    return suffixedObj;
  }

  handleData(data: any[]): any[] | null {
    // NOTE this operator transforms data - be absolutely sure there are no side effects to the data layer!

    let index = this.index >= 0 ? this.index : data.length + this.index;

    // check if the `source` param was included and if so decrement the index
    if (typeof data[index] === 'string') {
      index -= 1;
    }

    const suffixed = this.mapToSuffix(data[index]);

    // a copy of the incoming data layer needs to be returned
    // if you modify/update the `data` parameter directly, you may modify the data layer!
    return safeUpdate(data, index, suffixed);
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(SuffixOperator.specification);
  }
}
