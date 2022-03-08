/* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
import { expect } from 'chai';
import 'mocha';

import { DefaultTelemetryProvider, consoleTelemetryExporter } from '../src/utils/telemetry';
import { MockClass } from './mocks/mock';
import Console from './mocks/console';
import { expectNoCalls, expectParams } from './utils/mocha';
import { ConsoleAppender, Logger } from '../src/utils/logger';

class MockTelemetryExporter extends MockClass {
  sendSpan(): void {}

  sendCount(): void {}
}

describe('DefaultTelemetryProvider', () => {
  const originalConsole = globalThis.console;
  let mockConsole: Console;

  beforeEach(() => {
    mockConsole = new Console();
    (globalThis as any).console = mockConsole;
    // Ensure log level is high enough to write debug log items
    Logger.getInstance().level = 3;
    Logger.getInstance().appender = new ConsoleAppender();
  });

  afterEach(() => {
    (globalThis as any).console = originalConsole;
    Logger.getInstance().level = 1;
  });

  it('sends span event to telemetry exporter when span is ended', async () => {
    const name = 'test';
    const attributes: Record<string, any> = {
      prop: 'value',
    };
    const exporter = new MockTelemetryExporter();
    const provider = new DefaultTelemetryProvider(exporter);

    const span = provider.startSpan(name, attributes);
    const startTime = new Date().getTime();
    expectNoCalls(exporter, 'sendSpan');

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        span.end();
        resolve();
      }, 50);
    });

    const endTime = new Date().getTime();
    const expectedDuration = endTime - startTime;
    const [spanEvent] = expectParams(exporter, 'sendSpan');

    expect(spanEvent.name).to.equal(name);
    expect(spanEvent.duration).to.be.greaterThan(expectedDuration * 0.9);
    expect(spanEvent.duration).to.be.lessThan(expectedDuration * 1.1);

    Object.keys(attributes).forEach((key) => {
      expect(spanEvent.attributes[key]).to.equal(attributes[key]);
    });

    const timestamp = Date.parse(spanEvent.timestamp);
    expect(timestamp).to.be.gte(startTime);
    expect(timestamp).to.be.lte(endTime);

    expectNoCalls(exporter, 'sendCount');
  });

  it('sends count event to telemetry exporter', () => {
    const name = 'test';
    const attributes: Record<string, any> = {
      prop: 'value',
    };
    const value = 73;
    const exporter = new MockTelemetryExporter();
    const provider = new DefaultTelemetryProvider(exporter);
    const startTime = new Date().getTime();
    expectNoCalls(exporter, 'sendCount');

    provider.count(name, value, attributes);

    const endTime = new Date().getTime();
    const [countEvent] = expectParams(exporter, 'sendCount');

    expect(countEvent.name).to.equal(name);
    expect(countEvent.value).to.equal(value);

    Object.keys(attributes).forEach((key) => {
      expect(countEvent.attributes[key]).to.equal(attributes[key]);
    });

    const timestamp = Date.parse(countEvent.timestamp);
    expect(timestamp).to.be.gte(startTime);
    expect(timestamp).to.be.lte(endTime);

    expectNoCalls(exporter, 'sendSpan');
  });

  it('logs telemetry span errors at the debug level', () => {
    const throwsOnSendSpanExporter = {
      sendSpan: () => { throw new Error('test error'); },
      sendCount: () => {},
    };

    const provider = new DefaultTelemetryProvider(throwsOnSendSpanExporter);
    const span = provider.startSpan('test span');
    expectNoCalls(mockConsole, 'debug');

    span.end();

    const [error] = expectParams(mockConsole, 'debug');
    expect(error).to.equal('Error sending telemetry span: test error');
  });

  it('logs telemetry count errors at the debug level', () => {
    const throwsOnSendCountExporter = {
      sendSpan: () => {},
      sendCount: () => { throw new Error('test error'); },
    };

    const provider = new DefaultTelemetryProvider(throwsOnSendCountExporter);
    expectNoCalls(mockConsole, 'debug');

    provider.count('test count', 1);

    const [error] = expectParams(mockConsole, 'debug');
    expect(error).to.equal('Error sending telemetry count: test error');
  });

  // TODO(nate): Test default and custom telemetry wiring
});

describe('ConsoleTelemetryExporter', () => {
  const originalConsole = globalThis.console;
  let mockConsole: Console;

  beforeEach(() => {
    mockConsole = new Console();
    (globalThis as any).console = mockConsole;
  });

  afterEach(() => {
    (globalThis as any).console = originalConsole;
  });

  it('writes telemetry span to console.debug', () => {
    expectNoCalls(mockConsole, 'debug');
    const span = {
      name: 'test',
      timestamp: new Date().toISOString(),
      attributes: {
        prop: 'value',
      },
      duration: 23,
    };

    consoleTelemetryExporter.sendSpan(span);
    const [message, event] = expectParams(mockConsole, 'debug');

    expect(message).to.equal('Telemetry Span');
    expect(event.name).to.equal(span.name);
    expect(event.timestamp).to.equal(span.timestamp);
    expect(event.attributes.prop).to.equal(span.attributes.prop);
    expect(event.duration).to.equal(span.duration);

    expectNoCalls(mockConsole, 'log');
    expectNoCalls(mockConsole, 'info');
    expectNoCalls(mockConsole, 'error');
    expectNoCalls(mockConsole, 'warn');
  });

  it('writes telemetry count to console.debug', () => {
    expectNoCalls(mockConsole, 'debug');
    const count = {
      name: 'test',
      timestamp: new Date().toISOString(),
      attributes: {
        prop: 'value',
      },
      value: 32,
    };

    consoleTelemetryExporter.sendCount(count);
    const [message, event] = expectParams(mockConsole, 'debug');

    expect(message).to.equal('Telemetry Count');
    expect(event.name).to.equal(count.name);
    expect(event.timestamp).to.equal(count.timestamp);
    expect(event.attributes.prop).to.equal(count.attributes.prop);
    expect(event.value).to.equal(count.value);

    expectNoCalls(mockConsole, 'log');
    expectNoCalls(mockConsole, 'info');
    expectNoCalls(mockConsole, 'error');
    expectNoCalls(mockConsole, 'warn');
  });
});
