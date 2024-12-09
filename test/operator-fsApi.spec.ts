import { expect } from 'chai';
import 'mocha';

// import { expectParams, expectNoCalls } from './utils/mocha';
import SetIdentityOperator from '../src/operators/fsApi/setIdentity';
import SetUserPropertiesOperator from '../src/operators/fsApi/setUserProperties';
import SetPagePropertiesOperator from '../src/operators/fsApi/setPageProperties';
import TrackEventOperator from '../src/operators/fsApi/trackEvent';
import {
  DataLayerObserver, FS_API_CONSTANTS, Logger, LogMessage, LogMessageType,
} from '../src';
import Console from './mocks/console';
import { expectNoCalls, expectParams } from './utils/mocha';
// import DataLayerTarget from "../src/target";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fullstoryMock(parameters:any[]) {}
const originalConsole = globalThis.console;
const console = new Console();

describe.only('fsApi operator unit tests', () => {
  beforeEach(() => {
    (globalThis as any).console = console;
    // eslint-disable-next-line no-underscore-dangle
    (globalThis as any)._fs_namespace = 'FS';
    (globalThis as any).FS = fullstoryMock;
  });

  afterEach(() => {
    // eslint-disable-next-line no-underscore-dangle
    (globalThis as any).console = originalConsole;
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
    observer.registerRule({ source: 'foo', fsApi: 'bar' });
    const [error] = expectParams(console, 'error');
    const reason = Logger.format(LogMessage.UnsupportedFsApi, 'bar');
    expect(error).to.eq(
      `${LogMessageType.OperatorError} ${JSON.stringify({ reason })}`,
    );
    delete (globalThis as any).foo;
  });

  /*
  it('it should call a function using string path', () => {
    expectNoCalls(console, 'log');

    const operator = new FunctionOperator({ name: 'function', func: 'console.log' });
    operator.handleData(['Hello World']);

    const [hello] = expectParams(console, 'log');
    expect(hello).to.eq('Hello World');
  });
*/
});
