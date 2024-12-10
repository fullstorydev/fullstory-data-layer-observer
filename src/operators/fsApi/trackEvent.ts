import FSApiOperator from './fsApi';

export default class TrackEventOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] | null {
    if (inputData === null || inputData.length < 2) {
      return null;
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
