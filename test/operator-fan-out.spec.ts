import 'mocha';
import { expect } from 'chai';
import deepcopy from 'deepcopy';

import { DataLayerObserver } from '../src/observer';

const item = {
  'left-hand': { fingers: { index: true, thumb: false } },
  'right-hand': { fingers: { middle: false, pinky: true } },
  list: [
    { eenie: 'meenie' },
    { minie: 'moe' },
  ],
};

// @ts-ignore
function handleDestination(...params: any[]) {
  (globalThis as any).callParameters.push(params);
}

describe('fan out operator unit tests', () => {
  beforeEach(() => {
    (globalThis as any).item = deepcopy(item);
    (globalThis as any).handleDestination = handleDestination;
    (globalThis as any).callParameters = [];
  });

  afterEach(() => {
    delete (globalThis as any).item;
    delete (globalThis as any).callParameters;
  });

  it('it should fan out properties', () => {
    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'item',
          operators: [
            { name: 'fan-out', properties: ['left-hand', 'right-hand', 'list'] },
            { name: 'flatten' },
          ],
          destination: 'globalThis.handleDestination',
          monitor: false,
        },
      ],
      readOnLoad: true,
    });
    expect(observer).to.not.be.undefined;
    const callParams: object[] = (globalThis as any).callParameters;
    expect(callParams.length).to.equal(4);
    // @ts-ignore
    expect(callParams[0][0].index).to.equal(true);
    // @ts-ignore
    expect(callParams[1][0].middle).to.equal(false);
    // @ts-ignore
    expect(callParams[2][0].eenie).to.equal('meenie');
    // @ts-ignore
    expect(callParams[3][0].minie).to.equal('moe');
  });
});
