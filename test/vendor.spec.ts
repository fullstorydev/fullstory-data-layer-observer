import { expect } from 'chai';
import 'mocha';

import { FullStory } from './vendor/fullstory-recording';

describe('mock FullStory recording tests', () => {

  it('it should add method calls into call queues ', () => {
    const FS = new FullStory();

    expect(FS.callQueues.consent.length).to.eq(0);
    FS.consent(true);
    expect(FS.callQueues.consent.length).to.eq(1);
    expect(FS.callQueues.consent.pop().parameters[0]).to.be.true;

    expect(FS.callQueues.log.length).to.eq(0);
    FS.log(0, 'value')
    expect(FS.callQueues.log.length).to.eq(1);
    expect(FS.callQueues.log.pop().parameters[1]).to.eq('value');
  });

});