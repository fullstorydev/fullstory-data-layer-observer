import { OperatorValidator, OperatorOptions, Operator } from '../operator';

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

}

/**
 * SuffixOperator appends FullStory types to an object's properties.
 */
export class SuffixOperator implements Operator {
  static specification = {
    index: { required: false, type: ['number'] },
    maxDepth: { required: false, type: ['number'] },
  };

  readonly index: number;

  readonly maxDepth: number;

  constructor(public options: SuffixOperatorOptions) {
    // NOTE the index is -1 because payloads to FS.event or FS.setUserVars are the last in the list of args
    const { index = -1, maxDepth = 10 } = options;

    this.index = index;
    this.maxDepth = maxDepth;
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
   * There are 10 valid type suffixes:
   * _bool, _date, _int, _real, _str, _bools, _dates, _ints, _reals, and _strs.
   * @param value the object to inspect and return suffix
   */
  static coerceSuffix(value: SuffixableValue): string {
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
      return '';
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
        return '';
    }
  }

  /**
   * Maps a given object to an object with FS type suffixes on properties.
   * If a value can not be suffixed, it will not be included in the resulting object.
   * @param obj the Object to map
   * @param maxDepth the maximum number of levels to recursive suffix child objects
   * @param currentDepth the current depth if recursively suffixing object (this is not intended to be used externally)
   */
  mapToSuffix(obj: { [key: string]: any }, currentDepth = 0): SuffixedObject {
    const suffixedObj: SuffixedObject = {};

    // guard against error condition 'Cannot convert undefined or null to object'
    if (obj === undefined || obj === null) {
      return suffixedObj;
    }

    Object.getOwnPropertyNames(obj).forEach((prop: string) => {
      const value = obj[prop];
      const suffix = SuffixOperator.coerceSuffix(value);
      const suffixedProp = `${prop}${suffix}`;

      // if a suffix exists, it means we support the value
      if (suffix) {
        switch (suffix) {
          case Suffixes.Obj:
            if (currentDepth < this.maxDepth) {
              suffixedObj[suffixedProp] = this.mapToSuffix(value, currentDepth + 1);
            }
            break;
          case Suffixes.Objs:
            if (currentDepth < this.maxDepth) {
              suffixedObj[suffixedProp] = value.map((item: any) => this.mapToSuffix(item, currentDepth + 1));
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
    const index = this.index >= 0 ? this.index : data.length + this.index;
    const suffixedData = data;
    suffixedData[index] = this.mapToSuffix(suffixedData[index]);

    return suffixedData;
  }

  validate() {
    const validator = new OperatorValidator(this.options);
    validator.validate(SuffixOperator.specification);
  }
}
