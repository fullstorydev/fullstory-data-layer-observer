/* eslint-disable no-underscore-dangle, @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import 'mocha';

import { attachDloFullStoryLifecycle } from '../src/embed/init.impl';
import { DataLayerObserver } from '../src/observer';
import Console from './mocks/console';
import { createFullStoryObserveMock } from './mocks/fullstoryV2';
import { ConsoleAppender, Logger } from '../src/utils/logger';

/** jsdom: `globalThis` and `window` can differ; DLO embed reads `window`, selectors use `getGlobal()`. */
function clearDloGlobals(ctx: any) {
  delete ctx._dlo_observer;
  delete ctx._dlo_rules;
  delete ctx._dlo_readOnLoad;
  delete ctx._fs_namespace;
  delete ctx.FS;
  delete ctx.foo;
  delete ctx._dlo_enable_restart;
}

describe('embed FullStory lifecycle', () => {
  // Destination `'console.log'` resolves via `getGlobal()` → mock `globalThis.console`.
  const win = globalThis as any;
  const originalConsole = globalThis.console;
  let consoleMock: Console;

  beforeEach(() => {
    Logger.getInstance().appender = new ConsoleAppender();
    consoleMock = new Console();
    (globalThis as any).console = consoleMock;
    clearDloGlobals(win);
    clearDloGlobals(window as any);
    win._dlo_enable_restart = true;
  });

  afterEach(() => {
    if (win._dlo_observer && Array.isArray(win._dlo_observer.handlers)) {
      win._dlo_observer.handlers.slice().forEach((h: any) => h.stop());
    }
    clearDloGlobals(win);
    clearDloGlobals(window as any);
    (globalThis as any).console = originalConsole;
  });

  it('does not replay on immediate observe start when capture was already active', () => {
    win.foo = { x: 1 };
    win._dlo_rules = [{
      source: 'foo',
      monitor: true,
      operators: [{ name: 'query', select: '$.x' }],
      destination: 'console.log',
    }];
    const observer = new DataLayerObserver({
      rules: win._dlo_rules,
      readOnLoad: false,
    });
    const initialCount = observer.handlers.length;
    win._dlo_observer = observer;
    win._fs_namespace = 'FS';
    const { fs } = createFullStoryObserveMock();
    win.FS = fs;

    attachDloFullStoryLifecycle(win);

    // Same observer instance and handler set, and no replay fired (no shutdown happened first).
    expect(win._dlo_observer).to.equal(observer);
    expect(win._dlo_observer.handlers.length).to.eq(initialCount);
    expect(consoleMock.callQueues.log.length).to.eq(0);
  });

  it('shutdown then start replays the current snapshot through the same observer (object source)', () => {
    win.foo = { x: 1 };
    win._dlo_rules = [{
      source: 'foo',
      monitor: true,
      operators: [{ name: 'query', select: '$.x' }],
      destination: 'console.log',
    }];
    const observer = new DataLayerObserver({ rules: win._dlo_rules, readOnLoad: true });
    win._dlo_observer = observer;
    win._fs_namespace = 'FS';
    const { fs, fireShutdown, fireStart } = createFullStoryObserveMock();
    win.FS = fs;

    attachDloFullStoryLifecycle(win);

    // Initial read-on-load from registration (not lifecycle replay).
    expect(consoleMock.callQueues.log.length).to.eq(1);
    consoleMock.callQueues.log.splice(0, consoleMock.callQueues.log.length);

    fireShutdown();
    expect(win._dlo_observer).to.equal(observer); // observer survives shutdown

    fireStart();
    expect(win._dlo_observer).to.equal(observer); // and survives start
    expect(consoleMock.callQueues.log.length).to.eq(1);
    expect(consoleMock.callQueues.log[0].parameters[0]).to.eq(1);

    // A subsequent start without an intervening shutdown should not replay again.
    fireStart();
    expect(consoleMock.callQueues.log.length).to.eq(1);
  });

  it('shutdown then start fans out current array elements through the same observer (array source)', () => {
    win.foo = [{ a: 'one' }, { a: 'two' }];
    win._dlo_rules = [{
      source: 'foo',
      monitor: true,
      operators: [{ name: 'query', select: '$.a' }],
      destination: 'console.log',
    }];
    const observer = new DataLayerObserver({ rules: win._dlo_rules, readOnLoad: true });
    win._dlo_observer = observer;
    win._fs_namespace = 'FS';
    const { fs, fireShutdown, fireStart } = createFullStoryObserveMock();
    win.FS = fs;

    attachDloFullStoryLifecycle(win);

    expect(consoleMock.callQueues.log.length).to.eq(2);
    consoleMock.callQueues.log.splice(0, consoleMock.callQueues.log.length);

    fireShutdown();
    fireStart();

    expect(win._dlo_observer).to.equal(observer);
    expect(consoleMock.callQueues.log.length).to.eq(2);
    expect(consoleMock.callQueues.log[0].parameters[0]).to.eq('one');
    expect(consoleMock.callQueues.log[1].parameters[0]).to.eq('two');
  });

  it('skips observe wiring when FullStory client is not a function', () => {
    win._dlo_rules = [];
    win._dlo_observer = new DataLayerObserver({ rules: [] });
    win._fs_namespace = 'FS';
    win.FS = { notAFunction: true };
    expect(() => attachDloFullStoryLifecycle(win)).to.not.throw();
  });

  [false, undefined].forEach((flag) => {
    it(`does not call FS observe when _dlo_enable_restart is ${String(flag)}`, () => {
      const first = new DataLayerObserver({ rules: [], readOnLoad: false });
      win._dlo_observer = first;
      win._fs_namespace = 'FS';
      let observeCalls = 0;
      win.FS = (cmd: string) => {
        if (cmd === 'observe') {
          observeCalls += 1;
        }
      };
      win._dlo_enable_restart = flag as any;
      attachDloFullStoryLifecycle(win);
      expect(observeCalls).to.eq(0);
      expect(win._dlo_observer).to.equal(first);
    });
  });

  // Full-init tests: dynamic `import()` of the default, same pattern as `test/telemetry.spec.ts`.
  // Embed reads `window`; selector paths resolve via `getGlobal()` (often `globalThis` in Node/jsdom).
  it('_dlo_initializeFromWindow does not wire restart when _dlo_enable_restart is not set', async () => {
    const w = window as any;
    w._dlo_rules = [];
    delete w._dlo_enable_restart;
    let observeCalls = 0;
    w._fs_namespace = 'FS';
    w.FS = (cmd: string) => {
      if (cmd === 'observe') {
        observeCalls += 1;
      }
    };
    const init = (await import('../src/embed/init.impl')).default;
    init();
    expect(observeCalls).to.eq(0);
    expect(w._dlo_observer).to.be.instanceOf(DataLayerObserver);
  });

  it('_dlo_initializeFromWindow wires restart so shutdown/start replays through the same observer', async () => {
    const w = window as any;
    const g = globalThis as any;
    w._dlo_enable_restart = true;
    const foo = { x: 1 };
    w.foo = foo;
    g.foo = foo;
    w._dlo_rules = [{
      source: 'foo',
      monitor: true,
      operators: [{ name: 'query', select: '$.x' }],
      destination: 'console.log',
    }];
    w._dlo_readOnLoad = true;
    w._fs_namespace = 'FS';
    const { fs, fireShutdown, fireStart } = createFullStoryObserveMock();
    w.FS = fs;

    const init = (await import('../src/embed/init.impl')).default;
    init();
    const first = w._dlo_observer as DataLayerObserver;
    expect(first).to.be.instanceOf(DataLayerObserver);

    // Initial read-on-load from embed init (not lifecycle replay).
    expect(consoleMock.callQueues.log.length).to.eq(1);
    consoleMock.callQueues.log.splice(0, consoleMock.callQueues.log.length);

    fireShutdown();
    expect(w._dlo_observer).to.equal(first);

    fireStart();
    expect(w._dlo_observer).to.equal(first);
    expect(consoleMock.callQueues.log.length).to.eq(1);
    expect(consoleMock.callQueues.log[0].parameters[0]).to.eq(1);

    delete g.foo;
  });
});
