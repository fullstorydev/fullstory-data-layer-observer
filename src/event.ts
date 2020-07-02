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
export class DataLayerDetail {
  value?: object; // value of a property assignment
  args?: any[];   // args passed to a function

  /**
   * Creates a DataLayerDetail
   * @param target the target object (i.e. data layer) that generated the event
   * @param path the path to the target (used to disambiguate other events of the same type)
   */
  constructor(readonly target: object, readonly path: string) {

  }
}

/**
 * FunctionDetail provides metadata specific to function invocations.
 */
export class FunctionDetail extends DataLayerDetail {
  constructor(target: object, public args: any[], path: string) {
    super(target, path);
  }
}

/**
 * PropertyDetail provides metadata specific to property (i.e. value) changes.
 */
export class PropertyDetail extends DataLayerDetail {
  constructor(target: object, public value: object, path: string) {
    super(target, path);
  }
}