/**
 * Higher level interface for something that can provide a value from the DataLayer.  We now have multiple ways
 * of producing values (window object property, json from the DOM) so this represents what is needed by the sytem
 * from a higher level.
 */
export default interface DataLayerValue {

  /**
   * The actual value
   */
  value: any;

  /**
   * Unique identifier for the property
   */
  path: string;

  /**
   * Allows for dynamically querying to set the value, and should return the value
   */
  query(): any;

  /**
   * The type of the value
   */
  type?: 'object' | 'function' | undefined;

  // eslint-disable-next-line
}
