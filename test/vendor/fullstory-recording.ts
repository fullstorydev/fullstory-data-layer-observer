import { MockClass } from '../mock';

export class FullStory extends MockClass {
  consent(userConsents?: boolean): void {}

  disableConsole(): void {}
  
  enableConsole(): void {}
  
  event(eventName: string, eventProperties: object, source?: string): string | null {
    return null
  }
  
  identify(uid: string, customVars?: object): void {}
  
  anonymize(): void {}
  
  log(...msg: any[]): void {}
  
  restart(): void {}
  
  shutdown(): void {}
  
  setUserVars(customVars: object): void {}

  getCurrentSession(): string | null {
    return null
  }

  getCurrentSessionURL(now?: boolean): string | null {
    return null
  }
}
