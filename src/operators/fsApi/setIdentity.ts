import FSApiOperator from './fsApi';

// eslint-disable-next-line import/prefer-default-export
export class SetIdentityOperator extends FSApiOperator {
  // eslint-disable-next-line class-methods-use-this
  prepareData(inputData:any[]): any[] | null {
    if (inputData === null || inputData.length < 1) {
      throw new Error('Input data is empty');
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
