import { expect } from 'chai';
import 'mocha';

import { FlattenOperator } from '../src/operators';
import { basicDigitalData } from './mocks/CEDDL';

describe('flatten operator unit tests', () => {

  it('it should validate options', () => {
    expect(() => new FlattenOperator({
      name: 'flatten'
    }).validate()).to.not.throw();

    expect(() => new FlattenOperator({
      name: 'flatten', index: 1,
    }).validate()).to.not.throw();

    expect(() => new FlattenOperator({
      name: 'flatten', maxDepth: 3,
    }).validate()).to.not.throw();
  });

  it('it should flatten an object', () => {
    const userProfile = basicDigitalData.user.profile[0];
    const operator = new FlattenOperator({ name: 'flatten' });
    const [flatUser] = operator.handleData([userProfile])!;

    expect(flatUser).to.not.be.null;
    expect(flatUser!.profileID).to.eq(userProfile.profileInfo.profileID);
    expect(flatUser!.userName).to.eq(userProfile.profileInfo.userName);
    expect(flatUser!.city).to.eq(userProfile.address.city);
    expect(flatUser!.stateProvince).to.eq(userProfile.address.stateProvince);
  });

  it('it should not flatten array contents', () => {
    const userProfile = {
      nicknames: ['Jon', 'Johny'],
      ...basicDigitalData.user.profile[0]
    };
    const operator = new FlattenOperator({ name: 'flatten' });
    const [flatUser] = operator.handleData([userProfile])!;

    expect(flatUser).to.not.be.null;
    expect(flatUser!.nicknames).to.eq(userProfile.nicknames);
  });

  it('it should flatten an object at a specific index', () => {
    const userProfile = basicDigitalData.user.profile[0];
    const operator = new FlattenOperator({ name: 'flatten', index: 1 });
    const [profileID, flatUser] = operator.handleData([userProfile.profileInfo.profileID, userProfile])!;

    expect(flatUser).to.not.be.null;
    expect(profileID).to.not.be.null;
    expect(flatUser!.profileID).to.eq(userProfile.profileInfo.profileID);
    expect(flatUser!.userName).to.eq(userProfile.profileInfo.userName);
    expect(flatUser!.city).to.eq(userProfile.address.city);
    expect(flatUser!.stateProvince).to.eq(userProfile.address.stateProvince);
  });

  it('it should flatten an object to a specific depth', () => {
    const userProfile = {
      nicknames: ['Jon', 'Johny'],
      children: {
        junior: {
          name: 'Jon Jr.'
        },
        tripp: {
          name: 'Jon III'
        }
      },
      ...basicDigitalData.user.profile[0]
    };
    const operator = new FlattenOperator({ name: 'flatten', maxDepth: 1 });
    const [flatUser] = operator.handleData([userProfile])!;

    expect(flatUser).to.not.be.null;
    expect(flatUser!.profileID).to.eq(userProfile.profileInfo.profileID);
    expect(flatUser!.userName).to.eq(userProfile.profileInfo.userName);
    expect(flatUser!.city).to.eq(userProfile.address.city);
    expect(flatUser!.stateProvince).to.eq(userProfile.address.stateProvince);
    expect(flatUser!.junior).to.be.undefined;
    expect(flatUser!.tripp).to.be.undefined;
  });

});