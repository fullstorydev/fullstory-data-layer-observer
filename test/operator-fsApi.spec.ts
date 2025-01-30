import { expect } from 'chai';
import 'mocha';

import {
  SetIdentityOperator, SetUserPropertiesOperator, SetPagePropertiesOperator, TrackEventOperator,
} from '../src/operators';
import {
  ConsoleAppender,
  DataLayerObserver, FS_API_CONSTANTS, Logger, LogMessage, LogMessageType,
} from '../src';
import Console from './mocks/console';
import { expectNoCalls, expectParams } from './utils/mocha';
import { clearCallQueues, fullstoryMock, getCallQueues } from './mocks/fullstoryV2';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const originalConsole = globalThis.console;
const console = new Console();

describe('fsApi operator unit tests', () => {
  beforeEach(() => {
    Logger.getInstance().appender = new ConsoleAppender();
    (globalThis as any).console = console;
    // eslint-disable-next-line no-underscore-dangle
    (globalThis as any)._fs_namespace = 'FS';
    (globalThis as any).FS = fullstoryMock;
  });

  afterEach(() => {
    // eslint-disable-next-line no-underscore-dangle
    (globalThis as any).console = originalConsole;
    clearCallQueues();
    // eslint-disable-next-line no-underscore-dangle
    delete (globalThis as any)._fs_namespace;
    delete (globalThis as any).FS;
  });

  it('it should validate options', () => {
    expect(() => new SetIdentityOperator({ name: 'setIdentity' }).validate()).to.not.throw();
    expect(() => new SetUserPropertiesOperator({ name: 'setUserProperties' }).validate()).to.not.throw();
    expect(() => new SetPagePropertiesOperator({ name: 'setPageProperties' }).validate()).to.not.throw();
    expect(() => new TrackEventOperator({ name: 'trackEvent' }).validate()).to.not.throw();
  });

  it('it should log error when missing both fsApi and destination', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    observer.registerRule({ source: 'foo' });
    const [error] = expectParams(console, 'error');
    expect(error).to.eq(`${LogMessageType.OperatorError} ${JSON.stringify({ reason: LogMessage.MissingDestination })}`);
  });

  it('it should log error when both fsApi and destination are present', () => {
    const observer = new DataLayerObserver();
    // no fsApi or destination
    // @ts-ignore
    observer.registerRule({ source: 'foo', fsApi: 'bar', destination: 'test' });
    const [error] = expectParams(console, 'error');
    expect(error).to.eq(
      `${LogMessageType.OperatorError} ${JSON.stringify({ reason: LogMessage.DuplicateDestination })}`,
    );
  });

  it('it should not log error when either fsApi or destination are present', () => {
    const observer = new DataLayerObserver();
    (globalThis as any).foo = 'test';
    (globalThis as any).bar = () => console.log('Test');
    // no fsApi or destination
    observer.registerRule({ source: 'foo', fsApi: FS_API_CONSTANTS.SET_IDENTITY });
    expectNoCalls(console, 'error');
    observer.registerRule({ source: 'foo', destination: 'bar' });
    expectNoCalls(console, 'error');
    delete (globalThis as any).foo;
    delete (globalThis as any).bar;
  });

  it('it should log error when non supported fsApi is used', () => {
    const observer = new DataLayerObserver();
    (globalThis as any).foo = 'test';
    // no fsApi or destination
    // @ts-ignore
    observer.registerRule({ source: 'foo', fsApi: 'bar' });
    const [error] = expectParams(console, 'error');
    const reason = Logger.format(LogMessage.UnsupportedFsApi, 'bar');
    expect(error).to.eq(
      `${LogMessageType.OperatorError} ${JSON.stringify({ reason })}`,
    );
    delete (globalThis as any).foo;
  });

  it('it should throw error when missing FullStory function', () => {
    // this tests base class FSApiOperator so one example will be used
    const operator = new SetIdentityOperator({ name: 'setIdentity' });
    expect(() => operator.handleData([])).to.throw();
    // eslint-disable-next-line no-underscore-dangle
    delete (globalThis as any)._fs_namespace;
    expect(() => operator.handleData([])).to.throw();
    // eslint-disable-next-line no-underscore-dangle
    (globalThis as any)._fs_namespace = 'FS';
    expect(() => operator.handleData([])).to.throw();
    delete (globalThis as any).FS;
    expect(() => operator.handleData([])).to.throw();
  });

  it('it should process trackEvent properly', () => {
    const operator = new TrackEventOperator({ name: 'trackEvent' });
    const inputData = [
      'Test Event',
      {
        inputValue: 'My Input Value',
        anotherValue: 5,
      },
    ];
    const expectedOutput = [
      'trackEvent',
      {
        name: inputData[0],
        properties: inputData[1],
      },
      'dlo',
    ];
    operator.handleData(inputData);
    const callQueues = getCallQueues();
    expect(callQueues).to.not.be.null;
    expect(callQueues.length).to.eq(1);
    const output = callQueues[0];
    expect(output).to.deep.eq(expectedOutput);
  });

  it('it should throw error on improper trackEvent data', () => {
    const operator = new TrackEventOperator({ name: 'trackEvent' });
    const inputData = [
      {
        inputValue: 'My Input Value',
        anotherValue: 5,
      },
    ];
    expect(() => operator.handleData(inputData)).to.throw();
  });

  it('it should process set user properties properly', () => {
    const operator = new SetUserPropertiesOperator({ name: 'userProperties' });
    const inputData = [
      {
        inputValue: 'My Input Value',
        anotherValue: 5,
      },
    ];
    const expectedOutput = [
      'setProperties',
      {
        type: 'user',
        properties: inputData[0],
      },
      'dlo',
    ];
    operator.handleData(inputData);
    const callQueues = getCallQueues();
    expect(callQueues).to.not.be.null;
    expect(callQueues.length).to.eq(1);
    const output = callQueues[0];
    expect(output).to.deep.eq(expectedOutput);
  });

  it('it should throw error on improper user properties data', () => {
    const operator = new SetUserPropertiesOperator({ name: 'user properties' });
    const inputData:any = [];
    expect(() => operator.handleData(inputData)).to.throw();
  });

  it('it should process set page properties properly', () => {
    const operator = new SetPagePropertiesOperator({ name: 'pageProperties' });
    const inputData = [
      {
        inputValue: 'My Input Value',
        anotherValue: 5,
      },
    ];
    const expectedOutput = [
      'setProperties',
      {
        type: 'page',
        properties: inputData[0],
      },
      'dlo',
    ];
    operator.handleData(inputData);
    const callQueues = getCallQueues();
    expect(callQueues).to.not.be.null;
    expect(callQueues.length).to.eq(1);
    const output = callQueues[0];
    expect(output).to.deep.eq(expectedOutput);
  });

  it('it should throw error on improper page properties data', () => {
    const operator = new SetPagePropertiesOperator({ name: 'page properties' });
    const inputData:any = [];
    expect(() => operator.handleData(inputData)).to.throw();
  });

  it('it should process set identity with no properties properly', () => {
    const operator = new SetIdentityOperator({ name: 'setIdentity' });
    const inputData = ['12345'];
    const expectedOutput = [
      'setIdentity',
      {
        uid: inputData[0],
      },
      'dlo',
    ];
    operator.handleData(inputData);
    const callQueues = getCallQueues();
    expect(callQueues).to.not.be.null;
    expect(callQueues.length).to.eq(1);
    const output = callQueues[0];
    expect(output).to.deep.eq(expectedOutput);
  });

  it('it should process set identity with properties properly', () => {
    const operator = new SetIdentityOperator({ name: 'setIdentity' });
    const inputData = [
      '12345',
      {
        inputValue: 'My Input Value',
        anotherValue: 5,
      },
    ];
    const expectedOutput = [
      'setIdentity',
      {
        uid: inputData[0],
        properties: inputData[1],
      },
      'dlo',
    ];
    operator.handleData(inputData);
    const callQueues = getCallQueues();
    expect(callQueues).to.not.be.null;
    expect(callQueues.length).to.eq(1);
    const output = callQueues[0];
    expect(output).to.deep.eq(expectedOutput);
  });

  it('it should throw error on improper setIdentity data', () => {
    const operator = new SetIdentityOperator({ name: 'setIdentity' });
    const inputData:any = [];
    expect(() => operator.handleData(inputData)).to.throw();
  });
});
