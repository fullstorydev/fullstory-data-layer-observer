
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
 * @param methodName the call queue's method name
 */
export function expectCall(mock: MockClass, methodName: string): Call {
  expect(mock.callQueues[methodName].length).to.eq(1);
  return mock.callQueues[methodName].pop()!;
}

/**
 * Tests whether a call queue has one Call and returns the Call's parameters.
 * @param mock the MockClass
 * @param methodName the call queue's method name
 */
export function expectParams(mock: MockClass, methodName: string): any[] {
  const { parameters } = expectCall(mock, methodName);
  expect(parameters).to.not.be.undefined;
  expect(parameters).to.not.be.null;
  return parameters;
}
