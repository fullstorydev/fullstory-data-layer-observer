# Data Layer Observer Telemetry

DLO's telemetry implementation is inspired by [Open Telemetry](https://opentelemetry.io/). While DLO doesn't depend on Open Telemetry, telemetry can be configured to be measured by another provider like Open Telemetry or exported to a custom destination for visibility. Learn how to measure telemetry and export telemetry to the browser console using [built-in options](../README.md#telemetry).

## Exporting Telemetry to a Custom Destination

By default, a `DefaultTelemetryProvider` instance is responsible for measuring telemetry (elapsed time, error counts, etc.). If the default telemetry measurement behavior is sufficient, a custom `TelemetryExporter` may be configured to send measured telemetry to a custom destination for visibility. Within this `TelemetryExporter`, telemetry events can also be transformed to the format expected by the custom destination.

```
window['_dlo_telemetryExporter']= {
  sendSpan: (span: TelemetrySpanEvent): void => {
    // Send span to custom telemetry destination, transforming to expected payload
    myTelemetryDestination.post('span', {
      name: span.name,
      value: span.duration,
      metadata: span.attributes,
      timestamp: span.timestamp
    });
  },

  sendCount: (count: TelemetryCountEvent): void => {
    // Send count to custom telemetry destination, transforming to expected payload
    myTelemetryDestination.post('count', {
      name: count.name,
      value: count.value,
      metadata: count.attributes,
      timestamp: count.timestamp
    });
  }
}
```

## Customizing Telemetry Measurement

If `DefaultTelemetryProvider` measurement behavior is insufficient, telemetry measurement and exporting can be entirely overridden by configuring a custom `TelemetryProvider`. By configuring a custom `TelemetryProvider` other telemetry libraries like Open Telemetry may be used for telemetry measurement and exporting.

### Open Telemetry Example

```
import opentelemetry, { Tracer } from '@opentelemetry/api';
import { BasicTracerProvider, SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { Meter, Counter } from '@opentelemetry/api-metrics';
import { MeterProvider, ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics-base';

class OpenTelemetryProvider {
  private readonly tracer: Tracer;

  private readonly meter: Meter;

  private readonly counters: Record<string, Counter> = {};

  constructor() {
    const provider = new BasicTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    provider.register();

    this.tracer = opentelemetry.trace.getTracer('example-basic-tracer');

    const meterProvider = new MeterProvider();
    meterProvider.addMetricReader(new PeriodicExportingMetricReader({
      exportIntervalMillis: 1000,
      exporter: new ConsoleMetricExporter(),
    }));

    this.meter = meterProvider.getMeter('example-basic-meter');
  }

  startSpan(name: string, attributes?: Attributes): TelemetrySpan {
    return this.tracer.startSpan(name, attributes);
  }

  count(name: string, value: number, attributes?: Attributes) {
    if (!this.counters[name]) {
      this.counters[name] = this.meter.createCounter(name);
    }
    this.counters[name].add(value, attributes);
  }
}

// Before DLO loads and initializes
window['_dlo_telemetryProvider'] = new OpenTelemetryProvider();

```

> **Tip:** When `window['_dlo_telemetryProvider']` is defined, `window['_dlo_telemetryExporter']` is ignored. It is assumed a custom `TelemetryProvider` implementation will be responsible for both measuring and exporting telemetry.
