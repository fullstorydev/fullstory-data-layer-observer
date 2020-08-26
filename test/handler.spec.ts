/* eslint-disable max-classes-per-file */
import { expect } from 'chai';
import 'mocha';

import deepcopy from 'deepcopy';
import DataHandler from '../src/handler';

import Console from './mocks/console';
import { basicDigitalData, PageInfo, Page } from './mocks/CEDDL';
import { Operator, OperatorOptions } from '../src/operator';
import { DataLayerDetail, PropertyDetail, createEvent } from '../src/event';
import { expectNoCalls, expectParams } from './utils/mocha';
import DataLayerTarget from '../src/target';

const originalConsole = globalThis.console;
const console = new Console();

class EchoOperator implements Operator {
  options: OperatorOptions = {
    name: 'echo',
    index: 0,
    specification: {
      index: { required: true, type: 'number' },
    },
  };

  constructor(private seen: any[]) {
    // sets this.seen
  }

  handleData(data: any[]): any[] | null {
    this.seen.push(data[this.options.index!]);
    return data;
  }

  /* eslint-disable class-methods-use-this */
  validate() {

  }
}

class GetterOperator implements Operator {
  options: OperatorOptions = {
    name: 'getter',
    index: 0,
    specification: {
      index: { required: true, type: 'number' },
    },
  };

  constructor(private property: string, private seen: any[]) {
    // sets this.property and this.seen
  }

  handleData(data: any[]): any[] | null {
    this.seen.push(data[this.options.index!][this.property]);
    return [data[this.options.index!][this.property]];
  }

  /* eslint-disable class-methods-use-this */
  validate() {

  }
}

class NullOperator implements Operator {
  options: OperatorOptions = {
    name: 'null',
  };

  // eslint-disable-next-line class-methods-use-this
  handleData(): any[] | null {
    return null;
  }

  validate() {

  }
}

class ThrowOperator implements Operator {
  options: OperatorOptions = {
    name: 'throw',
  };

  handleData(): any[] | null {
    throw new Error(`${this.options.name} data processing error`);
  }

  /* eslint-disable class-methods-use-this */
  validate() {

  }
}

describe('DataHandler unit tests', () => {
  beforeEach(() => {
    (globalThis as any).digitalData = deepcopy(basicDigitalData);
    (globalThis as any).console = console;
  });

  afterEach(() => {
    delete (globalThis as any).digitalData;
    (globalThis as any).console = originalConsole;
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

  it('debug should print operator transformations to console.debug', () => {
    expectNoCalls(console, 'debug');

    const handler = new DataHandler('digitalData.page');
    handler.debug = true;

    const seen: any = [];

    const echo = new EchoOperator(seen);
    const getter = new GetterOperator('pageInfo', seen);

    handler.push(echo, getter);
    handler.fireEvent();

    // NOTE the call queues will be expected in reverse order
    const [exit] = expectParams(console, 'debug');
    expect(exit).to.contain(`digitalData.page handleData exit\n[${JSON.stringify(basicDigitalData.page.pageInfo)}]`);

    const [getterOutput] = expectParams(console, 'debug');
    expect(getterOutput).to.contain('  [1] getter output');
    expect(getterOutput).to.contain(`[${JSON.stringify(basicDigitalData.page.pageInfo)}]`);

    const [echoOutput] = expectParams(console, 'debug');
    expect(echoOutput).to.contain('  [0] echo output');
    expect(echoOutput).to.contain(`[${JSON.stringify(basicDigitalData.page)}]`);

    const [entry] = expectParams(console, 'debug');
    expect(entry).to.contain(`digitalData.page handleData entry\n[${JSON.stringify(basicDigitalData.page)}]`);

    expect((seen[0] as Page).pageInfo.pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
    expect((seen[1] as PageInfo).pageID).to.eq(basicDigitalData.page.pageInfo.pageID);
  });

  it('debug output function can be configured', () => {
    const debugMessages: string[] = [];

    const handler = new DataHandler('digitalData.page');
    handler.debug = true;
    handler.debugger = (message: string) => debugMessages.push(message);

    const getter = new GetterOperator('pageInfo', []);

    handler.push(getter);
    handler.fireEvent();

    expect(debugMessages.length).to.eq(3);
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
    (globalThis as any).digitalData.fn = () => console.log('Hello World'); // eslint-disable-line no-console
    const handler = new DataHandler('digitalData.fn');

    const seen: any = [];

    const echo = new EchoOperator(seen);
    handler.push(echo);

    expect(seen.length).to.eq(0);
  });

  it('events with unknown types should not be handled', () => {
    const handler = new DataHandler('digitalData.page.pageInfo');

    const seen: any = [];

    const echo = new EchoOperator(seen);
    handler.push(echo);

    handler.handleEvent(new CustomEvent<DataLayerDetail>('unknownType', {
      detail: new PropertyDetail('digitalData.page', 'pageInfo', basicDigitalData.page.pageInfo),
    }));

    expect(seen.length).to.eq(0);
  });

  it('data layer events should be delayed to allow debouncing', (done) => {
    const handler = new DataHandler('digitalData.page.pageInfo');

    const seen: any = [];

    const echo = new EchoOperator(seen);
    handler.push(echo);

    (globalThis as any).digitalData.page.pageInfo.pageID = 'changedPage';
    handler.handleEvent(createEvent((globalThis as any).digitalData.page, 'pageInfo',
      (globalThis as any).digitalData.page.pageInfo, 'digitalData.page.pageInfo'));

    // since this occurs immediately after the handleEvent call, the debounce delay hasn't fully elapsed
    expect(seen[0]).to.be.undefined;

    setTimeout(() => {
      expect((seen[0] as PageInfo).pageID).to.eq('changedPage');
      done();
    }, DataHandler.debounceTime * 1.5);
  });

  it('multiple data layer events should be debounced', (done) => {
    const handler = new DataHandler('digitalData.page.pageInfo');

    const seen: any = [];

    const echo = new EchoOperator(seen);
    handler.push(echo);

    (globalThis as any).digitalData.page.pageInfo.pageID = 'changedAgain';
    handler.handleEvent(createEvent((globalThis as any).digitalData.page, 'pageInfo',
      (globalThis as any).digitalData.page.pageInfo, 'digitalData.page.pageInfo'));

    (globalThis as any).digitalData.page.pageInfo.pageID = 'changedOneMoreTime';
    handler.handleEvent(createEvent((globalThis as any).digitalData.page, 'pageInfo',
      (globalThis as any).digitalData.page.pageInfo, 'digitalData.page.pageInfo'));

    setTimeout(() => {
      expect(seen.length).to.eq(1);
      done();
    }, DataHandler.debounceTime * 1.5);
  });

  it('an object with no properties selected from an event should not be handled', (done) => {
    const handler = new DataHandler(new DataLayerTarget('digitalData.page.pageInfo[(missingProperty)]'));

    const seen: any = [];

    const echo = new EchoOperator(seen);
    handler.push(echo);

    (globalThis as any).digitalData.page.pageInfo.pageID = '1234';
    handler.handleEvent(createEvent((globalThis as any).digitalData.page, 'pageInfo',
      (globalThis as any).digitalData.page.pageInfo, 'digitalData.page.pageInfo'));

    setTimeout(() => {
      expect(seen.length).to.eq(0);
      done();
    }, DataHandler.debounceTime * 1.5);
  });
});
