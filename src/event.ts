/* eslint-disable max-classes-per-file */

/**
 * Defines CustomEvent types. Types will be prefixed with a DLO namespace.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Event/type
 * @param path that identifies the data layer object that created the event
 */
export function createEventType(path: string) {
  return `datalayerobserver/${path}`;
}

/**
 * DataLayerDetail provides additional metadata about the data layer event to event handlers.
 * See https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail
 */
export interface DataLayerDetail {
  value?: any; // value of a property assignment

  args?: any[]; // args passed to a function

  path: string; // path to the data layer object
}

/**
 * FunctionDetail provides metadata specific to function invocations.
 */
export class FunctionDetail implements DataLayerDetail {
  constructor(public path: string, public property: string, public args: any[]) {
    // use constructor params
  }
}

/**
 * PropertyDetail provides metadata specific to property (i.e. value) changes.
 */
export class PropertyDetail implements DataLayerDetail {
  constructor(public path: string, public property: string, public value: any) {
    // use constructor params
  }
}
