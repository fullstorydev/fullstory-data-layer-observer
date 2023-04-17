import { expect } from 'chai';
import 'mocha';
import { ParseOperator } from '../src/operators';

describe('parse operator unit test', () => {
  it('it should validate options', () => {
    expect(() => new ParseOperator({
      name: 'parse',
      propertyDelimiters: [',', '|'],
      property: 'events',
    }).validate()).to.not.throw();

    expect(() => new ParseOperator({
      name: 'parse',
      index: 0,
      propertyDelimiters: [',', '|'],
      property: 'events',
    }).validate()).to.not.throw();

    expect(() => new ParseOperator({
      name: 'parse',
      index: 0,
      output: 'keyValue',
      propertyDelimiters: [',', '|'],
      keyValueDelimiter: '=',
      property: 'events',
    }).validate()).to.not.throw();

    expect(() => new ParseOperator({
      name: 'parse',
      index: 0,
      output: 'array',
      propertyDelimiters: [',', '|'],
      keyValueDelimiter: '=',
      property: 'events',
    }).validate()).to.throw();

    expect(() => new ParseOperator({
      name: 'parse',
      index: 0,
      output: 'foo',
      propertyDelimiters: [',', '|'],
      property: 'events',
    }).validate()).to.throw();

    // @ts-ignore
    expect(() => new ParseOperator({
      name: 'parse',
      index: 0,
      keyValueDelimiter: '=',
      property: 'events',
    }).validate()).to.throw();

    // @ts-ignore
    expect(() => new ParseOperator({
      name: 'parse',
      index: 0,
      keyValueDelimiter: '=',
      propertyDelimiters: [',', '|'],
    }).validate()).to.throw();

    expect(() => new ParseOperator({
      name: 'parse',
      index: 0,
      keyValueDelimiter: '=',
      // @ts-ignore
      propertyDelimiters: [',', 5],
      property: 'events',
    }).validate()).to.throw();
  });

  it('it should not change the original object', () => {
    let operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [','],
      property: 'events',
    });

    const originalObject = {
      eVar1: 'foo',
      events: 'event1,event2=foo,event13,purchase',
      products: 'Example product;1;3.50;event1=4.99|event2=5.99;eVar1=Example value 1|eVar2=Example value 2',
    };

    operator.handleData([originalObject])!;
    expect(originalObject.eVar1).to.be.equal('foo');
    expect(originalObject.events).to.be.equal('event1,event2=foo,event13,purchase');
    expect(originalObject.products).to.be.equal(
      'Example product;1;3.50;event1=4.99|event2=5.99;eVar1=Example value 1|eVar2=Example value 2',
    );
    // @ts-ignore
    expect(originalObject.event1).to.be.undefined;
    // @ts-ignore
    expect(originalObject.data_obj).to.be.undefined;

    operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [','],
      keyValueDelimiter: '=',
      property: 'products',
    });

    operator.handleData([originalObject])!;
    expect(originalObject.eVar1).to.be.equal('foo');
    expect(originalObject.events).to.be.equal('event1,event2=foo,event13,purchase');
    expect(originalObject.products).to.be.equal(
      'Example product;1;3.50;event1=4.99|event2=5.99;eVar1=Example value 1|eVar2=Example value 2',
    );
    // @ts-ignore
    expect(originalObject.event1).to.be.undefined;
    // @ts-ignore
    expect(originalObject.data_obj).to.be.undefined;
  });

  it('it should work for simple parsing', () => {
    const data = {
      events: 'event1,event2,event13,purchase',
    };
    let operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [','],
      property: 'events',
    });
    let [parsedData] = operator.handleData([data])!;
    expect(parsedData.event1).to.be.null;
    expect(parsedData.event2).to.be.null;
    expect(parsedData.event13).to.be.null;
    expect(parsedData.purchase).to.be.null;

    operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [','],
      output: 'array',
      property: 'events',
    });
    [parsedData] = operator.handleData([data])!;
    expect(parsedData.events).to.be.length(4);
    expect(parsedData.events[0]).to.be.equal('event1');
    expect(parsedData.events[1]).to.be.equal('event2');
    expect(parsedData.events[2]).to.be.equal('event13');
    expect(parsedData.events[3]).to.be.equal('purchase');
    expect(parsedData.event1).to.be.undefined;
    expect(parsedData.event2).to.be.undefined;
    expect(parsedData.event13).to.be.undefined;
    expect(parsedData.purchase).to.be.undefined;
  });

  it('it should work for keyValue parsing', () => {
    const data = {
      events: 'event1,event2=foo',
    };
    let operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [','],
      keyValueDelimiter: '=',
      property: 'events',
    });
    let [parsedData] = operator.handleData([data])!;
    expect(parsedData.event1).to.be.null;
    expect(parsedData.event2).to.be.equal('foo');

    operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [','],
      output: 'array',
      property: 'events',
    });
    [parsedData] = operator.handleData([data])!;
    expect(parsedData.events).to.be.length(2);
    expect(parsedData.events[0]).to.be.equal('event1');
    expect(parsedData.events[1]).to.be.equal('event2=foo');
    expect(parsedData.event1).to.be.undefined;
    expect(parsedData.event2).to.be.undefined;
  });

  it('it should skip bad property names', () => {
    const data = {
      events: 'event1,12Foo,Hello_1234,_data=some,_foo,event2=foo,3piece=bar',
    };
    const operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [','],
      keyValueDelimiter: '=',
      property: 'events',
    });
    const [parsedData] = operator.handleData([data])!;
    expect(parsedData.events).to.be.length(4);
    expect(parsedData.events[0]).to.be.equal('12Foo');
    expect(parsedData.events[1]).to.be.equal('_data=some');
    expect(parsedData.events[2]).to.be.equal('_foo');
    expect(parsedData.events[3]).to.be.equal('3piece=bar');
    expect(parsedData.event1).to.be.null;
    expect(parsedData.event2).to.be.equal('foo');
    expect(parsedData).to.not.haveOwnProperty('12Foo');
    expect(parsedData).to.not.haveOwnProperty('_data');
    expect(parsedData).to.not.haveOwnProperty('_foo');
    expect(parsedData).to.not.haveOwnProperty('3piece');
  });

  it('it should work for advanced scenarios', () => {
    const data = {
      products: 'Example product;1;3.50;event1=4.99|event2=5.99;eVar1=Example value 1|eVar2=Example value 2',
    };
    const operator = new ParseOperator({
      name: 'parse',
      propertyDelimiters: [';', '|'],
      keyValueDelimiter: '=',
      property: 'products',
    });
    const [parsedData] = operator.handleData([data])!;
    expect(parsedData.products).to.be.length(3);
    expect(parsedData.products[0]).to.be.equal('Example product');
    expect(parsedData.products[1]).to.be.equal('1');
    expect(parsedData.products[2]).to.be.equal('3.50');
    expect(parsedData.event1).to.be.equal('4.99');
    expect(parsedData.event2).to.be.equal('5.99');
    expect(parsedData.eVar1).to.be.equal('Example value 1');
    expect(parsedData.eVar2).to.be.equal('Example value 2');
  });
});
