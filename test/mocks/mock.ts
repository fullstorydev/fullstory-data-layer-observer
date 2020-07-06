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