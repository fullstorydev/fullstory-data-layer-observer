import { expect } from 'chai';

import { MockClass, Call } from '../mocks/mock';
import { DataLayerDetail } from '../../src/event';

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
