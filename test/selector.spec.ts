/* eslint-disable no-new */
import { expect } from 'chai';
import 'mocha';

import { select, validate, Path } from '../src/selector';

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
    bool: false,
    'dot.prop': '1.0',
  },
  cities: ['Seattle', 'Atlanta', 'San Francisco', 'New York City'],
  gtmEvent: { event: 'gtm.dom' },
  myEvent: { event: 'myEvent' },
};

describe('test selection paths', () => {
  it('should parse valid paths and throw exceptions for invalid paths', () => {
    // Empty
    expect(() => { new Path(''); }).to.throw(Error);
    expect(() => { new Path('   '); }).to.throw(Error);
    expect(() => { new Path('\t'); }).to.throw(Error);
    expect(() => { new Path('\n'); }).to.throw(Error);

    // Pluck
    expect(() => { new Path('favorites'); }).to.not.throw();
    expect(() => { new Path('favorites.color'); }).to.not.throw();
    expect(() => { new Path('favorites.color.films'); }).to.not.throw();
    expect(() => { new Path('.'); }).to.throw(Error);
    expect(() => { new Path('..'); }).to.throw(Error);
    expect(() => { new Path('favorites..films'); }).to.throw(Error);
    expect(() => { new Path('favorites.'); }).to.throw(Error);
    expect(() => { new Path('.favorites.films'); }).to.throw(Error);

    // Index
    expect(() => { new Path('cities[0]'); }).to.not.throw();
    expect(() => { new Path('cities[1]'); }).to.not.throw();
    expect(() => { new Path('cities[-2]'); }).to.not.throw();
    expect(() => { new Path('favorites.cities[-2]'); }).to.not.throw();
    expect(() => { new Path('favorites.cities[-2].neighborhoods'); }).to.not.throw();
    expect(() => { new Path('[0]'); }).to.throw(Error);
    expect(() => { new Path('[]'); }).to.throw(Error);
    expect(() => { new Path('cities[]'); }).to.throw(Error);
    expect(() => { new Path('cities[\'luna\']'); }).to.throw(Error);
    expect(() => { new Path('favorites.cities[].neighborhoods'); }).to.throw(Error);

    // Pick
    expect(() => { new Path('films[(action)]'); }).to.not.throw();
    expect(() => { new Path('films[(action,adventure,dot.prop)]'); }).to.not.throw();
    expect(() => { new Path('films[(action, adventure)]'); }).to.not.throw();
    expect(() => { new Path('films[(action)].credits'); }).to.not.throw();
    expect(() => { new Path('films[()]'); }).to.throw(Error);

    // Omit
    expect(() => { new Path('films[!(action)]'); }).to.not.throw();
    expect(() => { new Path('films[!(action,adventure,dot.prop)]'); }).to.not.throw();
    expect(() => { new Path('films[!(action, adventure)]'); }).to.not.throw();
    expect(() => { new Path('films[!(dot.prop)]'); }).to.not.throw();
    expect(() => { new Path('films[!()]'); }).to.throw(Error);
    expect(() => { new Path('films[!]'); }).to.throw(Error);

    // Prefix
    expect(() => { new Path('films[^(act)]'); }).to.not.throw();
    expect(() => { new Path('films[^(act,adventure,dot.)]'); }).to.not.throw();
    expect(() => { new Path('films[^(act, adventure)]'); }).to.not.throw();
    expect(() => { new Path('films[^(dot.)]'); }).to.not.throw();
    expect(() => { new Path('films[^()]'); }).to.throw(Error);
    expect(() => { new Path('films[^]'); }).to.throw(Error);

    // Suffix
    expect(() => { new Path('films[$(act)]'); }).to.not.throw();
    expect(() => { new Path('films[$(act,adventure,.prop)]'); }).to.not.throw();
    expect(() => { new Path('films[$(act, adventure)]'); }).to.not.throw();
    expect(() => { new Path('films[$()]'); }).to.throw(Error);
    expect(() => { new Path('films[$]'); }).to.throw(Error);

    // Filter
    expect(() => { new Path('films[?(act)]'); }).to.not.throw();
    expect(() => { new Path('films[?(act,adventure,dot.prop)]'); }).to.not.throw();
    expect(() => { new Path('films[?(act, adventure)]'); }).to.not.throw();
    expect(() => { new Path('films[?(action=Armageddon, adventure)]'); }).to.not.throw();
    expect(() => { new Path('films[?(action, adventure=Atomic Blonde)]'); }).to.not.throw();
    expect(() => { new Path('films[?(dot.prop=1.0)]'); }).to.not.throw();
    expect(() => { new Path('films[?()]'); }).to.throw(Error);
    expect(() => { new Path('films[?]'); }).to.throw(Error);
    expect(() => { new Path('myEvent[?(event!^gtm.)]'); }).to.not.throw();

    expect(validate('favorites.films.action')).to.be.true;
    expect(validate('.')).to.be.false;
  });

  it('should respect dot notation', () => {
    expect(select('favorites', testData)).to.eq(testData.favorites);
    expect(select('favorites.color', testData)).to.eq('red');
    expect(select('favorites.films.action', testData)).to.eq('Rogue One');
  });

  it('dot notation should return a reference to the object', () => {
    expect(select('favorites', testData)).to.eq(testData.favorites);
  });

  it('should respect index notation', () => {
    expect(select('cities[0]', testData)).to.eq('Seattle');
    expect(select('cities[1]', testData)).to.eq('Atlanta');
    expect(select('cities[-1]', testData)).to.eq('New York City');
    expect(select('cities[-2]', testData)).to.eq('San Francisco');
    expect(select('cities[20]', testData)).to.eq(undefined);
    expect(select('cities[-20]', testData)).to.eq(undefined);
  });

  it('should respect pick notation', () => {
    expect(select('favorites[(color)]', testData).color).to.eq('red');
    expect(select('favorites[(color)]', testData).number).to.be.undefined;
    expect(select('favorites[(dot.prop)]', testData)['dot.prop']).to.eq('1.0');
    expect(select('favorites[(color,number)]', testData).color).to.eq('red');
    expect(select('favorites[(color,number)]', testData).number).to.eq(25);
    expect(select('favorites[(color,dot.prop)]', testData)['dot.prop']).to.eq('1.0');
    expect(select('favorites[(color,number)]', testData).pickle).to.be.undefined;
    expect(select('favorites[(color, number)]', testData).color).to.eq('red');
    expect(select('favorites[(color, number)]', testData).number).to.eq(25);
    expect(select('favorites[(color, number)]', testData).pickle).to.be.undefined;
    expect(select('favorites[(color, number, bogus)]', testData).bogus).to.be.undefined;
    expect(select('favorites[(totally, bogus)]', testData)).to.be.undefined;
  });

  it('pick notation should return a new object', () => {
    expect(select('favorites.films[(action,adventure,rom com)]', testData)).to.not.eq(testData.favorites.films);
    expect(select('favorites.films[(action,adventure,rom com)]', testData)).to.eql(testData.favorites.films);
  });

  it('should respect omit notation', () => {
    expect(select('favorites[!(color)]', testData).color).to.be.undefined;
    expect(select('favorites[!(color)]', testData).number).to.eq(25);
    expect(select('favorites[!(color)]', testData).pickle).to.eq('dill');
    expect(select('favorites[!(dot.prop)]', testData)['dot.prop']).to.be.undefined;
    expect(select('favorites[!(color, number)]', testData).color).to.be.undefined;
    expect(select('favorites[!(color, number)]', testData).number).to.be.undefined;
    expect(select('favorites[!(color, number)]', testData).pickle).to.eq('dill');
  });

  it('omit notation should return a new object', () => {
    expect(select('favorites.films[!(rom com)]', testData)).to.not.eq(testData.favorites.films);

    const { action, adventure } = testData.favorites.films;
    expect(select('favorites.films[!(rom com)]', testData)).to.eql({ action, adventure });
  });

  it('should respect prefix notation', () => {
    expect(select('favorites[^(color)]', testData).color).to.eq('red');
    expect(select('favorites[^(co)]', testData).color).to.eq('red');
    expect(select('favorites[^(dot.)]', testData)['dot.prop']).to.eq('1.0');
    expect(select('favorites[^(colr)]', testData)).to.be.undefined;
    expect(select('favorites[^(bogus)]', testData)).to.be.undefined;
    expect(select('favorites[^(bogus, col)]', testData).color).to.eq('red');
    expect(select('favorites[^(bogus, col)]', testData).bogus).to.be.undefined;
    expect(select('favorites[^(col, bogus)]', testData).color).to.eq('red');
    expect(select('favorites[^(col, bogus)]', testData).bogus).to.be.undefined;
  });

  it('prefix notation should return a new object', () => {
    expect(select('favorites.films[^(a)]', testData)).to.not.eq(testData.favorites.films);

    const { action, adventure } = testData.favorites.films;
    expect(select('favorites.films[^(a)]', testData)).to.eql({ action, adventure });
  });

  it('should respect suffix notation', () => {
    expect(select('favorites[$(color)]', testData).color).to.eq('red');
    expect(select('favorites[$(.prop)]', testData)['dot.prop']).to.eq('1.0');
    expect(select('favorites[$(olor)]', testData).color).to.eq('red');
    expect(select('favorites[$(clor)]', testData)).to.be.undefined;
    expect(select('favorites[$(bogus)]', testData)).to.be.undefined;
    expect(select('favorites[$(bogus, olor)]', testData).color).to.eq('red');
    expect(select('favorites[$(bogus, olor)]', testData).bogus).to.be.undefined;
    expect(select('favorites[$(olor, bogus)]', testData).color).to.eq('red');
    expect(select('favorites[$(olor, bogus)]', testData).bogus).to.be.undefined;
  });

  it('suffix notation should return a new object', () => {
    expect(select('favorites.films[$(n,e)]', testData)).to.not.eq(testData.favorites.films);

    const { action, adventure } = testData.favorites.films;
    expect(select('favorites.films[$(n,e)]', testData)).to.eql({ action, adventure });
  });

  it('should respect filter notation', () => {
    expect(select('favorites[?(color)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(bogus)]', testData)).to.be.undefined;
    expect(select('favorites[?(color=red)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(color=red)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(dot.prop)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(dot.prop=1.0)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(dot.prop=2.0)]', testData)).to.be.undefined;
    expect(select('favorites[?(bogus=totally)]', testData)).to.be.undefined;
    expect(select('favorites[?(bogus=undefined)]', testData)).to.not.be.undefined;
    expect(select('favorites[?(bogus!=undefined)]', testData)).to.be.undefined;
    expect(select('favorites[?(color, number)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(bogus, number)]', testData)).to.be.undefined;
    expect(select('favorites[?(color=red, number)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(bogus=totally, number)]', testData)).to.be.undefined;
    expect(select('favorites[?(color, number=25)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(bogus, number=25)]', testData)).to.be.undefined;
    expect(select('favorites[?(color=red, number=25)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(bogus=totally, number=25)]', testData)).to.be.undefined;
    expect(select('favorites[?(color=red, number=pi)]', testData)).to.be.undefined;
    expect(select('favorites[?(bool=true)]', testData)).to.be.undefined;
    expect(select('favorites[?(bool=false)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(number=25)]', testData)).to.eq(testData.favorites); // NOTE = is converted to ==
    expect(select('favorites[?(number==25)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(number===25)]', testData)).to.eq(testData.favorites); // NOTE === is converted to ==
    expect(select('favorites[?(number>25)]', testData)).to.be.undefined;
    expect(select('favorites[?(number>20)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(number>=25)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(number<10)]', testData)).to.be.undefined;
    expect(select('favorites[?(number<30)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(number<=25)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(number!=25)]', testData)).to.be.undefined;
    expect(select('favorites[?(number!=12)]', testData)).to.eq(testData.favorites);
    expect(select('favorites[?(number+=25)]', testData)).to.be.undefined;
    expect(select('gtmEvent[?(event!^gtm.)]', testData)).to.be.undefined;
    expect(select('gtmEvent[?(event=^gtm.)]', testData)).to.not.be.undefined;
    expect(select('myEvent[?(event!^gtm.)]', testData)).to.not.be.undefined;
    expect(select('myEvent[?(event=^gtm.)]', testData)).to.be.undefined;
    expect(select('myEvent[?(event=^my)]', testData)).to.not.be.undefined;
    expect(select('favorites[?(missing=^my)]', testData)).to.be.undefined;
  });

  it('filter notation should return a reference to the object', () => {
    expect(select('favorites.films[?(action=Rogue One)]', testData)).to.eq(testData.favorites.films);
  });
});
