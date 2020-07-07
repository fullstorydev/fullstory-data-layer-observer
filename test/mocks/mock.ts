export interface Call {
  parameters: any[];
  result: string | null | void;
}

export class MockClass {
  public callQueues: { [methodName: string]: Call[] } = {}

  constructor() {
    Object.getOwnPropertyNames(this.constructor.prototype).forEach((methodName: string) => {
      if (methodName !== 'constructor') {
        this.callQueues[methodName] = [];
        const originalMethod: Function = (this as any)[methodName].bind(this);
        (this as any)[methodName] = (...parameters: any[]) => {
          const result = originalMethod(...parameters);
          this.callQueues[methodName].push({
            parameters,
            result,
          });
          return result;
        };
      }
    });
  }
}
