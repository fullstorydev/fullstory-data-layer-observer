import { expect } from 'chai';
import 'mocha';

import { OperatorFactory } from '../src/factory';
import { deepClone } from '../src/utils/object';

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

describe('convert operator nested object unit tests', () => {
  it('it should not change the original object', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      { name: 'convert', enumerate: true, maxDepth: 3 });
    operator.handleData([cloned])!;
    expect(cloned).to.deep.eq(test);
  });

  it('it should honor default maxDepth of 1', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested).to.deep.eq(test.nested);
  });

  it('it should honor maxDepth specified under amount', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert', { name: 'convert', enumerate: true, maxDepth: 2 });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested).to.deep.eq(test.nested);
  });

  it('it should work on values with settings correct ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      { name: 'convert', enumerate: true, maxDepth: 3 });
    const [int] = operator.handleData([cloned])!;

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

  it('it should work even with maxDepth set too large ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      { name: 'convert', enumerate: true, maxDepth: 10 });
    const [int] = operator.handleData([cloned])!;

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
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, preserveArray: true, maxDepth: 3,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.salePrice).to.deep.eq([24.99]);
    expect(int.nested.item.discountTiers).to.deep.eq([24.99, 19.99, 12.99]);
  });

  it('it should convert to int', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: 'quantity', type: 'int', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    // the rest should be identical
    delete cloned.nested.item.quantity;
    delete int.nested.item.quantity;
    expect(cloned).to.deep.eq(int);
  });

  it('it should convert to real', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: ['price', 'tax'], type: 'real', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.price).to.eq(29.99);
    expect(int.nested.item.tax).to.eq(1.99);
    // the rest should be identical
    delete cloned.nested.item.price;
    delete cloned.nested.item.tax;
    delete int.nested.item.price;
    delete int.nested.item.tax;
    expect(cloned).to.deep.eq(int);
  });

  it('it should convert to bool', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: 'available', type: 'bool', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.available).to.eq(false);
    // the rest should be identical
    delete cloned.nested.item.available;
    delete int.nested.item.available;
    expect(cloned).to.deep.eq(int);
  });

  it('it should convert to string', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: 'size', type: 'string', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.size).to.eq('5');
    // the rest should be identical
    delete cloned.nested.item.size;
    delete int.nested.item.size;
    expect(cloned).to.deep.eq(int);
  });

  it('it should convert to date', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: 'saleDate,tax', type: 'date', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.saleDate.getTime()).to.eq(new Date('12-26-2020').getTime());
    // the rest should be identical, skipping tax as it is not a date
    delete cloned.nested.item.saleDate;
    delete int.nested.item.saleDate;
    expect(cloned).to.deep.eq(int);
  });

  it('it should convert all properties using *', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: '*', type: 'int', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    expect(int.nested.item.stock).to.eq(10);
    expect(int.nested.item.price).to.eq(29.99);
    expect(int.nested.item.tax).to.eq(1.99);
    expect(int.nested.item.empty).to.eq(0);
    expect(int.nested.item.salePrice).to.deep.eq([24.99]);
    expect(int.nested.item.discountTiers).to.deep.eq([24.99, 19.99, 12.99]);
    // the rest should be identical, skipping tax as it is not a date
    delete cloned.nested.item.quantity;
    delete cloned.nested.item.stock;
    delete cloned.nested.item.price;
    delete cloned.nested.item.salePrice;
    delete cloned.nested.item.tax;
    delete cloned.nested.item.discountTiers;
    delete cloned.nested.item.empty;
    delete int.nested.item.quantity;
    delete int.nested.item.stock;
    delete int.nested.item.price;
    delete int.nested.item.salePrice;
    delete int.nested.item.tax;
    delete int.nested.item.discountTiers;
    delete int.nested.item.empty;
    expect(cloned).to.deep.eq(int);
  });

  it('it should not convert unsupported types', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: 'size', type: 'array', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(cloned).to.deep.eq(int);
  });

  it('it should convert an object at a specific index', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', index: 1, properties: 'quantity', type: 'int', maxDepth: 3, preserveArray: true,
      });
    const [first, int, third] = operator.handleData(['Test', cloned, 'Another Test'])!;

    expect(first).to.not.be.null;
    expect(int).to.not.be.null;
    expect(third).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    expect(first).to.eq('Test');
    expect(third).to.eq('Another Test');

    // the rest should be identical
    delete cloned.nested.item.quantity;
    delete int.nested.item.quantity;
    expect(cloned).to.deep.eq(int);
  });

  it('it should convert a list to a list of a single converted value', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: 'salePrice', type: 'real', maxDepth: 3, preserveArray: true,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.salePrice).to.deep.eq([24.99]);

    // the rest should be identical
    delete cloned.nested.item.salePrice;
    delete int.nested.item.salePrice;
    expect(cloned).to.deep.eq(int);
  });

  it('it should skip a single ignored property ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, ignore: 'price', maxDepth: 3,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    expect(int.nested.item.stock).to.eq(10);
    expect(int.nested.item.price).to.eq('29.99');
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

  it('it should skip  multiple ignored properties with an array ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, ignore: ['stock', 'quantity'], maxDepth: 3,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq('10');
    expect(int.nested.item.stock).to.eq('10');
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

  it('it should skip multiple ignored properties with a comma ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, ignore: 'tax,price', maxDepth: 3,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    expect(int.nested.item.stock).to.eq(10);
    expect(int.nested.item.price).to.eq('29.99');
    expect(int.nested.item.tax).to.eq('1.99');
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

  it('it should skip non matching ignore properties ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, ignore: 'fake,tax,price', maxDepth: 3,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    expect(int.nested.item.stock).to.eq(10);
    expect(int.nested.item.price).to.eq('29.99');
    expect(int.nested.item.tax).to.eq('1.99');
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

  it('it should convert suffixed properties ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, ignoreSuffixed: false, maxDepth: 3,
      });
    const [int] = operator.handleData([cloned])!;

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
    expect(int.nested.item.forced_str).to.eq(12345);
    expect(int.nested.item.salePrice).to.deep.eq(24.99);
    expect(int.nested.item.discountTiers).to.deep.eq([24.99, 19.99, 12.99]);
    expect(int.nested.item.promoCodes).to.deep.eq(['', 'bogo', 'july4th']);
  });

  it('it should convert specific properties as well as enumerate ', () => {
    const cloned = deepClone(test);
    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', enumerate: true, properties: 'available', type: 'bool', maxDepth: 3,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    expect(int.nested.item.quantity).to.eq(10);
    expect(int.nested.item.stock).to.eq(10);
    expect(int.nested.item.price).to.eq(29.99);
    expect(int.nested.item.tax).to.eq(1.99);
    expect(int.nested.item.available).to.eq(false);
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

  it('it should work on array of objects with settings correct ', () => {
    const cloned = {
      nested: [deepClone(test.nested), deepClone(test.nested), deepClone(test.nested)],
    };

    const operator = OperatorFactory.create('convert',
      { name: 'convert', enumerate: true, maxDepth: 3 });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;

    // eslint-disable-next-line no-plusplus
    for (let x = 0; x < 3; x++) {
      expect(int.nested[x].item.quantity).to.eq(10);
      expect(int.nested[x].item.stock).to.eq(10);
      expect(int.nested[x].item.price).to.eq(29.99);
      expect(int.nested[x].item.tax).to.eq(1.99);
      expect(int.nested[x].item.available).to.eq('false');
      expect(int.nested[x].item.size).to.eq(5);
      expect(int.nested[x].item.type).to.eq(true);
      expect(int.nested[x].item.empty).to.eq('');
      expect(int.nested[x].item.saleDate).to.eq('12-26-2020');
      expect(int.nested[x].item.vat).to.eq(null);
      expect(int.nested[x].item.forced_str).to.eq('12345');
      expect(int.nested[x].item.salePrice).to.deep.eq(24.99);
      expect(int.nested[x].item.discountTiers).to.deep.eq([24.99, 19.99, 12.99]);
      expect(int.nested[x].item.promoCodes).to.deep.eq(['', 'bogo', 'july4th']);
    }
  });

  it('it should work on a deeper array of objects with specific properties ', () => {
    const cloned = deepClone(test);
    // @ts-ignore
    cloned.nested.anotherElement.deepNested = [
      { deepTest: '1', noConvert: '1' },
      { deepTest: '2', noConvert: '2' },
      { deepTest: '3', noConvert: '3' },
    ];

    const operator = OperatorFactory.create('convert',
      {
        name: 'convert', properties: 'deepTest', type: 'int', maxDepth: 4,
      });
    const [int] = operator.handleData([cloned])!;

    expect(int).to.not.be.null;
    // eslint-disable-next-line no-plusplus
    for (let x = 1; x < 4; x++) {
      expect(int.nested.anotherElement.deepNested[x - 1].deepTest).to.eq(x);
      expect(int.nested.anotherElement.deepNested[x - 1].noConvert).to.eq(`${x}`);
    }
  });
});
