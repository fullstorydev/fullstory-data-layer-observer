import deepcopy from 'deepcopy';
import { expect } from 'chai';

import FullStory from '../mocks/fullstory-recording';
import { MockClass, Call } from '../mocks/mock';
import { DataLayerDetail } from '../../src/event';
import { DataLayerObserver, DataLayerConfig, DataLayerRule } from '../../src/observer';
import MonitorFactory from '../../src/monitor-factory';
import { BuiltinOptions, OperatorFactory } from '../../src/factory';

/**
 * Gets a globalThis object and expects a truthy value.
 * @param key The key corresponding to the global object (e.g. FS in window['FS']).
 */
export function expectGlobal(key: string): any {
  const value = (globalThis as any)[key] || (window as any)[key];
  expect(value).to.be.ok;
  return value;
}

/**
 * Expects a truthy value and stores it in globalThis.
 * @param key The key corresponding to the global object (e.g. FS in window['FS']).
 * @param value Object that when provided will set the global's value
 */
export function setGlobal(key: string, value: any) {
  expect(value).to.be.ok;
  (globalThis as any)[key] = value;
}

/**
 * A setup function that populates globalThis (e.g. window) with desired values.
 * Each value will be deep copied to prevent cross-contamination between tests.
 * Additionally, a FullStory mock will also be added to the `FS` key.
 * @param globals List of global key:value pairs (e.g. ['FS', value])
 */
export function setupGlobals(globals: [string, any][]) {
  expect(globals.length, 'A list of key:value pairs should be provided, if not, use `setGlobal`').to.be.greaterThan(0);

  globals.forEach((global) => {
    expect(global[0], 'Key must be provided to store global value').to.be.ok;
    expect(global[1], 'Value must be defined or non-null').to.not.be.undefined;
    setGlobal(global[0], deepcopy(global[1]));
  });

  setGlobal('FS', new FullStory());
}

/**
 * Expects deeply equality between two objects.
 * @param a First object to compare
 * @param b Second object to compare
 */
export function expectEqual(a: any, b: any) {
  expect(a).to.eql(b);
}

/**
 * Expects two objects to have matching values for given key(s).
 * @param a First object to compare
 * @param b Second object to compare
 * @param key List of key(s)
 */
export function expectMatch(a: any, b: any, ...key: string[]) {
  key.forEach((k) => expect(a[k]).to.eql(b[k]));
}

/**
 * Expects a specific type for an operand.
 * @param type The expected type
 * @param operand The operand to check
 */
export function expectType(type: string, operand: any) {
  expect(typeof operand).to.eql(type);
}

/**
 * Expects a list of specific properties to be undefined.
 * @param keys List of properties to check if defined
 * @param object Object that should not contain keys
 */
export function expectUndefined(object: any, ...key: string[]) {
  key.forEach((k) => expect(object[k]).to.be.undefined);
}

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
  expect(mock.callQueues[methodName].length, `Unexpected data in queue
  ${JSON.stringify(mock.callQueues[methodName], null, 2)}`).to.eq(0);
}

/**
 * Tests whether a call queue has one Call and returns the Call's parameters.
 * @param mock the MockClass
 * @param methodName the method's name
 * @param callQueueLength (optional) expected number of Calls in the queue; default is >= 0
 */
export function expectParams(mock: MockClass, methodName: string, callQueueLength?: number): any[] {
  const { parameters } = expectCall(mock, methodName, callQueueLength);
  expect(parameters).to.be.ok;
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
      expect(customEvent.detail.args!).to.eql(expectedValue);
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
      // We can end up with multiple rules for a single array target
      expect(observer.handlers.length >= config.rules.length);
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
      MonitorFactory.getInstance().remove(handler.target.path, true);
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

/**
 * Expects an Operator's options to be valid.
 * @param options The OperatorOptions passed to the Operator
 * @param message An optional message that describes the use case of options
 */
export function expectValid(options: BuiltinOptions, message?: string) {
  const { name } = options;
  expect(() => OperatorFactory.create(name, options).validate(), message).to.not.throw();
}

/**
 * Expects an Operator's options to be invalid.
 * @param operatorName The Operator's name
 * @param options The OperatorOptions passed to the Operator
 * @param message An optional message that describes the use case of options
 */
export function expectInvalid(options: BuiltinOptions, message?: string) {
  const { name } = options;
  expect(() => OperatorFactory.create(name, options).validate(), message).to.throw();
}

/**
 * Expects and returns a specific rule from a list of rules.
 * If a ruleset is not provided, the global `_dlo_rules` value will be used.
 * @param id ID of the rule to retrieve
 * @param ruleset Expando containing ruleset
 */
export function expectRule(id: string, ruleset?: string): DataLayerRule {
  const rules = ruleset ? expectGlobal(ruleset) : expectGlobal('_dlo_rules');
  expect(rules).to.be.ok;
  expect(rules.length).to.be.greaterThan(0);

  const rule = rules.find((r: DataLayerRule) => r.id === id);
  expect(rule).to.be.ok;

  return rule!;
}

/**
 * Valid FullStory object method names.
 */
type FSMethodName = 'event' | 'identify' | 'log' | 'setVars' | 'setUserVars';

/**
 * A convenience method for `expectParams` that checks the global FullStory object.
 * @param methodName FullStory API function (`methodName` arg for `expectParams`)
 * @param namespace Global object if FullStory is not `FS`
 */
export function expectFS(methodName: FSMethodName, namespace = 'FS'): any[] {
  const fs = expectGlobal(namespace);
  expect(fs).to.be.ok;
  return expectParams(fs, methodName);
}

/**
 * Similar to `expectFS`, `waitForFS` is a convenicne method for `expectParams` that
 * checks the global FullStory object. Unlike `expectFS`, `waitForFS` supports waiting
 * for a global FullStory object method call within a timeout period.
 * @param methodName FullStory API function (`methodName` arg for `expectParams`)
 * @param namespace Global object if FullStory is not `FS`
 * @param timeout Time in milliseconds after which the Promise is rejected
 */
export function waitForFS(methodName: FSMethodName, namespace = 'FS', timeout: number = 1000): Promise<any[]> {
  const startTime = new Date().getTime();

  return new Promise<any[]>((resolve, reject) => {
    const expectFSInterval = setInterval(() => {
      try {
        const params = expectFS(methodName, namespace);
        clearInterval(expectFSInterval);
        resolve(params);
      } catch {
        const elapsedTime = new Date().getTime() - startTime;
        if (elapsedTime >= timeout) {
          clearInterval(expectFSInterval);
          reject(new Error('waitForFS timeout exceeded.'));
        }
      }
    }, 50);
  });
}
