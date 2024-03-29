/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
import 'mocha';
import {
  Browser, Page, chromium, firefox, webkit,
} from 'playwright';

import {
  expectFS, ExpectObserver, setupGlobals, expectGlobal,
} from './mocha';
import { DataLayerObserver, DataLayerRule } from '../../src/observer';
import { ConsoleAppender, Logger } from '../../src/utils/logger';

export interface RulesetTestHarness {
  setUp: (rules: DataLayerRule[], dataLayer: any) => Promise<void>;
  tearDown: () => Promise<void>;
  execute: (action: (args: any[]) => void, args?: any[]) => Promise<void>;
  popEvent: (timeoutMs?: number) => Promise<any>;
  popError: (timeoutMs?: number) => Promise<any>;
}

interface RulesetTestEnvironment {
  name: string;
  createTestHarness: (rules: DataLayerRule[], dataLayer: any) => Promise<RulesetTestHarness>;
  tearDown: () => Promise<void>;
}

const isBrowserTest = process.env.DLO_RUN_BROWSER_TESTS;
const dloScriptSrc = process.env.PLAYWRIGHT_DLO_SCRIPT_SRC;

class NodeTestHarness implements RulesetTestHarness {
  private originalConsole: Console;

  private mockConsole: Console;

  private readonly errors: any[] = [];

  constructor() {
    this.originalConsole = globalThis.console;
    this.mockConsole = {
      ...this.originalConsole,
      error: (...args: any[]) => {
        this.errors.push(...args);
        this.originalConsole.error(...args);
      },
    };
  }

  setUp(rules: DataLayerRule[], dataLayer: any) {
    setupGlobals(
      Object.keys(dataLayer).map((key) => [key, dataLayer[key]]),
    );
    setupGlobals([
      ['console', this.mockConsole],
    ]);
    ExpectObserver.getInstance().create({ rules });
    return Promise.resolve();
  }

  tearDown() {
    setupGlobals([
      ['console', this.originalConsole],
    ]);
    ExpectObserver.getInstance().cleanup();
    return Promise.resolve();
  }

  execute(action: (args: any[]) => void, args?: any[]) {
    action(args || []);
    return Promise.resolve();
  }

  popEvent(timeoutMs: number = 1000) {
    return new Promise<any>((resolve) => {
      const startTime = new Date().getTime();

      const checkForEvents = setInterval(() => {
        const currentTime = new Date().getTime();
        if (currentTime - startTime >= timeoutMs) {
          clearInterval(checkForEvents);
          resolve(undefined);
        }

        if (expectGlobal('FS').callQueues.event.length) {
          clearInterval(checkForEvents);
          resolve(expectFS('event'));
        }
      }, 50);
    });
  }

  popError() {
    return Promise.resolve(this.errors.pop());
  }
}

declare global {
  interface Window extends Record<string, any> {
    // eslint-disable-next-line camelcase
    _dlo_rules?: DataLayerRule[];
    events: any[];
    errors: any[];
    FS?: {
      event: (args: any[]) => void
    };
    // eslint-disable-next-line camelcase
    _dlo_observer?: DataLayerObserver;
  }
}

class BrowserTestHarness implements RulesetTestHarness {
  private page: Page = null!;

  constructor(private readonly browser: Browser) {
    if (!dloScriptSrc) {
      throw new Error(
        'PLAYWRIGHT_DLO_SCRIPT_SRC must be configured with a DLO library script location for browser tests.',
      );
    }
  }

  async setUp(rules: DataLayerRule[], dataLayer: any) {
    this.page = await this.browser.newPage();

    await this.page.evaluate(([localRules, localDataLayer, localDloScriptSrc]) => {
      // This allows node and playwright tests to reference the same global/window name.
      const globalThis = window;

      globalThis._dlo_rules = localRules;

      Object.keys(localDataLayer).forEach((key) => {
        globalThis[key] = localDataLayer[key];
      });

      globalThis.events = [];
      globalThis.errors = [];

      globalThis.FS = {
        event: (...args: any) => {
          globalThis.events.push(args);
        },
      };

      globalThis.console.error = (...args: any) => {
        globalThis.errors.push(...args);
      };

      const dloScriptTag = document.createElement('script');
      dloScriptTag.src = localDloScriptSrc;
      document.body.appendChild(dloScriptTag);
    }, [rules, dataLayer, dloScriptSrc]);

    // Wait for DLO to initialize.
    await this.page.waitForFunction(() => window._dlo_observer, undefined, { timeout: 1000 });
  }

  async tearDown() {
    await this.page.close();
  }

  async execute(action: (args: any[]) => void, args?: any[]) {
    await this.page.evaluate(action, args || []);
  }

  async popEvent(timeoutMs: number = 1000) {
    try {
      await this.page.waitForFunction(() => window.events.length, undefined, { timeout: timeoutMs });
    } catch {
      return undefined;
    }
    return this.page.evaluate(() => window.events.pop());
  }

  async popError(timeoutMs: number = 1000) {
    try {
      await this.page.waitForFunction(() => window.errors.length, undefined, { timeout: timeoutMs });
    } catch {
      return undefined;
    }
    return this.page.evaluate(() => window.errors.pop());
  }
}

export const getRulesetTestEnvironments = (): RulesetTestEnvironment[] => {
  if (isBrowserTest) {
    return [chromium, firefox, webkit].map((browserType) => {
      // Reuse a single browser instance for each browser type across all tests.
      // This reduces browser test run time by about half.
      let browser: Browser | undefined;
      return {
        name: browserType.name(),
        createTestHarness: async (rules: DataLayerRule[], dataLayer: any) => {
          browser = browser || await browserType.launch();
          const testHarness = new BrowserTestHarness(browser);
          await testHarness.setUp(rules, dataLayer);
          return testHarness;
        },
        tearDown: async () => {
          await browser?.close();
        },
      };
    });
  }
  return [{
    name: 'node',
    createTestHarness: async (rules: DataLayerRule[], dataLayer: any) => {
      Logger.getInstance().appender = new ConsoleAppender();
      const testHarness = new NodeTestHarness();
      await testHarness.setUp(rules, dataLayer);
      return testHarness;
    },
    tearDown: () => Promise.resolve(),
  }];
};
