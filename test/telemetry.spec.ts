/* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
import { expect } from 'chai';
import 'mocha';

import DefaultTelemetryProvider from '../src/utils/telemetry';
import { MockClass } from './mocks/mock';
import { expectNoCalls, expectParams } from './utils/mocha';

class MockTelemetryExporter extends MockClass {
  sendSpan(): void {}

  sendCount(): void {}
}

describe('DefaultTelemetryProvider', () => {
  describe('startSpan', () => {
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
  });

  describe('count', () => {
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
  });
});
