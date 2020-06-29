import { expect } from 'chai';
import 'mocha';
import { Logger, LogLevel, LogEvent } from '../src/utils/logger';
import { FullStoryAPI, getFS } from '../src/utils/window';

class MockConsole {
  messages: { [key: string]: string } = {
    error: '',
    warn: '',
    info: '',
    debug: ''
  }

  constructor() {

  }

  error(message: string) {
    this.messages.error = message;
  }

  warn(message: string) {
    this.messages.warn = message;
  }

  info(message: string) {
    this.messages.info = message;
  }

  debug(message: string) {
    this.messages.debug = message;
  }
}

class MockFullStory implements FullStoryAPI {

  events: [string, { [key: string]: any }, string][] = [];

  constructor() {

  }

  event(eventName: string, payload: { [key: string]: any }, source: string) {
    this.events.push([eventName, payload, source]);
  }
}

describe('logger unit tests', () => {

  it('it should create a console logger with warn and error levels by default', () => {
    const mockDatalayer = 'digitalData.user';
    const mockConsole = new MockConsole();
    // @ts-ignore
    globalThis.console = mockConsole;

    const logger = Logger.getInstance();

    logger.error('Data layer not found', mockDatalayer);
    logger.warn('Data layer not ready', mockDatalayer);
    logger.info('Data layer rules loaded', mockDatalayer);
    logger.debug('Operator output', mockDatalayer);

    expect(mockConsole.messages.error).to.eq(`Data layer not found (${mockDatalayer})`);
    expect(mockConsole.messages.warn).to.eq(`Data layer not ready (${mockDatalayer})`);
    expect(mockConsole.messages.info).to.be.empty;
    expect(mockConsole.messages.debug).to.be.empty;
  });

  it('it should allow setting higher log levels', () => {
    const mockConsole = new MockConsole();
    // @ts-ignore
    globalThis.console = mockConsole;

    const logger = Logger.getInstance();
    logger.level = LogLevel.DEBUG;

    logger.info('Data layer rules loaded');
    logger.debug('Operator output');

    expect(mockConsole.messages.info).to.eq(`Data layer rules loaded`);
    expect(mockConsole.messages.debug).to.eq(`Operator output`);
  });

  it('it should allow setting a custom appender', () => {
    const mockDatalayer = 'digitalData.user';

    const mockFullStory = new MockFullStory();
    (globalThis as any).window = { _fs_namespace: 'FS', FS: mockFullStory };

    const logger = Logger.getInstance();
    logger.appender = {
      log(event: LogEvent) {
        const { level: level_int, message: message_str, datalayer: datalayer_str } = event;
        getFS()!.event('Data Layer Observer', { level_int, message_str, datalayer_str }, 'dataLayerObserver');
      }
    };

    logger.error('Data layer not found', mockDatalayer);

    const event = mockFullStory.events[0];
    expect(event[0]).to.eq('Data Layer Observer');
    expect(event[1].level_int).to.eq(LogLevel.ERROR);
    expect(event[1].message_str).to.eq('Data layer not found');
    expect(event[1].datalayer_str).to.eq(mockDatalayer);
    expect(event[2]).to.eq('dataLayerObserver');
  });

});