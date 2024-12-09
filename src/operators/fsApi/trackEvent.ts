import FSApiOperator from './fsApi';

export default class TrackEventOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] {
    const realData:any[] = [
      'trackEvent',
      { name: inputData[0] },
      { properties: inputData[1] },
    ];
    return realData;
  }
}
