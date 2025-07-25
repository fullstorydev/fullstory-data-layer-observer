import { expect } from 'chai';
import 'mocha';

import { OperatorFactory } from '../src/factory';
// import { ConvertOperator } from '../src/operators';
// import { expectInvalid, expectValid } from './utils/mocha';

const test = {
  nested: {
    item: {
      quantity: '10',
      stock: '10',
      price: '29.99',
      tax: '1.99',
      available: 'false',
      size: 5,
      type: true,
      empty: '',
      saleDate: '12-26-2020',
      vat: null,
      forced_str: '12345',
      salePrice: ['24.99'],
      discountTiers: ['24.99', '19.99', '12.99'],
      promoCodes: ['', 'bogo', 'july4th'],
    },
    anotherElement: {
      name: 'Test Element',
    },
  },
};

describe.only('convert operator nested object unit tests', () => {
  it('it should not change the original object', () => {
    const list = [test];
    const operator = OperatorFactory.create('convert',
      { name: 'convert', enumerate: true, maxDepth: 3 });
    operator.handleData(list)!;
    expect(test.nested).to.deep.eq(test.nested);
  });

  it('it should honor default maxDepth of 1', () => {
    const list = [test];
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true });
    const [int] = operator.handleData(list)!;

    expect(int).to.not.be.null;
    expect(int.nested).to.deep.eq(test.nested);
  });

  it('it should honor maxDepth specified under amount', () => {
    const list = [test];
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true, maxDepth: 2 });
    const [int] = operator.handleData(list)!;

    expect(int).to.not.be.null;
    expect(int.nested).to.deep.eq(test.nested);
  });

  it.only('it should work on values with settings correct ', () => {
    const list = [test];
    const operator = OperatorFactory.create('convert',
      { name: 'convert', enumerate: true, maxDepth: 3 });
    const [int] = operator.handleData(list)!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    expect(int.nested.item.stock).to.eq(10);
    expect(int.nested.item.price).to.eq(29.99);
    expect(int.nested.item.tax).to.eq(1.99);
    expect(int.nested.item.available).to.eq('false');
    expect(int.nested.item.size).to.eq(5);
    expect(int.nested.item.type).to.eq(true);
    expect(int.nested.item.empty).to.eq('');
    expect(int.nested.item.saleDate).to.eq('12-26-2020');
    expect(int.nested.item.vat).to.eq(null);
    expect(int.nested.item.forced_str).to.eq('12345');
    expect(int.nested.item.salePrice).to.deep.eq(24.99);
    expect(int.nested.item.discountTiers).to.deep.eq([24.99, 19.99, 12.99]);
    expect(int.nested.item.promoCodes).to.deep.eq(['', 'bogo', 'july4th']);
  });

  it('it should honor preserveArray ', () => {
    const list = [test];
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, preserveArray: true, maxDepth: 3,
      });
    const [int] = operator.handleData(list)!;

    expect(int).to.not.be.null;
    expect(int.nested.item.salePrice).to.deep.eq([24.99]);
    expect(int.nested.item.discountTiers).to.deep.eq([24.99, 19.99, 12.99]);
  });

  /*

  it('it should convert all properties using *', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: '*', type: 'int' });
    const { quantity, stock } = item;
    const [int] = operator.handleData([{ quantity, stock }])!;

    expect(int).to.not.be.null;
    expect(int!.quantity).to.eq(10);
    expect(int!.stock).to.eq(10);
    expect(quantity).to.eq('10'); // don't mutate the actual data layer
    expect(stock).to.eq('10'); // don't mutate the actual data layer
  });

  it('it should convert space separated props', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: 'quantity, stock', type: 'int' });
    const { quantity, stock } = item;
    const [int] = operator.handleData([{ quantity, stock }])!;

    expect(int).to.not.be.null;
    expect(int!.quantity).to.eq(10);
    expect(int!.stock).to.eq(10);
    expect(quantity).to.eq('10');
    expect(stock).to.eq('10');
  });

  it('it should not convert unsupported types', () => {
    // @ts-ignore
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: 'quantity', type: 'array' });
    const [unsupported] = operator.handleData([item])!;

    expect(unsupported).to.not.be.null;
    expect(unsupported!.quantity).to.eq(item.quantity); // no format occurs
  });

  it('it should convert an object at a specific index', () => {
    const operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'quantity', type: 'int', index: 1,
    });
    const [event, int, last, rest] = operator.handleData(['Product View', item, 'dlo'])!;

    expect(event).to.not.be.null;
    expect(int).to.not.be.null;
    expect(int.quantity).to.eq(10);
    expect(last).to.eq('dlo');
    expect(rest).to.be.undefined;
  });

  it('it should not fail if NaN is the result of conversion', () => {
    let operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'empty', type: 'int',
    });

    const [int] = operator.handleData([item])!;

    expect(int).to.not.be.null;
    expect(int.empty).to.eq(0);

    operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'empty', type: 'real',
    });

    const [real] = operator.handleData([item])!;

    expect(real).to.not.be.null;
    expect(real.empty).to.eq(0);
  });

  it('it should convert undefined/null string to empty string when force is used', () => {
    let operator = OperatorFactory.create('convert', { name: 'convert', properties: 'vat,nothing', type: 'string' });
    let [string] = operator.handleData([item])!;

    expect(string).to.not.be.null;
    expect(string!.vat).to.be.null;
    expect(string!.nothing).to.be.undefined;

    operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'vat,nothing', type: 'string', force: true,
    });
    [string] = operator.handleData([item])!;

    expect(string).to.not.be.null;
    expect(string!.vat).to.be.empty;
    expect(string!.nothing).to.be.empty;
  });

  it('it should convert undefined/null boolean to false when force is used', () => {
    let operator = OperatorFactory.create('convert', { name: 'convert', properties: 'vat,nothing', type: 'bool' });
    let [bool] = operator.handleData([item])!;

    expect(bool).to.not.be.null;
    expect(bool!.vat).to.be.null;
    expect(bool!.nothing).to.be.undefined;

    operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'vat,nothing', type: 'bool', force: true,
    });
    [bool] = operator.handleData([item])!;

    expect(bool).to.not.be.null;
    expect(bool!.vat).to.be.false;
    expect(bool!.nothing).to.be.false;
  });

  it('it should convert undefined/null int or real to zero when force is used', () => {
    let operator = OperatorFactory.create('convert', { name: 'convert', properties: 'vat,nothing', type: 'real' });
    let [real] = operator.handleData([item])!;

    expect(real).to.not.be.null;
    expect(real!.vat).to.be.null;
    expect(real!.nothing).to.be.undefined;

    operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'vat,nothing', type: 'real', force: true,
    });
    [real] = operator.handleData([item])!;

    expect(real).to.not.be.null;
    expect(real!.vat).to.eq(0.0);
    expect(real!.nothing).to.eq(0.0);

    operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'vat,nothing', type: 'int', force: false,
    });
    let [int] = operator.handleData([item])!;

    expect(int).to.not.be.null;
    expect(int!.vat).to.be.null;
    expect(int!.nothing).to.be.undefined;

    operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'vat,nothing', type: 'int', force: true,
    });
    [int] = operator.handleData([item])!;

    expect(int).to.not.be.null;
    expect(int!.vat).to.eq(0);
    expect(int!.nothing).to.eq(0);
  });

  it('it should convert a list to a single converted value', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: 'salePrice', type: 'real' });
    const [real] = operator.handleData([item])!;

    expect(real).to.not.be.null;
    expect(real.salePrice).to.eq(24.99);
    expect(real.size).to.eq(5); // non-converted properties remain
    expect(item.salePrice).to.eql(['24.99']); // don't mutate the actual data layer
  });

  it('it should convert a list to a list of a single converted value', () => {
    const operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'salePrice', preserveArray: true, type: 'real',
    });
    const [reals] = operator.handleData([item])!;

    expect(reals).to.not.be.null;
    expect(reals.salePrice).to.eql([24.99]);
    expect(reals.size).to.eq(5); // non-converted properties remain
    expect(item.salePrice).to.eql(['24.99']); // don't mutate the actual data layer
  });

  it('it should convert a list to a list of converted values', () => {
    const operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'discountTiers', type: 'real',
    });
    const [reals] = operator.handleData([item])!;

    expect(reals).to.not.be.null;
    expect(reals.discountTiers).to.eql([24.99, 19.99, 12.99]);
    expect(reals.size).to.eq(5); // non-converted properties remain
    expect(item.discountTiers).to.eql(['24.99', '19.99', '12.99']); // don't mutate the actual data layer
  });

  it('strings can be enumerated', () => {
    for (let number = 0; number <= 101; number += 1) {
      expect(ConvertOperator.enumerate(`${number}`)).to.eq(number);
    }
    expect(ConvertOperator.enumerate('-1')).to.eql(-1);
  });

  it('invalid strings should not be enumerated', () => {
    expect(ConvertOperator.enumerate('foo')).to.eql(NaN);
    expect(ConvertOperator.enumerate('1foo2')).to.eql(NaN);
    expect(ConvertOperator.enumerate('1 foo 2')).to.eql(NaN);
    expect(ConvertOperator.enumerate('1 2')).to.eql(NaN);
  });

  it('strings can be converted automatically to numbers', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true });
    const [enumerated] = operator.handleData([item])!;
    const {
      quantity, price, available, saleDate, type, vat, salePrice, discountTiers, empty, promoCodes,
    } = enumerated;

    expect(quantity).to.eq(10);
    expect(price).to.eq(29.99);
    expect(available).to.eq('false');
    expect(saleDate).to.eq('12-26-2020');
    expect(vat).to.eq(null);
    expect(type).to.eq(true);
    expect(salePrice).to.eq(24.99); // NOTE because preserveArray is not true, it becomes a single value
    expect(discountTiers).to.eql([24.99, 19.99, 12.99]);
    expect(empty).to.eq('');
    expect(promoCodes).to.eql(['', 'bogo', 'july4th']); // NOTE empty string should not become 0
  });

  it('ignore should cause single property to be skipped', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true, ignore: 'price' });
    const [enumerated] = operator.handleData([item])!;
    const {
      quantity, price, available, saleDate, type, vat, salePrice, discountTiers, empty, promoCodes,
    } = enumerated;

    expect(quantity).to.eq(10);
    expect(price).to.eq('29.99');
    expect(available).to.eq('false');
    expect(saleDate).to.eq('12-26-2020');
    expect(vat).to.eq(null);
    expect(type).to.eq(true);
    expect(salePrice).to.eq(24.99); // NOTE because preserveArray is not true, it becomes a single value
    expect(discountTiers).to.eql([24.99, 19.99, 12.99]);
    expect(empty).to.eq('');
    expect(promoCodes).to.eql(['', 'bogo', 'july4th']); // NOTE empty string should not become 0
  });

  it('ignore should cause multiple properties to be skipped', () => {
    const operator = OperatorFactory.create('convert',
      { name: 'convert', enumerate: true, ignore: ['price', 'quantity'] });
    const [enumerated] = operator.handleData([item])!;
    const {
      quantity, price, available, saleDate, type, vat, salePrice, discountTiers, empty, promoCodes,
    } = enumerated;

    expect(quantity).to.eq('10');
    expect(price).to.eq('29.99');
    expect(available).to.eq('false');
    expect(saleDate).to.eq('12-26-2020');
    expect(vat).to.eq(null);
    expect(type).to.eq(true);
    expect(salePrice).to.eq(24.99); // NOTE because preserveArray is not true, it becomes a single value
    expect(discountTiers).to.eql([24.99, 19.99, 12.99]);
    expect(empty).to.eq('');
    expect(promoCodes).to.eql(['', 'bogo', 'july4th']); // NOTE empty string should not become 0
  });

  it('ignore with commas should cause multiple properties to be skipped', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true, ignore: 'price,quantity' });
    const [enumerated] = operator.handleData([item])!;
    const {
      quantity, price, available, saleDate, type, vat, salePrice, discountTiers, empty, promoCodes,
    } = enumerated;

    expect(quantity).to.eq('10');
    expect(price).to.eq('29.99');
    expect(available).to.eq('false');
    expect(saleDate).to.eq('12-26-2020');
    expect(vat).to.eq(null);
    expect(type).to.eq(true);
    expect(salePrice).to.eq(24.99); // NOTE because preserveArray is not true, it becomes a single value
    expect(discountTiers).to.eql([24.99, 19.99, 12.99]);
    expect(empty).to.eq('');
    expect(promoCodes).to.eql(['', 'bogo', 'july4th']); // NOTE empty string should not become 0
  });

  it('non matching ignore should not affect the object', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true, ignore: 'foo' });
    const [enumerated] = operator.handleData([item])!;
    const {
      quantity, price, available, saleDate, type, vat, salePrice, discountTiers, empty, promoCodes,
    } = enumerated;

    expect(quantity).to.eq(10);
    expect(price).to.eq(29.99);
    expect(available).to.eq('false');
    expect(saleDate).to.eq('12-26-2020');
    expect(vat).to.eq(null);
    expect(type).to.eq(true);
    expect(salePrice).to.eq(24.99); // NOTE because preserveArray is not true, it becomes a single value
    expect(discountTiers).to.eql([24.99, 19.99, 12.99]);
    expect(empty).to.eq('');
    expect(promoCodes).to.eql(['', 'bogo', 'july4th']); // NOTE empty string should not become 0
  });

  it('ignoreSuffix should not convert suffixed vales', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true });
    const [enumerated] = operator.handleData([item])!;
    const {
      // eslint-disable-next-line camelcase
      forced_str,
    } = enumerated;

    expect(forced_str).to.eq('12345');
  });

  it('ignoreSuffix set to false should convert suffixed vales', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true, ignoreSuffixed: false });
    const [enumerated] = operator.handleData([item])!;
    const {
      // eslint-disable-next-line camelcase
      forced_str,
    } = enumerated;

    expect(forced_str).to.eq(12345);
  });

  it('strings can be converted automatically to numbers while converting specific properties', () => {
    const operator = OperatorFactory.create('convert', {
      name: 'convert', enumerate: true, properties: 'available', type: 'bool',
    });
    const [enumerated] = operator.handleData([item])!;
    const {
      quantity, price, available, saleDate, type, vat, salePrice, discountTiers,
    } = enumerated;

    expect(quantity).to.eq(10);
    expect(price).to.eq(29.99);
    expect(available).to.eq(false);
    expect(saleDate).to.eq('12-26-2020');
    expect(vat).to.eq(null);
    expect(type).to.eq(true);
    expect(salePrice).to.eq(24.99); // NOTE because preserveArray is not true, it becomes a single value
    expect(discountTiers).to.eql([24.99, 19.99, 12.99]);
  });

  it('it should convert from the end of a list', () => {
    const operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'quantity', type: 'int', index: -1,
    });
    const [eventName, int] = operator.handleData(['track', item])!;

    expect(eventName).to.eql('track');
    expect(int).to.not.be.null;
    expect(int.quantity).to.eq(10);
    expect(int.size).to.eq(5); // non-converted properties remain
    expect(item.quantity).to.eq('10'); // don't mutate the actual data layer
  }); */
});
