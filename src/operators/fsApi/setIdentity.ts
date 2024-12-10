import FSApiOperator from './fsApi';

export default class SetIdentityOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] | null {
    if (inputData === null || inputData.length < 1) {
      return null;
    }
    const realData:any[] = [
      'setIdentity',
      { uid: inputData[0] },
    ];
    // setIdentity calls can have optional properties
    if (inputData.length > 1) {
      // eslint-disable-next-line prefer-destructuring
      realData[1].properties = inputData[1];
    }
    return realData;
  }
}
