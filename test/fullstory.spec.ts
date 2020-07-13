import { expect } from 'chai';
import 'mocha';

// import { DataLayerObserver } from '../src/observer';
// import { ceddlUser } from '../src/examples/rules/fullstory';

import { CEDDL, basicDigitalData } from './mocks/CEDDL';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
// import { expectParams } from './utils/mocha';

interface GlobalMock {
  digitalData: CEDDL,
  FS: FullStory
  console: Console,
}

let globalMock: GlobalMock;

describe('FullStory examples unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = basicDigitalData;
    (globalThis as any).FS = new FullStory();
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
    delete (globalThis as any).FS;
  });

  it('it should send CEDDL user to FS.setUserVars', () => {
    expect(globalMock).to.not.be.undefined;

    /*
    const flattenedUser = basicDigitalData.user;

    const observer = new DataLayerObserver({ rules: ceddlUser, readOnLoad: true });

    expect(observer).to.not.be.undefined;

    const [userVarsPayload] = expectParams(globalMock.FS, 'setUserVars');
    expect(userVarsPayload).to.eq(flattenedUser);

    const [uid, identifyPayload] = expectParams(globalMock.FS, 'identify');
    expect(uid).to.eq(basicDigitalData.user.profile[0].profileInfo.profileID);
    expect(identifyPayload).to.eq(flattenedUser);
    */
  });

  it('it should send CEDDL user to FS.identify', () => {

  });
});
