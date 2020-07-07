import { MockClass } from './mock';

export class Console extends MockClass {
  log(message: string): void { }

  error(message: string): void { }

  warn(message: string): void { }

  info(message: string): void { }

  debug(message: string): void { }
}
