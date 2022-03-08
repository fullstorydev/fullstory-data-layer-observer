/* eslint-disable no-console, max-classes-per-file */
import { Logger } from './logger';

/**
 * Optional metadata to include with telemetry events
 */
type Attributes = Record<string, any>;

/**
 * A base telemetry event representing data applicable to all telemetry events
 */
interface TelemetryEvent {
  /**
   * The name of the event
   */
  name: string;

  /**
   * The time at which the event was captured; typically an ISO-8601 UTC string
   */
  timestamp: string;

  /**
   * Optional metadata to include with the event
   */
  attributes?: Attributes;
}

/**
 * A timespan telemetry event which captures the duration of some operation
 */
interface TelemetrySpanEvent extends TelemetryEvent {
  /**
   * The timespan event duration; typically captured in milliseconds
   */
  duration: number;
}

/**
 * A count telemetry event which captures an incrementing count of some measurement
 */
interface TelemetryCountEvent extends TelemetryEvent {
  value: number;
}

/**
 * Sends transient telemetry events to some destination where they may be
 * persisted and analyzed
 */
interface TelemetryExporter {
  /**
   * Sends a timespan event to some destination
   *
   * @param span The timespan event to send
   */
  sendSpan: (span: TelemetrySpanEvent) => void;

  /**
   * Sends a count event to some destination.
   *
   * @param count The count event to send
   */
  sendCount: (count: TelemetryCountEvent) => void;
}

/**
 * A timespan duration which, when ended, should report telemetry to
 * its parent {@link TelemetryProvider}. The parent {@link TelemetryProvider}
 * may export this telemetry for persistence and analysis
 */
interface TelemetrySpan {
  /**
   * Ends the timespan duration, at which point this duration should be
   * reported to the parent {@link TelemetryProvider}.
   */
  end: () => void;
}

/**
 * Captures telemetry events which may be exported to a destination for
 * persistence and analysis. May export telemetry events using a
 * {@link TelemetryExporter}
 */
interface TelemetryProvider {
  /**
   * Starts a new timespan to measure the duration of some operation
   *
   * @param name The name of the timespan event
   * @param attributes Optional metadata to include with the event
   */
  startSpan: (name: string, attributes?: Attributes) => TelemetrySpan

  /**
   * Captures a new increment value for some count
   *
   * @param name The name of the count event
   * @param value The value by which to increment the count event
   * @param attributes Optional metadata to include with the event
   */
  count: (name: string, value: number, attributes?: Attributes) => void;
}

/**
 * A default {@link TelemetrySpan} implementation which handles timespan
 * duration calculation and invokes a given callback with a timespan event
 * when the timespan is ended
 */
class DefaultTelemetrySpan implements TelemetrySpan {
  private readonly startTime: number;

  /**
   * Creates a new {@link DefaultTelemetrySpan} instance
   *
   * @param name The name of the timespan event
   * @param sendSpan The callback to invoke when the timespan is ended
   * @param attributes Optional metadata to include with the event
   */
  constructor(
      private readonly name: string,
      private readonly sendSpan: (span: TelemetrySpanEvent) => void,
      private readonly attributes?: Attributes,
  ) {
    this.startTime = DefaultTelemetrySpan.getCurrentTime();
  }

  /**
   * Ends the timespan, calculating the duration and invoking the given
   * sendSpan callback with a timespan event
   */
  end() {
    try {
      this.sendSpan({
        name: this.name,
        timestamp: new Date().toISOString(),
        attributes: this.attributes,
        duration: DefaultTelemetrySpan.getCurrentTime() - this.startTime,
      });
    } catch (err) {
      Logger.getInstance().debug(`Error sending telemetry span: ${err.message}`);
    }
  }

  private static getCurrentTime(): number {
    return (window.performance && window.performance.now()) || new Date().getTime();
  }
}

/**
 * A default {@link TelemetryProvider} implementation which handles timespan
 * measurement and which sends telemetry events to the given {@link TelemetryExporter}.
 * This provider prevents telemetry collection and exporter invocation from throwing
 * errors -- instead logging these errors at the debug level
 */
export class DefaultTelemetryProvider implements TelemetryProvider {
  /**
   * Creates a new {@link DefaultTelemetryProvider} instance
   *
   * @param exporter The exporter used to send telemetry events
   */
  // eslint-disable-next-line no-empty-function
  constructor(private readonly exporter: TelemetryExporter) {}

  /**
   * Starts and returns a new {@link DefaultTelemetrySpan}
   *
   * @param name The name of the timespan event
   * @param attributes Optional metadata to include with the event
   */
  startSpan(name: string, attributes?: Attributes): TelemetrySpan {
    try {
      return new DefaultTelemetrySpan(
        name,
        this.exporter.sendSpan,
        attributes,
      );
    } catch (err) {
      Logger.getInstance().debug(`Error starting telemetry span: ${err.message}`);
      return {
        end: () => {},
      };
    }
  }

  /**
   * Sends a count event to the given {@link TelemetryExporter}
   *
   * @param name The name of the count event
   * @param value The value by which to increment the count
   * @param attributes Optional metadata to include with the event
   */
  count(name: string, value: number, attributes?: Attributes): void {
    try {
      this.exporter.sendCount({
        name,
        timestamp: new Date().toISOString(),
        attributes,
        value,
      });
    } catch (err) {
      Logger.getInstance().debug(`Error sending telemetry count: ${err.message}`);
    }
  }
}

/**
 * A {@link TelemetryExporter} which writes telemetry events to
 * console.debug
 */
export const consoleTelemetryExporter: TelemetryExporter = {
  /**
   * Writes the given timespan event to console.debug
   *
   * @param span The timespan event to write
   */
  sendSpan: (span: TelemetrySpanEvent) => {
    console.debug('Telemetry Span', span);
  },

  /**
   * Writes the given count event to console.debug
   *
   * @param count The count event to write
   */
  sendCount: (count: TelemetryCountEvent) => {
    console.debug('Telemetry Count', count);
  },
};

/**
 * Telemetry entry point to initialize the singleton {@link TelemetryProvider} or
 * get the current {@link TelemetryProvider}
 */
export class Telemetry {
  private static instance: TelemetryProvider | undefined;

  /**
   * Gets the singleton {@link TelemetryProvider} configured for the Data Layer Observer instance.
   * Initializes the singleton {@link TelemetryProvider} on first call
   *
   * @param provider The {@link TelemetryProvider} to initialize; only effective on first call
   * @param exporter The {@link TelemetryExporter} to use with the default Telemetry Provider; only
   * used if no {@link TelemetryProvider} is given and only effective on first call
   */
  static getInstance(provider?: TelemetryProvider, exporter?: TelemetryExporter): TelemetryProvider {
    if (Telemetry.instance) {
      return Telemetry.instance;
    }

    if (provider) {
      Telemetry.instance = provider;
    } else if (exporter) {
      Telemetry.instance = new DefaultTelemetryProvider(exporter);
    } else {
      Telemetry.instance = new DefaultTelemetryProvider(consoleTelemetryExporter);
    }

    return Telemetry.instance;
  }

  /**
   * Clears the initialized telemetry provider allowing telemetry to be reinitialized. Used
   * within telemetry intialization tests to achieve a clean starting state
   */
  static reset(): void {
    Telemetry.instance = undefined;
  }
}
