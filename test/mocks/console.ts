import { MockClass } from './mock';

// NOTE linting is disabled in stubs
/* eslint-disable class-methods-use-this, @typescript-eslint/no-unused-vars */
export default class Console extends MockClass {
  log(message: string): void { }

  error(message: string): void { }

  warn(message: string): void { }

  info(message: string): void { }

  debug(message: string): void { }
}
