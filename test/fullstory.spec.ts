import { expect } from 'chai';
import 'mocha';

import { DataLayerObserver } from '../src/observer';
import * as rules from '../examples/rules/ceddl-user-fullstory.json';

import { CEDDL, basicDigitalData } from './mocks/CEDDL';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
import { expectParams } from './utils/mocha';

interface GlobalMock {
  digitalData: CEDDL,
  FS: FullStory
  console: Console,
}

let globalMock: GlobalMock;

describe('FullStory example rules unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = basicDigitalData;
    (globalThis as any).FS = new FullStory();
    globalMock = globalThis as any;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
    delete (globalThis as any).FS;
  });

  it('it should send any CEDDL user property to FS.setUserVars', () => {
    const { profileInfo, address } = basicDigitalData.user.profile[0];

    const observer = new DataLayerObserver({ rules: [rules[0]], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [payload] = expectParams(globalMock.FS, 'setUserVars');
    expect(payload.profileID).to.eq(profileInfo.profileID);
    expect(payload.userName).to.eq(profileInfo.userName);
    expect(payload.line1).to.eq(address.line1);
    expect(payload.line2).to.eq(address.line2);
    expect(payload.city).to.eq(address.city);
    expect(payload.stateProvince).to.eq(address.stateProvince);
    expect(payload.postalCode).to.eq(address.postalCode);
    expect(payload.country).to.eq(address.country);
    expect(payload.segment).to.be.undefined;
    expect(payload.social).to.be.undefined;
    expect(payload.attributes).to.be.undefined;
  });

  it('it should send any CEDDL user property to FS.identify', () => {
    const { profileInfo, address } = basicDigitalData.user.profile[0];

    const observer = new DataLayerObserver({ rules: [rules[1]], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [uid, payload] = expectParams(globalMock.FS, 'identify');
    expect(uid).to.eq(profileInfo.profileID);
    expect(payload.userName).to.eq(profileInfo.userName);
    expect(payload.line1).to.eq(address.line1);
    expect(payload.segment).to.be.undefined;
  });

  it('it should send only allowed CEDDL user properties to FS.identify', () => {
    (globalThis as any).digitalData.user.profile[0].password = 'sensitive';

    const { profileInfo, address } = basicDigitalData.user.profile[0];

    const observer = new DataLayerObserver({ rules: [rules[2]], readOnLoad: true });
    expect(observer).to.not.be.undefined;

    const [uid, payload] = expectParams(globalMock.FS, 'identify');
    expect(uid).to.eq(profileInfo.profileID);
    expect(payload.userName).to.eq(profileInfo.userName);
    expect(payload.line1).to.eq(address.line1);
    expect(payload.password).to.be.undefined;

    delete (globalThis as any).digitalData.user.profile[0].password;
  });
});
