import { expect } from 'chai';
import 'mocha';

import { OperatorFactory } from '../src/factory';
import { ConvertOperator } from '../src/operators';

const item = {
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
};

describe('convert operator unit tests', () => {
  it('it should validate options', () => {
    expect(() => new ConvertOperator({ name: 'convert', properties: 'quantity', type: 'int' }).validate())
      .to.not.throw();
    expect(() => new ConvertOperator({
      name: 'convert', properties: 'quantity', type: 'int', index: 1,
    }).validate())
      .to.not.throw();
    expect(() => new ConvertOperator({ name: 'convert', properties: 'price,tax', type: 'real' }).validate())
      .to.not.throw();
    expect(() => new ConvertOperator({ name: 'convert', properties: ['price', 'tax'], type: 'real' }).validate())
      .to.not.throw();
    // @ts-ignore
    expect(() => new ConvertOperator({ name: 'convert', properties: ['price', 'tax'], type: 'array' }).validate())
      .to.throw();
    // @ts-ignore
    expect(() => new ConvertOperator({ name: 'convert', type: 'array' }).validate())
      .to.throw();
    // @ts-ignore
    expect(() => new ConvertOperator({ name: 'convert', properties: 'quantity' }).validate())
      .to.throw();
  });

  it('it should convert to int', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: 'quantity', type: 'int' });
    const [int] = operator.handleData([item])!;

    expect(int).to.not.be.null;
    expect(int.quantity).to.eq(10);
    expect(int.size).to.eq(5); // non-converted properties remain
    expect(item.quantity).to.eq('10'); // don't mutate the actual data layer
  });

  it('it should convert to real', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: ['price', 'tax'], type: 'real' });
    const [reals] = operator.handleData([item])!;

    expect(reals).to.not.be.null;
    expect(reals!.price).to.eq(29.99);
    expect(reals!.tax).to.eq(1.99);
    expect(reals.type).to.eq(true); // non-converted properties remain
    expect(item.price).to.eq('29.99'); // don't mutate the actual data layer
    expect(item.tax).to.eq('1.99'); // don't mutate the actual data layer
  });

  it('it should convert to bool', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: 'available', type: 'bool' });
    const [bool] = operator.handleData([item])!;

    expect(bool).to.not.be.null;
    expect(bool!.available).to.eq(false);
    expect(bool.stock).to.eq('10'); // non-converted properties remain
    expect(item.available).to.eq('false'); // don't mutate the actual data layer
  });

  it('it should convert to string', () => {
    let operator = OperatorFactory.create('convert', { name: 'convert', properties: 'size', type: 'string' });
    const [stringInt] = operator.handleData([item])!;

    expect(stringInt).to.not.be.null;
    expect(stringInt.size).to.eq('5');
    expect(item.size).to.eq(5); // don't mutate the actual data layer

    operator = OperatorFactory.create('convert', { name: 'convert', properties: 'type', type: 'string' });
    const [stringBool] = operator.handleData([item])!;

    expect(stringBool).to.not.be.null;
    expect(stringBool.type).to.eq('true');
    expect(stringBool.tax).to.eq('1.99'); // non-converted properties remain
    expect(item.type).to.eq(true); // don't mutate the actual data layer
  });

  it('it should convert to date', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: 'saleDate,tax', type: 'date' });
    const [date] = operator.handleData([item])!;

    expect(date).to.not.be.null;
    expect(date!.saleDate.toString()).to.eq(new Date('12-26-2020').toString());
    expect(date.tax).to.eq(item.tax); // failed conversions should be the original value
    expect(date.stock).to.eq('10'); // non-converted properties remain
    expect(item.saleDate).to.eq('12-26-2020'); // don't mutate the actual data layer
  });

  it('it should convert CSV input', () => {
    const operator = OperatorFactory.create('convert', { name: 'convert', properties: 'quantity,stock', type: 'int' });
    const [int] = operator.handleData([item])!;

    expect(int).to.not.be.null;
    expect(int!.quantity).to.eq(10);
    expect(int!.stock).to.eq(10);
    expect(int.type).to.eq(true); // non-converted properties remain
    expect(item.quantity).to.eq('10'); // don't mutate the actual data layer
    expect(item.stock).to.eq('10'); // don't mutate the actual data layer
  });

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
    const [event, int] = operator.handleData(['Product View', item])!;

    expect(event).to.not.be.null;
    expect(int).to.not.be.null;
    expect(int.quantity).to.eq(10);
  });

  it('it should not fail if NaN is the result of conversion', () => {
    let operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'empty', type: 'int',
    });

    const [int] = operator.handleData([item])!;

    expect(int).to.not.be.null;
    expect(int.empty).to.eq(item.empty);

    operator = OperatorFactory.create('convert', {
      name: 'convert', properties: 'empty', type: 'real',
    });

    const [real] = operator.handleData([item])!;

    expect(real).to.not.be.null;
    expect(real.empty).to.eq(item.empty);
  });

  it('it should convert null int or real to zero', () => {
    let operator = OperatorFactory.create('convert', { name: 'convert', properties: 'vat,nothing', type: 'real' });
    const [real] = operator.handleData([item])!;

    expect(real).to.not.be.null;
    expect(real!.vat).to.eq(0.0);
    expect(real!.nothing).to.be.undefined;

    operator = OperatorFactory.create('convert', { name: 'convert', properties: 'vat,nothing', type: 'int' });
    const [int] = operator.handleData([item])!;

    expect(int).to.not.be.null;
    expect(int!.vat).to.eq(0);
    expect(int!.nothing).to.be.undefined;
  });
});
