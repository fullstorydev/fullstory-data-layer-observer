/* eslint-disable max-classes-per-file */

/**
 * Defines CustomEvent types.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Event/type
 */
export enum DataLayerEventType {
  PROPERTY = '_dlo_DataLayerProperty',
  FUNCTION = '_dlo_DataLayerFunction',
}

/**
 * DataLayerDetail provides additional metadata about the data layer event to event handlers.
 * See https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail
 */
export interface DataLayerDetail {
  value?: object; // value of a property assignment

  args?: any[]; // args passed to a function

  path: string; // path to the data layer object
}

/**
 * FunctionDetail provides metadata specific to function invocations.
 */
export class FunctionDetail implements DataLayerDetail {
  constructor(public target: object, public args: any[], public path: string) {
    // use constructor params
  }
}

/**
 * PropertyDetail provides metadata specific to property (i.e. value) changes.
 */
export class PropertyDetail implements DataLayerDetail {
  constructor(public target: object, public value: object, public path: string) {
    // use constructor params
  }
}
