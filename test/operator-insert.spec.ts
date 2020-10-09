import { expect } from 'chai';
import 'mocha';

import { InsertOperator } from '../src/operators';

describe('insert operator unit tests', () => {
  it('it should validate options', () => {
    expect(() => new InsertOperator({
      name: 'insert', select: 'user.profile[0].profileID', defaultValue: 'user',
    }).validate()).to.not.throw();

    expect(() => new InsertOperator({
      name: 'insert', select: 'user.profile[0].profileID', position: -1, index: 1,
    }).validate()).to.not.throw();

    expect(() => new InsertOperator({
      name: 'insert', value: 'Add to Cart', position: 0,
    }).validate()).to.not.throw();

    // select or value option is required
    expect(() => new InsertOperator({
      name: 'insert', position: 0,
    }).validate()).to.throw();

    // but not both
    expect(() => new InsertOperator({
      name: 'insert', select: 'user.profile[0].profileID', value: 'Add to Cart',
    }).validate()).to.throw();
  });

  it('it should insert at the beginning by default', () => {
    const data: any[] = [{ foo: 'foo' }, { bar: 'bar' }];
    const operator = new InsertOperator({ name: 'insert', value: 'baz' });

    const [baz, foo, bar] = operator.handleData(data)!;
    expect(baz).to.eq('baz');
    expect(foo).to.eq(data[0]);
    expect(bar).to.eq(data[1]);
  });

  it('it should insert from the end', () => {
    const data: any[] = [{ foo: 'foo' }, { bar: 'bar' }];
    const operator = new InsertOperator({ name: 'insert', value: 'baz', position: -1 });

    const [foo, bar, baz]: any[] = operator.handleData(data)!;
    expect(foo).to.eq(data[0]);
    expect(bar).to.eq(data[1]);
    expect(baz).to.eq('baz');
  });

  it('it should insert in the middle', () => {
    const data: any[] = [{ foo: 'foo' }, { bar: 'bar' }];
    const operator = new InsertOperator({ name: 'insert', value: 'baz', position: 1 });

    const [foo, baz, bar]: any[] = operator.handleData(data)!;
    expect(foo).to.eq(data[0]);
    expect(bar).to.eq(data[1]);
    expect(baz).to.eq('baz');
  });

  it('it should insert using selection syntax', () => {
    const data: any[] = [{ foo: 'foo', bar: [{ baz: 'baz' }] }];
    const operator = new InsertOperator({ name: 'insert', select: 'bar[0].baz' });

    const [baz, obj] = operator.handleData(data)!;
    expect(baz).to.eq('baz');
    expect(obj).to.eq(data[0]);
  });

  it('it should insert using defaultValue if selection syntax fails', () => {
    const data: any[] = [{ foo: 'foo', bar: [{ baz: 'baz' }] }];
    const operator = new InsertOperator({ name: 'insert', select: 'bar[0].bazzz', defaultValue: 'default' });

    const [baz, obj] = operator.handleData(data)!;
    expect(baz).to.eq('default');
    expect(obj).to.eq(data[0]);
  });

  it('it should throw an error if no value can be found', () => {
    const data: any[] = [{ foo: 'foo', bar: [{ baz: 'baz' }] }];
    const operator = new InsertOperator({ name: 'insert', select: 'bar[0].bazzz' });

    expect(() => operator.handleData(data)).to.throw();
  });

  it('it should insert using selection syntax for an object at a specific index', () => {
    const data: any[] = ['foobar', { foo: 'foo', bar: [{ baz: 'baz' }] }];
    const operator = new InsertOperator({ name: 'insert', select: 'bar[0].baz', index: 1 });

    const [baz, foobar, obj] = operator.handleData(data)!;
    expect(baz).to.eq('baz');
    expect(foobar).to.eq(data[0]);
    expect(obj).to.eq(data[1]);
  });

  it('it should error if both select and value options are used together', () => {
    const operator = new InsertOperator({ name: 'insert', select: 'user.profile[0].profileID', value: 'Add to Cart' });
    expect(() => operator.handleData([])).to.throw();
  });
});
