import { expect } from 'chai';
import 'mocha';
import { Logger, LogEventTypes } from '../src/utils/logger';

describe('logger unit tests', () => {

  it('it should create an observer log event', () => {
    const notFound = Logger.getLogEvent(LogEventTypes.OPERATOR_FAILURE, 'foo bar');
    expect(notFound.type_str).to.eq(LogEventTypes.OPERATOR_FAILURE);
    expect(notFound.message_str).to.eq('foo bar');
    expect(notFound.datalayer_str).to.be.undefined;
  });

  it('it should create a data layer log event', () => {
    const notFound = Logger.getLogEvent(LogEventTypes.DATALAYER_NOT_FOUND, '', 'digitalData.user');
    expect(notFound.type_str).to.eq(LogEventTypes.DATALAYER_NOT_FOUND);
    expect(notFound.message_str).to.eq('');
    expect(notFound.datalayer_str).to.eq('digitalData.user');
  });

  it('it should send a log event to console when FullStory does not exist', () => {
    // @ts-ignore
    globalThis.window = {}; // prevents a ReferenceError: window is not defined when testing
    Logger.send(LogEventTypes.DATALAYER_NOT_FOUND, '', 'digitalData.user');
  });

  it('it should send log event to FullStory', () => {
    // @ts-ignore
    globalThis.window = { _fs_namespace: 'FS', events: [] };

    // mock a FS.event function
    (globalThis.window as any).FS = {
      event: (eventName: string, payload: any, source: string) => {
        (globalThis.window as any).events.push({ eventName, payload, source });
      }
    };

    Logger.send(LogEventTypes.DATALAYER_NOT_FOUND, '', 'digitalData.user');

    const events = (globalThis.window as any).events;

    expect(events.length).to.eq(1);
    expect(events[0].eventName).to.eq(Logger.NAME);
    expect(events[0].payload.type_str).to.eq(LogEventTypes.DATALAYER_NOT_FOUND);
    expect(events[0].payload.message_str).to.eq('');
    expect(events[0].payload.datalayer_str).to.eq('digitalData.user');
    expect(events[0].source).to.eq(Logger.SOURCE);
  });

});