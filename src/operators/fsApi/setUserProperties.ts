import FSApiOperator from './fsApi';

export default class SetUserPropertiesOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] | null {
    if (inputData === null || inputData.length < 1) {
      return null;
    }
    return [
      'setProperties',
      {
        type: 'user',
        properties: inputData[0],
      },
    ];
  }
}
