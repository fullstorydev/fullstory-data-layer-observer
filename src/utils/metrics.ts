/* eslint-disable no-console, max-classes-per-file */

type EventType = 'INTEGRATION_INITIALIZED' | 'INTEGRATION_ACTIVITY' | 'TODO'
type EventStatus = 'UNKNOWN' | 'SUCCESS' | 'FAILURE'
type EventMetadata = Record<string, string | number>;

export type Metric = {
    type: EventType;
    status: EventStatus;
    metadata: EventMetadata;
}

export interface MetricReporter {
    // FS('stat', {
    //   eventType: "INTEGRATION_ACTIVITY",
    //   payload: {
    //      provider_id: "DLO",
    //      event_status: "SUCCESS",
    //      metadata: { test: "test" }
    //   }
    // })

    report(metric: Metric): void;
}

export class ConsoleReporter implements MetricReporter {
  /* eslint-disable class-methods-use-this */
  report(metric: Metric): void {
    const consoleMessage = `REPORTING: ${metric.type}, ${metric.status}, ${JSON.stringify(metric.metadata)}`;
    console.debug(consoleMessage);
  }
}

export class FullStoryReporter implements MetricReporter {
      static readonly debounceTime = 250;

      private prevMetric?: Metric;

      private timeoutId: number | null = null;

      /* eslint-disable class-methods-use-this */
      report(metric: Metric): void {
        const fs = (window as any)[(window as any)._fs_namespace]; // eslint-disable-line no-underscore-dangle

        const providerId = 'DLO';
        // eslint-disable-next-line no-underscore-dangle
        if (fs) {
          const { type, status, metadata } = metric;

          if (this.isDuplicate(metric)) {
            // begin debouncing log events so multiple instances don't cause rate limiting issue
            if (typeof this.timeoutId === 'number') {
              window.clearTimeout(this.timeoutId);
            }

            this.timeoutId = window.setTimeout(() => {
              this.timeoutId = null;
              this.fsStat(fs, type, providerId, status, metadata);
            }, FullStoryReporter.debounceTime);
          } else {
            this.fsStat(fs, type, providerId, status, metadata);
          }

          this.prevMetric = metric;
        }
      }

      private fsStat(fs: any, type: string, providerId: string,
        status: string, metadata: EventMetadata) {
        fs('stat', {
          eventType: type,
          payload: {
            provider_id: providerId,
            event_status: status,
            metadata,
          },
        });
      }

      /**
       * Checks if a LogEvent is a duplicate of the previous LogEvent.
       * This checks the message, source, and reason.  All 3 need to match to be considered a
       * duplicate.
       * @param event to compare against the last LogEvent
       */
      private isDuplicate(metric: Metric) {
        const { type, status, metadata } = metric;

        if (!this.prevMetric) {
          return false;
        }

        const { type: prevType, status: prevStatus, metadata: prevMetadata } = this.prevMetric;

        return type === prevType && status === prevStatus && this.areEqual(metadata, prevMetadata);
      }

      // WE'RE CHECKING IF RECORDS ARE EQUAL!!!
      private areEqual(a: EventMetadata, b: EventMetadata) {
        if ((a !== b) && (a == null || b == null)) { return false; }
        if (Object.keys(a).length !== Object.keys(b).length) { return false; }

        return !Object.keys(a).some((k) => a[k] !== b[k]);
      }
}
export class Metrics implements MetricReporter {
    private static instance: Metrics;

    reporter: MetricReporter;

    level = 1;

    constructor(reporter = 'console') {
      switch (reporter) {
        case 'fullstory':
          this.reporter = new FullStoryReporter();
          break;
        case 'console':
        default:
          this.reporter = new ConsoleReporter();
      }
    }

    static getInstance(reporter?: string): Metrics {
      if (!Metrics.instance) {
        Metrics.instance = new Metrics(reporter);
      }
      return Metrics.instance;
    }

    report(metric: Metric): void {
      this.reporter.report(metric);
    }
}
