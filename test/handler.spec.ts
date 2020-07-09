/* eslint-disable max-classes-per-file */
import { expect } from 'chai';
import 'mocha';

import DataHandler from '../src/handler';

import { basicDigitalData, PageInfo, Page } from './mocks/CEDDL';
import { Operator } from '../src/operator';
import { DataLayerDetail, PropertyDetail } from '../src/event';

class EchoOperator extends Operator {
  constructor(private seen: any[]) {
    super({ name: 'echo', index: 0 });
  }

  handleData(data: any[]): any[] | null {
    this.seen.push(data[this.index]);
    return data;
  }

  validate() {
    throw new Error(`${this.name} validate not implemented`);
  }
}

class GetterOperator extends Operator {
  constructor(private property: string, private seen: any[]) {
    super({ name: 'getter', index: 0 });
  }

  handleData(data: any[]): any[] | null {
    this.seen.push(data[this.index][this.property]);
    return [data[this.index][this.property]];
  }

  validate() {
    throw new Error(`${this.name} validate not implemented`);
  }
}

class NullOperator extends Operator {
  constructor() {
    super({ name: 'null' });
  }

  // eslint-disable-next-line class-methods-use-this
  handleData(): any[] | null {
    return null;
  }

  validate() {
    throw new Error(`${this.name} validate not implemented`);
  }
}

class ThrowOperator extends Operator {
  constructor() {
    super({ name: 'throw' });
  }

  handleData(): any[] | null {
    throw new Error(`${this.name} data processing error`);
  }

  validate() {
    throw new Error(`${this.name} validate not implemented`);
  }
}

describe('DataHandler unit tests', () => {
  before(() => {
    (globalThis as any).digitalData = basicDigitalData;
  });

  after(() => {
    delete (globalThis as any).digitalData;
  });

  it('data handlers should find a data layer for a given target and property', () => {
    const handler = new DataHandler('digitalData');
    expect(handler).to.not.be.undefined;
  });

  it('data handlers should find a data layer using a path', () => {
    const handler = new DataHandler('digitalData');
    expect(handler).to.not.be.undefined;
  });

  it('non-existent data layers should throw an Error', () => {
    expect(() => new DataHandler('notFound')).to.throw();
    expect(() => new DataHandler('notFound')).to.throw();
  });

  it('data layer event data should pass to the first operator', () => {
    const handler = new DataHandler('digitalData.page.pageInfo');

    const seen: any = [];

    const echo = new EchoOperator(seen);
    handler.push(echo);
    handler.fireEvent();

    expect((seen[0] as PageInfo).pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
  });

  it('transformed data should pass from operator to operator', () => {
    const handler = new DataHandler('digitalData.page');

    const seen: any = [];

    const echo = new EchoOperator(seen);
    const getter = new GetterOperator('pageInfo', seen);

    handler.push(echo, getter);
    handler.fireEvent();

    expect((seen[0] as Page).pageInfo.pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
    expect((seen[1] as PageInfo).pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
  });

  it('debug should print operator transformations', () => {
    const handler = new DataHandler('digitalData.page');
    handler.debug = true;

    const seen: any = [];

    const echo = new EchoOperator(seen);
    const getter = new GetterOperator('pageInfo', seen);

    handler.push(echo, getter);
    handler.fireEvent();

    expect((seen[0] as Page).pageInfo.pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
    expect((seen[1] as PageInfo).pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
  });

  it('returning null in an operator should halt data handling', () => {
    const handler = new DataHandler('digitalData.page');

    const seen: any = [];

    const nullify = new NullOperator();
    const echo = new EchoOperator(seen);

    handler.push(nullify, echo);
    handler.fireEvent();

    expect(seen.length).to.eq(0);
  });

  it('operator exceptions should fail gracefully', () => {
    const handler = new DataHandler('digitalData.page');

    const seen: any = [];

    const throws = new ThrowOperator();
    const echo = new EchoOperator(seen);

    handler.push(throws, echo);
    handler.fireEvent();

    expect(seen.length).to.eq(0);
  });

  it('objects should only allow manual firing of events', () => {
    // @ts-ignore
    basicDigitalData.fn = () => console.log('Hello World'); // eslint-disable-line no-console
    const handler = new DataHandler('digitalData.fn');
    expect(() => handler.fireEvent()).to.throw();
  });

  it('events with unknown types should not be handled', () => {
    const handler = new DataHandler('digitalData.page.pageInfo');

    const seen: any = [];

    const echo = new EchoOperator(seen);
    handler.push(echo);

    handler.handleEvent(new CustomEvent<DataLayerDetail>('unknownType', {
      detail: new PropertyDetail(basicDigitalData.page.pageInfo, basicDigitalData.page, 'digitalData.page.pageInfo'),
    }));

    expect(seen.length).to.eq(0);
  });
});
