/* eslint-disable class-methods-use-this, max-classes-per-file, no-underscore-dangle, @typescript-eslint/no-unused-vars */
import { expect } from 'chai';
import 'mocha';

import {
  DefaultTelemetryProvider, consoleTelemetryExporter, Telemetry, nullTelemetryExporter,
} from '../src/utils/telemetry';
import { MockClass } from './mocks/mock';
import Console from './mocks/console';
import {
  expectCall, expectNoCalls, ExpectObserver, expectParams,
} from './utils/mocha';
import { ConsoleAppender, Logger } from '../src/utils/logger';

class MockTelemetryExporter extends MockClass {
  sendSpan(): void {}

  sendCount(): void {}
}

class MockTelemetryProvider extends MockClass {
  endSpan(): void {}

  startSpan() {
    return {
      end: this.endSpan,
    };
  }

  count(): void {}
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

  it('sends default attributes if no event specific attributes are given', () => {
    const defaultAttributes = {
      version: '1.2.3',
      source: 'default',
    };
    const expectedAttributeCount = 2;
    const exporter = new MockTelemetryExporter();
    const provider = new DefaultTelemetryProvider(exporter).withDefaultAttributes(defaultAttributes);

    const span = provider.startSpan('test span');
    provider.count('test count', 1);
    span.end();

    const spanAttributes = expectParams(exporter, 'sendSpan').pop().attributes;
    expect(spanAttributes.version).to.equal(defaultAttributes.version);
    expect(spanAttributes.source).to.equal(defaultAttributes.source);
    expect(Object.getOwnPropertyNames(spanAttributes).length).to.equal(expectedAttributeCount);

    const countAttributes = expectParams(exporter, 'sendCount').pop().attributes;
    expect(countAttributes.version).to.equal(defaultAttributes.version);
    expect(countAttributes.source).to.equal(defaultAttributes.source);
    expect(Object.getOwnPropertyNames(countAttributes).length).to.equal(expectedAttributeCount);
  });

  it('sends event specific attributes if no default attributes are given', () => {
    const eventAttributes = {
      version: '1.2.3',
      source: 'test',
    };
    const expectedAttributeCount = 2;
    const exporter = new MockTelemetryExporter();
    const provider = new DefaultTelemetryProvider(exporter);

    const span = provider.startSpan('test span', eventAttributes);
    provider.count('test count', 1, eventAttributes);
    span.end();

    const spanAttributes = expectParams(exporter, 'sendSpan').pop().attributes;
    expect(spanAttributes.version).to.equal(eventAttributes.version);
    expect(spanAttributes.source).to.equal(eventAttributes.source);
    expect(Object.getOwnPropertyNames(spanAttributes).length).to.equal(expectedAttributeCount);

    const countAttributes = expectParams(exporter, 'sendCount').pop().attributes;
    expect(countAttributes.version).to.equal(eventAttributes.version);
    expect(countAttributes.source).to.equal(eventAttributes.source);
    expect(Object.getOwnPropertyNames(countAttributes).length).to.equal(expectedAttributeCount);
  });

  it('merges default and event specific attributes if both are given', () => {
    const defaultAttributes = {
      version: '1.2.3',
      source: 'default',
    };
    const eventAttributes = {
      test: 'test',
      source: 'event',
    };
    const expectedAttributeCount = 3;
    const exporter = new MockTelemetryExporter();
    const provider = new DefaultTelemetryProvider(exporter).withDefaultAttributes(defaultAttributes);

    const span = provider.startSpan('test span', eventAttributes);
    provider.count('test count', 1, eventAttributes);
    span.end();

    const spanAttributes = expectParams(exporter, 'sendSpan').pop().attributes;
    expect(spanAttributes.test).to.equal(eventAttributes.test);
    // Event attributes should override default attributes
    expect(spanAttributes.source).to.equal(eventAttributes.source);
    expect(spanAttributes.version).to.equal(defaultAttributes.version);
    expect(Object.getOwnPropertyNames(spanAttributes).length).to.equal(expectedAttributeCount);

    const countAttributes = expectParams(exporter, 'sendCount').pop().attributes;
    expect(countAttributes.test).to.equal(eventAttributes.test);
    // Event attributes should override default attributes
    expect(countAttributes.source).to.equal(eventAttributes.source);
    expect(countAttributes.version).to.equal(defaultAttributes.version);
    expect(Object.getOwnPropertyNames(countAttributes).length).to.equal(expectedAttributeCount);
  });

  it('sends no attributes if neither default nor event specific attributes are given', () => {
    const expectedAttributeCount = 0;
    const exporter = new MockTelemetryExporter();
    const provider = new DefaultTelemetryProvider(exporter);

    const span = provider.startSpan('test span');
    provider.count('test count', 1);
    span.end();

    const spanAttributes = expectParams(exporter, 'sendSpan').pop().attributes;
    expect(Object.getOwnPropertyNames(spanAttributes).length).to.equal(expectedAttributeCount);

    const countAttributes = expectParams(exporter, 'sendCount').pop().attributes;
    expect(Object.getOwnPropertyNames(countAttributes).length).to.equal(expectedAttributeCount);
  });
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

describe('NullTelemetryExporter', () => {
  it('doesn\'t throw when sending telemetry spans', () => {
    expect(nullTelemetryExporter.sendSpan).not.to.throw();
  });

  it('doesn\'t throw when sending telemetry counts', () => {
    expect(nullTelemetryExporter.sendCount).not.to.throw();
  });
});

describe('Direct telemetry initialization', () => {
  const originalConsole = globalThis.console;
  let mockConsole: Console;

  beforeEach(() => {
    mockConsole = new Console();
    (globalThis as any).console = mockConsole;
  });

  afterEach(() => {
    (globalThis as any).console = originalConsole;
  });

  it('sets and returns the given telemetry provider', () => {
    const mockProvider = new MockTelemetryProvider();
    Telemetry.setProvider(mockProvider);

    // endSpan is defined on MockTelemetryProvider to track span.end() calls
    expectNoCalls(mockProvider, 'endSpan');
    expectNoCalls(mockProvider, 'count');

    const span = Telemetry.startSpan('test span');
    Telemetry.count('test count', 1);
    span.end();

    expectCall(mockProvider, 'endSpan', 1);
    expectCall(mockProvider, 'count', 1);
  });

  [undefined, 'unrecognized'].forEach((exporter) => {
    it('uses the default telemetry provider and a null telemetry exporter by default', () => {
      const provider = Telemetry.withExporter(exporter as 'console' | undefined);

      expect(() => {
        const span = provider.startSpan('test span');
        provider.count('test count', 1);
        span.end();
      }).not.to.throw();

      // Verify the console exporter isn't used
      expectNoCalls(mockConsole, 'debug');
    });
  });

  it('uses the default telemetry provider given a custom telemetry exporter', () => {
    const mockExporter = new MockTelemetryExporter();
    const provider = Telemetry.withExporter(mockExporter);

    expectNoCalls(mockExporter, 'sendSpan');
    expectNoCalls(mockExporter, 'sendCount');

    const span = provider.startSpan('test span');
    provider.count('test count', 1);
    span.end();

    expectCall(mockExporter, 'sendSpan', 1);
    expectCall(mockExporter, 'sendCount', 1);
  });

  it('uses the default telemetry provider and console telemetry exporter given a \'console\' configuration', () => {
    const provider = Telemetry.withExporter('console');

    expectNoCalls(mockConsole, 'debug');

    const span = provider.startSpan('test span');
    provider.count('test count', 1);
    span.end();

    expectCall(mockConsole, 'debug', 2);
  });
});

describe('Telemetry initialization from window', () => {
  const originalConsole = globalThis.console;
  let mockConsole: Console;
  const win: any = (window as any);
  let initializeFromWindow: () => void;

  beforeEach(async () => {
    mockConsole = new Console();
    (globalThis as any).console = mockConsole;

    // Clear any rules that may have been configured in other tests
    Object.keys(win)
      .filter((key) => key.startsWith('_dlo_rules'))
      .forEach((key) => {
        win[key] = [];
      });

    // We dynamically import the initialization function so we can remove rules
    // beforehand. If we import the initialization function while rules from other
    // tests are still on the global window, test output noise is generated due to
    // unexpected data layer and rule state
    initializeFromWindow = (await import('../src/embed/init.impl')).default;
  });

  afterEach(() => {
    (globalThis as any).console = originalConsole;
    win._dlo_telemetryProvider = undefined;
    win._dlo_telemetryExporter = undefined;
  });

  [undefined, 'unrecognized'].forEach((exporter) => {
    it('uses the default telemetry provider and null telemetry exporter by default', () => {
      win._dlo_telemetryExporter = exporter;
      initializeFromWindow();

      expect(() => {
        const span = Telemetry.startSpan('test span');
        Telemetry.count('test count', 1);
        span.end();
      }).not.to.throw();

      // Verify the console exporter isn't used
      expectNoCalls(mockConsole, 'debug');
    });
  });

  it('uses the default telemetry provider given a custom telemetry exporter', () => {
    const mockExporter = new MockTelemetryExporter();
    win._dlo_telemetryExporter = mockExporter;
    initializeFromWindow();

    expectNoCalls(mockExporter, 'sendSpan');
    expectNoCalls(mockExporter, 'sendCount');

    const span = Telemetry.startSpan('test span');
    Telemetry.count('test count', 1);
    span.end();

    expectCall(mockExporter, 'sendSpan', 1);
    expectCall(mockExporter, 'sendCount', 1);
  });

  it('uses the default telemetry provider and console telemetry exporter given a \'console\' configuration', () => {
    win._dlo_telemetryExporter = 'console';
    initializeFromWindow();

    expectNoCalls(mockConsole, 'debug');

    const span = Telemetry.startSpan('test span');
    Telemetry.count('test count', 1);
    span.end();

    expectCall(mockConsole, 'debug', 2);
  });

  it('ignores a given custom telemetry exporter given a custom telemetry provider', () => {
    const mockProvider = new MockTelemetryProvider();
    const mockExporter = new MockTelemetryExporter();
    win._dlo_telemetryProvider = mockProvider;
    win._dlo_telemetryExporter = mockExporter;
    initializeFromWindow();

    // endSpan is defined on MockTelemetryProvider to track span.end() calls
    expectNoCalls(mockProvider, 'endSpan');
    expectNoCalls(mockProvider, 'count');

    const span = Telemetry.startSpan('test span');
    Telemetry.count('test count', 1);
    span.end();

    expectCall(mockProvider, 'endSpan', 1);
    expectCall(mockProvider, 'count', 1);

    // Exporter should be unused if a custom provider is given
    expectNoCalls(mockExporter, 'sendSpan');
    expectNoCalls(mockExporter, 'sendCount');
  });

  it('should not send telemetry registration span if no rules are set', (done) => {
    const mockProvider = new MockTelemetryProvider();
    Telemetry.setProvider(mockProvider);

    // endSpan is defined on MockTelemetryProvider to track span.end() calls
    expectNoCalls(mockProvider, 'endSpan');
    expectNoCalls(mockProvider, 'count');

    const observer = ExpectObserver.getInstance().create({
      rules: [],
    });

    setTimeout(() => {
      ExpectObserver.getInstance().cleanup(observer);
      done();
    }, 900); // the third retry will not occur so it's 250 + 500 for the first and second
  });
});
