import DataLayerValue from './value';

/**
 * Implementation of DataLayerValue that just holds a simple value
 */
export default class SimpleDataLayerValue implements DataLayerValue {
  type: 'object' | 'function' | undefined = 'object';

  // eslint-disable-next-line no-empty-function
  constructor(public path:string, public value: any) {
  }

  query(): any {
    return this.value;
  }
}
