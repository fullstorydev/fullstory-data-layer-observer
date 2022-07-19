/* eslint-disable no-console, max-classes-per-file */
import { Logger } from './logger';
import pkg from '../../package.json';

/**
 * Constants used for telemetry event names. These string values should never change
 */
export const telemetryType = {
  initializationSpan: 'dlo_init_span',
  ruleCollectionSpan: 'dlo_rule_collection_span',
  ruleRegistrationSpan: 'dlo_rule_registration_span',
  handleEventSpan: 'dlo_handle_event_span',
  clientError: 'dlo_client_error',
};

/**
 * Constants used for error types in client error telemetry. These string values should
 * never change
 */
export const errorType = {
  operatorError: 'dlo_operator_error',
  monitorRemovalError: 'dlo_monitor_removal_error',
  monitorCallError: 'dlo_monitor_call_error',
  monitorEmitError: 'dlo_monitor_emit_error',
  observerReadError: 'dlo_observer_read_error',
  invalidRuleError: 'dlo_invalid_rule_error',
  ruleRegistrationError: 'dlo_rule_registration_error',
  observerInitializationError: 'dlo_observer_init_error',
};

/**
 * Default telemetry attributes for DLO
 */
export const defaultDloAttributes = {
  version: pkg.version,
};

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
   * Ends the timespan, calculating the duration and invoking the given sendSpan
   * callback with a timespan event. Only exports valid durations.
   */
  end() {
    try {
      const duration = DefaultTelemetrySpan.getCurrentTime() - this.startTime;
      if (duration < 0 || Number.isNaN(duration)) {
        Logger.getInstance().debug(`ignoring span, calculated an invalid duration: ${duration}`);
        return;
      }

      this.sendSpan({
        name: this.name,
        timestamp: new Date().toISOString(),
        attributes: this.attributes,
        duration,
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
  private defaultAttributes: Attributes = {};

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
        this.mergeWithDefaultAttributes(attributes),
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
        attributes: this.mergeWithDefaultAttributes(attributes),
        value,
      });
    } catch (err) {
      Logger.getInstance().debug(`Error sending telemetry count: ${err.message}`);
    }
  }

  /**
   * Configures default attributes which are added as metadata to all collected
   * collected telemetry events
   *
   * @param attributes The default attributes to include with all telemetry events
   */
  withDefaultAttributes(attributes: Attributes): DefaultTelemetryProvider {
    this.defaultAttributes = attributes;
    return this;
  }

  private mergeWithDefaultAttributes(attributes?: Attributes): Attributes {
    return { ...this.defaultAttributes, ...attributes };
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
 * A {@link TelemetryExporter} which does nothing with telemetry events
 */
export const nullTelemetryExporter: TelemetryExporter = {
  /**
   * Does nothing with the timespan event
   */
  sendSpan: () => {},

  /**
   * Does nothing with the count event
   */
  sendCount: () => {},
};

/**
 * Telemetry entry point to initialize the singleton {@link TelemetryProvider} or
 * get the current {@link TelemetryProvider}
 */
export class Telemetry {
  private static instance: TelemetryProvider | undefined;

  /**
   * Sets the singleton {@link TelemetryProvider} to the given provider
   *
   * @param provider The {@link TelemetryProvider} for collecting and sending telemetry
   */
  static setProvider(provider: TelemetryProvider) {
    Telemetry.instance = provider;
  }

  /**
   * Returns a {@link DefaultTelemetryProvider} which sends telemetry to the given
   * telemetry exporter
   *
   * @param exporter The exporter for sending telemetry
   */
  static withExporter(exporter: 'console' | TelemetryExporter | undefined) : DefaultTelemetryProvider {
    if (exporter === 'console') {
      return new DefaultTelemetryProvider(consoleTelemetryExporter);
    }
    if (exporter && typeof exporter !== 'string') {
      return new DefaultTelemetryProvider(exporter);
    }
    return new DefaultTelemetryProvider(nullTelemetryExporter);
  }

  /**
   * Gets the configured {@link TelemetryProvider} instance. Initializes a default
   * telemetry provider if a telemetry provider hasn't been set
   */
  private static getInstance(): TelemetryProvider {
    if (!Telemetry.instance) {
      Telemetry.instance = Telemetry.withExporter(nullTelemetryExporter);
    }
    return Telemetry.instance;
  }

  /**
   * Starts a new timespan to measure the duration of some operation
   *
   * @param name The name of the timespan event
   * @param attributes Optional metadata to include with the event
   */
  static startSpan(name: string, attributes?: Attributes): TelemetrySpan {
    return Telemetry.getInstance().startSpan(name, attributes);
  }

  /**
   * Captures a new increment value for some count
   *
   * @param name The name of the count event
   * @param value The value by which to increment the count event
   * @param attributes Optional metadata to include with the event
   */
  static count(name: string, value: number, attributes?: Attributes): void {
    Telemetry.getInstance().count(name, value, attributes);
  }

  /**
   * Convenience function for collecting client errors as telemetry counts,
   * reporting the error type as metadata
   *
   * @param type The error type
   */
  static error(type: string): void {
    Telemetry.count(telemetryType.clientError, 1, { errorType: type });
  }
}
