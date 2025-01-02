import FSApiOperator from './fsApi';

// eslint-disable-next-line import/prefer-default-export
export class SetUserPropertiesOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] | null {
    if (inputData === null || inputData.length < 1) {
      throw new Error('Input data is empty');
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
