/* eslint-disable max-classes-per-file */
import { Logger } from './logger';

type Attributes = Record<string, any>;

interface TelemetrySpanEvent {
  name: string;
  timestamp: string;
  duration: number;
  attributes?: Attributes;
}

interface TelemetryCountEvent {
  name: string;
  timestamp: string;
  value: number;
  attributes?: Attributes;
}

const getCurrentTime = (): number => (performance && performance.now()) || new Date().getTime();

interface TelemetryExporter {
  sendSpan: (span: TelemetrySpanEvent) => void;
  sendCount: (count: TelemetryCountEvent) => void;
}

export const consoleTelemetryExporter: TelemetryExporter = {
  sendSpan: (span: TelemetrySpanEvent) => {
    // eslint-disable-next-line no-console
    console.debug('Telemetry Span', span);
  },

  sendCount: (count: TelemetryCountEvent) => {
    // eslint-disable-next-line no-console
    console.debug('Telemetry Count', count);
  },
};

interface TelemetrySpan {
  end: () => void;
}

class DefaultTelemetrySpan implements TelemetrySpan {
  private readonly startTime: number;

  constructor(
      private readonly name: string,
      private readonly sendSpan: (span: TelemetrySpanEvent) => void,
      private readonly attributes?: Attributes,
  ) {
    this.startTime = getCurrentTime();
  }

  end() {
    this.sendSpan({
      name: this.name,
      timestamp: new Date().toISOString(),
      duration: getCurrentTime() - this.startTime,
      attributes: this.attributes,
    });
  }
}

interface TelemetryProvider {
  startSpan: (name: string, attributes?: Attributes) => TelemetrySpan
  count: (name: string, value: number, attributes?: Attributes) => void;
}

export class DefaultTelemetryProvider implements TelemetryProvider {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly exporter: TelemetryExporter) {}

  startSpan(name: string, attributes?: Attributes): TelemetrySpan {
    return new DefaultTelemetrySpan(name, (span: TelemetrySpanEvent) => {
      this.exporter.sendSpan(span);
    }, attributes);
  }

  count(name: string, value: number, attributes?: Attributes) {
    this.exporter.sendCount({
      name,
      timestamp: new Date().toISOString(),
      value,
      attributes,
    });
  }
}

class SafeTelemetrySpan implements TelemetrySpan {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly span: TelemetrySpan) {}

  end() {
    try {
      this.span.end();
    } catch (err) {
      Logger.getInstance().debug('Error ending telemetry span', err.message);
    }
  }
}

class SafeTelemetryProvider implements TelemetryProvider {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly provider: TelemetryProvider) {}

  startSpan(name: string, attributes?: Attributes): TelemetrySpan {
    try {
      return new SafeTelemetrySpan(this.provider.startSpan(name, attributes));
    } catch (err) {
      Logger.getInstance().debug('Error starting telemetry span', err.message);
      return {
        end: () => {},
      };
    }
  }

  count(name: string, value: number, attributes?: Attributes) {
    try {
      this.provider.count(name, value, attributes);
    } catch (err) {
      Logger.getInstance().debug('Error submitting telemetry count', err.message);
    }
  }
}

export class Telemetry {
  private static instance: TelemetryProvider;

  static getInstance(provider?: TelemetryProvider, exporter?: TelemetryExporter): TelemetryProvider {
    if (!Telemetry.instance) {
      if (provider) {
        Telemetry.instance = new SafeTelemetryProvider(provider);
      } else if (exporter) {
        Telemetry.instance = new SafeTelemetryProvider(new DefaultTelemetryProvider(exporter));
      } else {
        return new SafeTelemetryProvider(new DefaultTelemetryProvider(consoleTelemetryExporter));
      }
    }

    return Telemetry.instance;
  }
}
