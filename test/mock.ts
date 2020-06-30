
import { expect } from 'chai';

export class MockClass {

  public callQueues: { [methodName: string]: Call[] } = {}

  constructor(){
    for (const methodName of Object.getOwnPropertyNames(this.constructor.prototype)) {
      if (methodName === 'constructor') continue;
      this.callQueues[methodName] = [];
      const originalMethod: Function = (this as any)[methodName].bind(this);
      (this as any)[methodName] = (...params: any[]) => {
        const result = originalMethod(...params);
        this.callQueues[methodName].push(new Call(
          params,
          result
        ));
        return result;
      };
    }
  }
}

export class Call {
  constructor(public parameters: any[], public result: string | null | void){}
}

/**
 * Tests whether a call queue has one Call and returns it.
 * @param mock the MockClass
 * @param methodName the method's name
 * @param callQueueLength an optional expected number of Calls in the queue; defaults to greater than 0
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
 * @param callQueueLength an optional expected number of Calls in the queue; defaults to greater than 0
 */
export function expectNoCalls(mock: MockClass, methodName: string): void {
  expect(mock.callQueues[methodName].length).to.eq(0);
}


/**
 * Tests whether a call queue has one Call and returns the Call's parameters.
 * @param mock the MockClass
 * @param methodName the method's name
 * @param callQueueLength an optional expected number of Calls in the queue; defaults to greater than 0
 */
export function expectParams(mock: MockClass, methodName: string, callQueueLength?: number): any[] {
  const { parameters } = expectCall(mock, methodName, callQueueLength);
  expect(parameters).to.not.be.undefined;
  expect(parameters).to.not.be.null;
  return parameters;
}
