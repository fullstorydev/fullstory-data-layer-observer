import { expect } from 'chai';
import 'mocha';

import {
  Logger, LogLevel, LogEvent, LogContext, FullStoryAppender, ConsoleAppender,
} from '../src/utils/logger';
import Console from './mocks/console';
import FullStory from './mocks/fullstory-recording';
import { expectParams, expectNoCalls } from './utils/mocha';
import { MockClass } from './mocks/mock';

const originalConsole = globalThis.console;
const console = new Console();

describe('logger unit tests', () => {
  before(() => {
    (globalThis as any).console = console;
    (window as any)._fs_namespace = 'FS'; // eslint-disable-line no-underscore-dangle
    (window as any).FS = new FullStory();
  });

  after(() => {
    (globalThis as any).console = originalConsole;
    delete (window as any).FS;
  });

  it('a console logger with warn and error levels is configured by default', () => {
    const mockDatalayer = 'digitalData.user';

    const logger = Logger.getInstance();

    logger.error('Data layer not found', mockDatalayer);
    logger.warn('Data layer not ready', mockDatalayer);

    const [error] = expectParams(console, 'error');
    expect(error).to.eq(`Data layer not found "${mockDatalayer}"`);

    const [warn] = expectParams(console, 'warn');
    expect(warn).to.eq(`Data layer not ready "${mockDatalayer}"`);

    logger.info('Data layer rules loaded', mockDatalayer);
    expectNoCalls(console, 'info');

    logger.debug('Operator output', mockDatalayer);
    expectNoCalls(console, 'debug');
  });

  it('a FullStory appender can be configured', () => {
    const context: LogContext = {
      rule: 'fs-event-ceddl-cart',
      path: 'digitalData.cart',
      selector: 'digitalData.cart[(cartID,price)]',
      source: 'digitalData.cart[(cartID,price)]',
    };

    const logger = Logger.getInstance('fullstory'); // technically the singleton prevents reconfiguring
    logger.appender = new FullStoryAppender(); // so manually assign

    logger.error('Data layer not found', context);

    const [eventName, event, source] = expectParams((window as any).FS, 'event');
    expect(eventName).to.eq('Data Layer Observer');
    expect(event.message).to.eq('Data layer not found');
    expect(event.context.rule).to.eq(context.rule);
    expect(event.context.path).to.eq(context.path);
    expect(event.context.selector).to.eq(context.selector);
    expect(event.context.source).to.eq(context.source);
    expect(source).to.eq('dlo');

    logger.info('Data layer rules loaded', context);
    expectNoCalls((window as any).FS, 'event');

    logger.debug('Operator output', context);
    expectNoCalls((window as any).FS, 'event');
  });

  it('it should allow setting higher log levels', () => {
    const logger = Logger.getInstance('console'); // technically the singleton prevents reconfiguring
    logger.appender = new ConsoleAppender(); // so manually assign

    logger.level = LogLevel.DEBUG;

    logger.info('Data layer rules loaded');
    const [info] = expectParams(console, 'info');
    expect(info).to.eq('Data layer rules loaded');

    logger.debug('Operator output');
    const [debug] = expectParams(console, 'debug');
    expect(debug).to.eq('Operator output');
  });

  it('it should allow setting a custom appender', () => {
    const mockDatalayer = 'digitalData.user';

    class MockAppender extends MockClass {
      /* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
      log(event: LogEvent) { } //
    }

    const appender = new MockAppender();

    const logger = Logger.getInstance();
    logger.appender = appender;

    logger.error('Data layer not found', { source: mockDatalayer });

    const [event] = expectParams(appender, 'log');
    expect(event).to.not.be.undefined;
    expect(event.level).to.eq(LogLevel.ERROR);
    expect(event.message).to.eq('Data layer not found');
    expect(event.context.source).to.eq(mockDatalayer);
  });
});
