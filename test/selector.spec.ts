import { expect } from 'chai';
import 'mocha';

import { select, validate, Path } from '../src/selector';

const testData = {
  favorites: {
    color: 'red',
    number: 25,
    films: {
      action: 'Armageddon',
      'rom com': "Isn't it romantic"
    }
  },
  cities: ['Seattle', 'Atlanta', 'San Francisco', 'New York City']
}

describe('test selection paths', () => {

  it('should parse valid paths and throw exceptions for invalid paths', () => {
    // Empty
    expect(() => { new Path('') }).to.throw(Error);
    expect(() => { new Path('   ') }).to.throw(Error);

    // Pluck
    expect(() => { new Path('favorites') }).to.not.throw();
    expect(() => { new Path('favorites.color') }).to.not.throw();
    expect(() => { new Path('favorites.color.films') }).to.not.throw();
    expect(() => { new Path('.') }).to.throw(Error);
    expect(() => { new Path('..') }).to.throw(Error);
    expect(() => { new Path('favorites..films') }).to.throw(Error);
    expect(() => { new Path('favorites.') }).to.throw(Error);
    expect(() => { new Path('.favorites.films') }).to.throw(Error);

    // Index
    expect(() => { new Path('cities[0]') }).to.not.throw();
    expect(() => { new Path('cities[1]') }).to.not.throw();
    expect(() => { new Path('cities[-2]') }).to.not.throw();
    expect(() => { new Path('favorites.cities[-2]') }).to.not.throw();
    expect(() => { new Path('favorites.cities[-2].neighborhoods') }).to.not.throw();
    expect(() => { new Path('[0]') }).to.throw(Error);
    expect(() => { new Path('[]') }).to.throw(Error);
    expect(() => { new Path('cities[]') }).to.throw(Error);
    expect(() => { new Path('favorites.cities[].neighborhoods') }).to.throw(Error);

    // Pick
    expect(() => { new Path('films[(action)]') }).to.not.throw();
    expect(() => { new Path('films[()]') }).to.throw(Error);

    expect(validate('favorites.films.action')).to.be.true;
    expect(validate('.')).to.be.false;
  });

  it('should respect dot notation', () => {
    expect(select('favorites', testData)).to.eq(testData.favorites);
    expect(select('favorites.color', testData)).to.eq('red');
    expect(select('favorites.films.action', testData)).to.eq('Armageddon');
  });

  it('should respect index notation', () => {
    expect(select('cities[0]', testData)).to.eq('Seattle');
    expect(select('cities[1]', testData)).to.eq('Atlanta');
    expect(select('cities[-1]', testData)).to.eq('New York City');
    expect(select('cities[-2]', testData)).to.eq('San Francisco');
    expect(select('cities[20]', testData)).to.eq(undefined);
    expect(select('cities[-20]', testData)).to.eq(undefined);
  });

});