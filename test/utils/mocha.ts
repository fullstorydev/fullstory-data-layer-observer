import { expect } from 'chai';

import { MockClass, Call } from '../mocks/mock';
import { DataLayerDetail } from '../../src/event';
import { DataLayerObserver, DataLayerConfig } from '../../src/observer';

/**
 * Tests whether a call queue has one Call and returns it.
 * @param mock the MockClass
 * @param methodName the method's name
 * @param callQueueLength (optional) expected number of Calls in the queue; default is >= 0
 */
export function expectCall(mock: MockClass, methodName: string, callQueueLength?: number): Call {
  if (callQueueLength !== undefined) {
    if (callQueueLength <= 0) throw new Error('Use expectNoCalls for empty call queues');
    expect(mock.callQueues[methodName].length).to.eq(callQueueLength);
  } else {
    expect(mock.callQueues[methodName].length).to.be.greaterThan(0);
  }

  return mock.callQueues[methodName].pop()!;
}

/**
 * Tests whether a method call has not been made.
 * @param mock the MockClass
 * @param methodName the method's name
 * @param callQueueLength (optional) expected number of Calls in the queue; default is >= 0
 */
export function expectNoCalls(mock: MockClass, methodName: string): void {
  expect(mock.callQueues[methodName].length).to.eq(0);
}

/**
 * Tests whether a call queue has one Call and returns the Call's parameters.
 * @param mock the MockClass
 * @param methodName the method's name
 * @param callQueueLength (optional) expected number of Calls in the queue; default is >= 0
 */
export function expectParams(mock: MockClass, methodName: string, callQueueLength?: number): any[] {
  const { parameters } = expectCall(mock, methodName, callQueueLength);
  expect(parameters).to.not.be.undefined;
  expect(parameters).to.not.be.null;
  return parameters;
}

/**
 * Create an EventListener that tests the events fired match expected values.
 * This harness supports async events by using Mocha's done callback.
 * @param expectedType the expected type string
 * @param expectedValue the expected value in the object event
 * @param done Mocha's done callback to signal the tests passed
 */
export function expectEventListener(type: string, expectedValue: any, done: Mocha.Done) {
  expect(expectedValue).to.not.be.undefined;

  const listener = (event: Event) => {
    // remove the listener to clean up for the next test
    window.removeEventListener(type, listener);

    expect(event).to.not.be.undefined;
    expect(event.type).to.eq(type);

    const customEvent = event as CustomEvent<DataLayerDetail>;
    expect(customEvent.detail).to.not.be.undefined;

    if (customEvent.detail.value) {
      expect(customEvent.detail.value).to.eq(expectedValue);
    }

    if (customEvent.detail.args) {
      expect(customEvent.detail.args).to.not.be.undefined;
      expect(customEvent.detail.args!.length).to.eq(expectedValue.length);

      customEvent.detail.args!.forEach((arg: any, i: number) => expect(expectedValue[i] === arg));
    }

    done();
  };

  window.addEventListener(type, listener);
}

/**
 * Manages the lifecycle of DataLayerObservers to clean up properly.
 */
export class ExpectObserver {
  static instance: ExpectObserver;

  observers: DataLayerObserver[];

  private constructor() {
    this.observers = [];
  }

  /**
   * Creates a DataLayerObserver.
   * @param config that defines the DataLayerConfig
   * @param expectHandlers when true checks there is a handler for each rule
   */
  create(config: DataLayerConfig, expectHandlers = true): DataLayerObserver {
    const observer = new DataLayerObserver(config);
    expect(observer).to.not.be.undefined;
    expect(observer).to.not.be.null;

    if (expectHandlers) {
      expect(observer.handlers.length).to.eq(config.rules.length);
    }

    if (config.rules.find((rule) => rule.monitor === undefined || rule.monitor === true)) {
      expect(Object.getOwnPropertyNames(observer.monitors).length).be.greaterThan(0);
    }

    this.observers.push(observer);

    return observer;
  }

  /**
   * Cleans up an observer by removing its EventListener from the window.
   * If no observer is defined, all observers previously registered are cleaned up.
   * @param observer to be cleaned up.
   */
  cleanup(observer?: DataLayerObserver) {
    if (observer) {
      this.destroy(observer);
    } else {
      this.observers.forEach((o) => {
        this.destroy(o);
      });
    }
  }

  /**
   * Creates an DataLayerObserver with default DataLayerConfig.
   */
  default(): DataLayerObserver {
    const observer = new DataLayerObserver();

    expect(observer).to.not.be.undefined;
    expect(observer).to.not.be.null;

    this.observers.push(observer);

    return observer;
  }

  /**
   * Cleans up an observer by removing its EventListener from the window.
   * @param observer to be cleaned up.
   */
  private destroy(observer: DataLayerObserver) {
    observer.handlers.forEach((handler) => {
      handler.stop();
    });

    const i = this.observers.indexOf(observer);
    if (i > -1) {
      this.observers.splice(i, 1);
    }
  }

  static getInstance(): ExpectObserver {
    if (!ExpectObserver.instance) {
      ExpectObserver.instance = new ExpectObserver();
    }

    return ExpectObserver.instance;
  }
}
