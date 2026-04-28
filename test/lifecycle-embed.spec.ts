/* eslint-disable no-underscore-dangle, @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import 'mocha';

import { attachDloFullStoryLifecycle } from '../src/embed/init.impl';
import { DataLayerObserver } from '../src/observer';
import Console from './mocks/console';
import { createFullStoryObserveMock } from './mocks/fullstoryV2';
import { ConsoleAppender, Logger } from '../src/utils/logger';

describe('embed FullStory lifecycle', () => {
  // Use `window` (not `globalThis`) so state matches _dlo_initializeFromWindow, which reads `window`.
  const win = window as any;
  const originalConsole = window.console;
  const consoleMock = new Console();

  beforeEach(() => {
    Logger.getInstance().appender = new ConsoleAppender();
    (window as any).console = consoleMock;
    delete win._dlo_observer;
    delete win._dlo_rules;
    delete win._fs_namespace;
    delete win.FS;
    delete win.foo;
    win._dlo_enable_restart = true;
  });

  afterEach(() => {
    if (win._dlo_observer && typeof win._dlo_observer.destroy === 'function') {
      win._dlo_observer.destroy();
    }
    delete win._dlo_observer;
    delete win._dlo_rules;
    delete win.FS;
    delete win._fs_namespace;
    delete win.foo;
    delete win._dlo_enable_restart;
    (window as any).console = originalConsole;
  });

  it('does not re-bootstrap on immediate observe start when capture was already active', () => {
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
    expect(win._dlo_observer).to.equal(observer);
    expect(win._dlo_observer.handlers.length).to.eq(initialCount);
  });

  it('shutdown destroys observer; start after shutdown creates a fresh observer', () => {
    win.foo = { x: 1 };
    win._dlo_rules = [{
      source: 'foo',
      monitor: true,
      operators: [{ name: 'query', select: '$.x' }],
      destination: 'console.log',
    }];
    const first = new DataLayerObserver({ rules: win._dlo_rules, readOnLoad: false });
    win._dlo_observer = first;
    win._fs_namespace = 'FS';
    const { fs, fireShutdown, fireStart } = createFullStoryObserveMock();
    win.FS = fs;
    attachDloFullStoryLifecycle(win);
    expect(win._dlo_observer).to.equal(first);

    fireShutdown();
    expect(win._dlo_observer).to.be.undefined;

    fireStart();
    expect(win._dlo_observer).to.be.instanceOf(DataLayerObserver);
    expect(win._dlo_observer).to.not.equal(first);
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
  it('_dlo_initializeFromWindow does not wire restart when _dlo_enable_restart is not set', async () => {
    win._dlo_rules = [];
    delete win._dlo_enable_restart;
    let observeCalls = 0;
    win._fs_namespace = 'FS';
    win.FS = (cmd: string) => {
      if (cmd === 'observe') {
        observeCalls += 1;
      }
    };
    const init = (await import('../src/embed/init.impl')).default;
    init();
    expect(observeCalls).to.eq(0);
    expect(win._dlo_observer).to.be.instanceOf(DataLayerObserver);
  });

  it('_dlo_initializeFromWindow wires restart when _dlo_enable_restart is true', async () => {
    win._dlo_enable_restart = true;
    win.foo = { x: 1 };
    win._dlo_rules = [{
      source: 'foo',
      monitor: true,
      operators: [{ name: 'query', select: '$.x' }],
      destination: 'console.log',
    }];
    win._fs_namespace = 'FS';
    const { fs, fireShutdown, fireStart } = createFullStoryObserveMock();
    win.FS = fs;
    const init = (await import('../src/embed/init.impl')).default;
    init();
    const first = win._dlo_observer as DataLayerObserver;
    expect(first).to.be.instanceOf(DataLayerObserver);
    fireShutdown();
    expect(win._dlo_observer).to.be.undefined;
    fireStart();
    expect(win._dlo_observer).to.be.instanceOf(DataLayerObserver);
    expect(win._dlo_observer).to.not.equal(first);
  });
});
