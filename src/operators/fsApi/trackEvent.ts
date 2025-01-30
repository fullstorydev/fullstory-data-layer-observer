import FSApiOperator from './fsApi';

// eslint-disable-next-line import/prefer-default-export
export class TrackEventOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] | null {
    if (inputData === null || inputData.length < 1) {
      throw new Error('Input data is empty');
    } else if (inputData.length < 2) {
      throw new Error('Input data expected to have two parameters');
    }
    return [
      'trackEvent',
      {
        name: inputData[0],
        properties: inputData[1],
      },
    ];
  }
}
