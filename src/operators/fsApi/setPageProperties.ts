import FSApiOperator from './fsApi';

export default class SetPagePropertiesOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] | null {
    if (inputData === null || inputData.length < 1) {
      return null;
    }
    return [
      'setProperties',
      {
        type: 'page',
        properties: inputData[0],
      },
    ];
  }
}
