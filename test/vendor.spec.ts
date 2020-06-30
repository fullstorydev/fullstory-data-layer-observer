import { expect } from 'chai';
import 'mocha';

import { FullStory } from './vendor/fullstory-recording';
import { expectParams } from './mock';

describe('mock FullStory recording tests', () => {

  it('it should add method calls into call queues ', () => {
    const FS = new FullStory();

    expect(FS.callQueues.consent.length).to.eq(0);
    FS.consent(true);
    const [ consented ] = expectParams(FS, 'consent');
    expect(consented).to.be.true;

    expect(FS.callQueues.log.length).to.eq(0);
    FS.log(0, 'value')
    const [ logLevel, message ] = expectParams(FS, 'log');
    expect(logLevel).to.eq(0);
    expect(message).to.eq('value');
  });

});