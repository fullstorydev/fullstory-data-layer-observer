import FSApiOperator from './fsApi';

export default class SetPagePropertiesOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] {
    const realData:any[] = [
      'setProperties',
      { type: 'page' },
      { properties: inputData[0] },
    ];
    return realData;
  }
}
