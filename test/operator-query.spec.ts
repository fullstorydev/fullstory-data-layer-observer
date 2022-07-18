import { expect } from 'chai';
import 'mocha';

import { QueryOperator } from '../src/operators';
import { OperatorFactory } from '../src/factory';

const testData = {
  favorites: {
    color: 'red',
    number: 25,
    pickle: 'dill',
    films: {
      action: 'Rogue One',
      adventure: 'Atomic Blonde',
      'rom com': "Isn't it romantic",
    },
  },
  cities: ['Seattle', 'Atlanta', 'San Francisco', 'New York City'],
  nullProperty: null,
};

describe('query operator unit tests', () => {
  it('it should validate options', () => {
    expect(() => new QueryOperator({
      name: 'query', select: '$.profileInfo',
    }).validate()).to.not.throw();

    expect(() => new QueryOperator({
      name: 'query', select: '$.profileInfo', index: 1,
    }).validate()).to.not.throw();

    expect(() => new QueryOperator({
      name: 'query', select: '[profileInfo]',
    }).validate()).to.throw();

    // @ts-ignore
    expect(() => new QueryOperator({
      name: 'query', index: 1,
    }).validate()).to.throw();
  });

  it('it should query by selector at the 0 index by default', () => {
    const operator = OperatorFactory.create('query', { name: 'query', select: '$.cities' });
    const [selection] = operator.handleData([testData])!;

    expect(selection).to.not.be.null;
    expect(selection).to.eq(testData.cities);
  });

  it('it should query by selector at a specific index', () => {
    const operator = OperatorFactory.create('query', { name: 'query', select: '$.cities', index: 1 });
    const [selection] = operator.handleData(['Profile Update', testData])!;

    expect(selection).to.not.be.null;
    expect(selection).to.eq(testData.cities);
  });

  it('it should pick properties', () => {
    const operator = OperatorFactory.create('query', { name: 'query', select: '$[(color,number,pickle)]' });
    const [selection] = operator.handleData([testData.favorites])!;

    expect(selection).to.not.be.null;
    expect(selection.color).to.eq(testData.favorites.color);
    expect(selection.number).to.eq(testData.favorites.number);
    expect(selection.pickle).to.eq(testData.favorites.pickle);
  });

  it('it should return null for empty query results', () => {
    const operator = new QueryOperator({ name: 'query', select: '$.missing' });
    expect(operator.handleData([testData.favorites])).to.be.null;
  });

  it('it should gracefully handle null selector', () => {
    const operator = new QueryOperator({ name: 'query', select: '$.nullProperty.doesNotExist' });
    expect(operator.handleData([testData])).to.be.null;
  });
});
