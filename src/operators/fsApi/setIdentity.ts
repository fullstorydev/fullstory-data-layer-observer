import FSApiOperator from './fsApi';

export default class SetIdentityOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] {
    const realData:any[] = [
      'setIdentity',
      { uid: inputData[0] },
    ];
    if (inputData.length > 1) {
      realData[1] = { properties: inputData[1] };
    }
    return realData;
  }
}
