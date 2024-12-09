import FSApiOperator from './fsApi';

export default class SetUserPropertiesOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] {
    const realData:any[] = [
      'setProperties',
      { type: 'user' },
      { properties: inputData[0] },
    ];
    return realData;
  }
}
