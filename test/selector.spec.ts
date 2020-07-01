import { expect } from 'chai';
import 'mocha';

import { select, validate } from '../src/selector';

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

  it('it should respect dot notation', () => {
    expect(validate('favorites.films.action')).to.be.true;
    expect(select('favorites.films.action', testData)).to.eq('Armageddon');
  });

});