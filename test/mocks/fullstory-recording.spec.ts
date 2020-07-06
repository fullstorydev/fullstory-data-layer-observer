import { expect } from 'chai';
import 'mocha';

import { FullStory } from './fullstory-recording';
import { expectParams, expectNoCalls } from '../utils/mocha';

describe('mock FullStory recording tests', () => {

  it('it should add method calls into call queues ', () => {
    const FS = new FullStory();

    expectNoCalls(FS, 'consent');
    FS.consent(true);
    const [ consented ] = expectParams(FS, 'consent');
    expect(consented).to.be.true;

    expectNoCalls(FS, 'log');
    FS.log(0, 'value')
    const [ logLevel, message ] = expectParams(FS, 'log');
    expect(logLevel).to.eq(0);
    expect(message).to.eq('value');
  });

});