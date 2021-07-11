/* eslint-disable import/prefer-default-export, class-methods-use-this, @typescript-eslint/no-unused-vars */
import { LogEvent } from '../../src/utils/logger';
import { MockClass } from './mock';

export class MockAppender extends MockClass {
  log(event: LogEvent) { }
}
