/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import 'mocha';
import {
  BrowserType, Browser, Page, chromium, firefox, webkit,
} from 'playwright';

import {
  expectFS, ExpectObserver, setupGlobals, expectGlobal,
} from './mocha';

export interface RulesetTestHarness {
  setUp: (rules: any, dataLayer: any) => Promise<void>;
  tearDown: () => Promise<void>;
  execute: (action: (args: any[]) => void, args?: any[]) => Promise<void>;
  popEvent: (timeoutMs?: number) => Promise<any[]>;
}

interface RulesetTestEnvironment {
  name: string;
  createTestHarness: (rules: any, dataLayer: any) => Promise<RulesetTestHarness>;
}

const dloScriptSrc = process.env.PLAYWRIGHT_DLO_SCRIPT_SRC;

const nodeTestHarness: RulesetTestHarness = {
  setUp: (rules: any, dataLayer: any) => {
    setupGlobals(
      Object.keys(dataLayer).map((key) => [key, dataLayer[key]]),
    );
    ExpectObserver.getInstance().create({ rules });
    return Promise.resolve();
  },

  tearDown: () => {
    ExpectObserver.getInstance().cleanup();
    return Promise.resolve();
  },

  execute: (action: (args: any[]) => void, args?: any[]) => {
    action(args || []);
    return Promise.resolve();
  },

  popEvent: async (timeoutMs: number = 1000) => new Promise<any[]>((resolve, reject) => {
    const startTime = new Date().getTime();

    const checkForEvents = setInterval(() => {
      const currentTime = new Date().getTime();
      if (currentTime - startTime >= timeoutMs) {
        clearInterval(checkForEvents);
        reject(new Error(`Timeout ${timeoutMs} exceeded waiting for FS.event call.`));
      }

      if (expectGlobal('FS').callQueues.event.length) {
        clearInterval(checkForEvents);
        resolve(expectFS('event'));
      }
    }, 50);
  }),
};

class BrowserTestHarness implements RulesetTestHarness {
  private browser: Browser = null!;

  private page: Page = null!;

  constructor(private readonly browserType: BrowserType<{}>) {
    // Empty
  }

  async setUp(rules: any, dataLayer: any) {
    this.browser = await this.browserType.launch();
    this.page = await this.browser.newPage();

    await this.page.evaluate(([localRules, localDataLayer, localDloScriptSrc]) => {
      (window as any)._dlo_rules = localRules;

      Object.keys(localDataLayer).forEach((key) => {
        (window as any)[key] = localDataLayer[key];
      });

      (window as any).events = [];

      (window as any).FS = {
        event: (...args: any) => {
          (window as any).events.push(args);
        },
      };

      const dloScriptTag = document.createElement('script');
      dloScriptTag.src = localDloScriptSrc;
      document.body.appendChild(dloScriptTag);
    }, [rules, dataLayer, dloScriptSrc]);

    // Wait for DLO to initialize
    await this.page.waitForFunction(() => (window as any)._dlo_observer, undefined, { timeout: 1000 });
  }

  async tearDown() {
    await this.browser.close();
  }

  async execute(action: (args: any[]) => void, args?: any[]) {
    await this.page.evaluate(action, args || []);
  }

  async popEvent(timeoutMs: number = 1000) {
    await this.page.waitForFunction(() => (window as any).events.length, undefined, { timeout: timeoutMs });
    return this.page.evaluate(() => (window as any).events.pop());
  }
}

export const getRulesetTestEnvironments = (): RulesetTestEnvironment[] => {
  if (dloScriptSrc) {
    return [chromium, firefox, webkit].map((browserType) => ({
      name: browserType.name(),
      createTestHarness: async (rules: any, dataLayer: any) => {
        const testHarness = new BrowserTestHarness(browserType);
        await testHarness.setUp(rules, dataLayer);
        return testHarness;
      },
    }));
  }
  return [{
    name: 'node',
    createTestHarness: async (rules: any, dataLayer: any) => {
      const testHarness = nodeTestHarness;
      await testHarness.setUp(rules, dataLayer);
      return testHarness;
    },
  }];
};
