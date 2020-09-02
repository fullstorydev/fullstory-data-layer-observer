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

describe('fan out operator unit tests', () => {
  beforeEach(() => {
    (globalThis as any).item = deepcopy(item);
  });

  afterEach(() => {
    delete (globalThis as any).item;
  });

  it('it should fan out properties', () => {
    const callParameters: any[] = [];

    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'item',
          operators: [
            { name: 'fan-out', properties: ['left-hand', 'right-hand', 'list'] },
            { name: 'flatten' },
          ],
          destination: (...params: any[]) => {
            callParameters.push(params);
          },
          monitor: false,
        },
      ],
      readOnLoad: true,
    });
    expect(observer).to.not.be.undefined;
    expect(callParameters.length).to.equal(4);
    // @ts-ignore
    expect(callParameters[0][0].index).to.equal(true);
    // @ts-ignore
    expect(callParameters[1][0].middle).to.equal(false);
    // @ts-ignore
    expect(callParameters[2][0].eenie).to.equal('meenie');
    // @ts-ignore
    expect(callParameters[3][0].minie).to.equal('moe');
  });

  it('it should fan out arrays without properties', () => {
    const callParameters: any[] = [];

    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'item.list',
          operators: [
            { name: 'fan-out' },
          ],
          destination: (...params: any[]) => {
            callParameters.push(params);
          },
          monitor: false,
        },
      ],
      readOnLoad: true,
    });
    expect(observer).to.not.be.undefined;
    expect(callParameters.length).to.equal(2);
    // @ts-ignore
    expect(callParameters[0][0].eenie).to.equal('meenie');
    // @ts-ignore
    expect(callParameters[1][0].minie).to.equal('moe');
  });

  it('it should fan out objects without properties', () => {
    const callParameters: any[] = [];

    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'item',
          operators: [
            { name: 'fan-out' },
            { name: 'flatten' },
          ],
          destination: (...params: any[]) => {
            callParameters.push(params);
          },
          monitor: false,
        },
      ],
      readOnLoad: true,
    });
    expect(observer).to.not.be.undefined;
    expect(callParameters.length).to.equal(4);
    // @ts-ignore
    expect(callParameters[0][0].index).to.equal(true);
    // @ts-ignore
    expect(callParameters[1][0].middle).to.equal(false);
    // @ts-ignore
    expect(callParameters[2][0].eenie).to.equal('meenie');
    // @ts-ignore
    expect(callParameters[3][0].minie).to.equal('moe');
  });

  it('it should handle string properties', () => {
    const callParameters: any[] = [];

    const observer = new DataLayerObserver({
      rules: [
        {
          source: 'item',
          operators: [
            { name: 'fan-out', properties: 'left-hand, right-hand,list' },
            { name: 'flatten' },
          ],
          destination: (...params: any[]) => {
            callParameters.push(params);
          },
          monitor: false,
        },
      ],
      readOnLoad: true,
    });
    expect(observer).to.not.be.undefined;
    expect(callParameters.length).to.equal(4);
    // @ts-ignore
    expect(callParameters[0][0].index).to.equal(true);
    // @ts-ignore
    expect(callParameters[1][0].middle).to.equal(false);
    // @ts-ignore
    expect(callParameters[2][0].eenie).to.equal('meenie');
    // @ts-ignore
    expect(callParameters[3][0].minie).to.equal('moe');
  });
});
