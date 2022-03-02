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
   * @param {TelemetrySpanEvent} span The timespan event to send
   */
  sendSpan: (span: TelemetrySpanEvent) => void;

  /**
   * Sends a count event to some destination.
   *
   * @param {TelemetryCountEvent} count The count event to send
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
   * @param {string} name The name of the timespan event
   * @param {Attributes | undefined} attributes Optional metadata to include with the event
   */
  startSpan: (name: string, attributes?: Attributes) => TelemetrySpan

  /**
   * Captures a new increment value for some count
   *
   * @param {string} name The name of the count event
   * @param {number} value The value by which to increment the count event
   * @param {Attributes | undefined} attributes Optional metadata to include with the event
   */
  count: (name: string, value: number, attributes?: Attributes) => void;
}
