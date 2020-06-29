
export class MockClass {

  public callQueues: { [methodName: string]: Call[] } = {}

  constructor(){
    for (const methodName of Object.getOwnPropertyNames(this.constructor.prototype)) {
      if (methodName === 'constructor') continue;
      this.callQueues[methodName] = [];
      const originalMethod = this[methodName].bind(this);
      this[methodName] = (...params) => {
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
  constructor(public parameters: object, public result: string | null | void){}
}
