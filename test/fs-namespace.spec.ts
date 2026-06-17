/* eslint-disable no-underscore-dangle, @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import 'mocha';

import { getFsNamespace } from '../src/utils/fsNamespace';

/**
 * Builds a minimal fake `window`-like object with optional `_fs_namespace` and
 * `document.currentScript` pieces so we can exercise the resolution order without
 * mutating the real jsdom globals (and without coupling this spec to whatever
 * other specs leave on the real `window`).
 */
function makeWin(opts: {
  fsNamespace?: string;
  scriptAttr?: string | null;
  hasDocument?: boolean;
  throwOnCurrentScript?: boolean;
} = {}): any {
  const {
    fsNamespace, scriptAttr, hasDocument = true, throwOnCurrentScript = false,
  } = opts;

  const script = scriptAttr === undefined ? null : {
    getAttribute: (name: string) => (name === 'data-fs-namespace' ? scriptAttr : null),
  };

  const win: any = {};
  if (fsNamespace !== undefined) {
    win._fs_namespace = fsNamespace;
  }
  if (hasDocument) {
    Object.defineProperty(win, 'document', {
      get() {
        if (throwOnCurrentScript) {
          throw new Error('boom');
        }
        return { currentScript: script };
      },
    });
  }
  return win;
}

describe('getFsNamespace', () => {
  it('returns the data-fs-namespace attribute when set on document.currentScript', () => {
    const win = makeWin({ scriptAttr: 'CustomFS', fsNamespace: 'FS' });
    expect(getFsNamespace(win)).to.eq('CustomFS');
  });

  it('prefers the script attribute over _fs_namespace when both are present', () => {
    const win = makeWin({ scriptAttr: 'AttrWins', fsNamespace: 'GlobalLoses' });
    expect(getFsNamespace(win)).to.eq('AttrWins');
  });

  it('falls back to _fs_namespace when the script attribute is missing', () => {
    const win = makeWin({ scriptAttr: null, fsNamespace: 'MyFS' });
    expect(getFsNamespace(win)).to.eq('MyFS');
  });

  it('falls back to _fs_namespace when document.currentScript is null (deferred call)', () => {
    const win = makeWin({ fsNamespace: 'MyFS' });
    expect(getFsNamespace(win)).to.eq('MyFS');
  });

  it("falls back to 'FS' when neither the script attribute nor _fs_namespace are set", () => {
    const win = makeWin({});
    expect(getFsNamespace(win)).to.eq('FS');
  });

  it('treats an empty-string script attribute as not set and falls through to the global', () => {
    const win = makeWin({ scriptAttr: '', fsNamespace: 'MyFS' });
    expect(getFsNamespace(win)).to.eq('MyFS');
  });

  it('swallows errors from document access and falls back to the global', () => {
    const win = makeWin({ throwOnCurrentScript: true, fsNamespace: 'MyFS' });
    expect(getFsNamespace(win)).to.eq('MyFS');
  });

  it("returns 'FS' when the global object is missing entirely", () => {
    expect(getFsNamespace(undefined as any)).to.eq('FS');
  });
});

describe('cached currentScript namespace (captured at module load)', () => {
  const modulePath = '../src/utils/fsNamespace';
  let originalCurrentScript: PropertyDescriptor | undefined;

  function stampDocumentCurrentScript(namespace: string | null) {
    originalCurrentScript = Object.getOwnPropertyDescriptor(document, 'currentScript');
    Object.defineProperty(document, 'currentScript', {
      configurable: true,
      value: namespace === null ? null : {
        getAttribute: (name: string) => (name === 'data-fs-namespace' ? namespace : null),
      },
    });
  }

  function loadFresh(): { getFsNamespace: (win?: any) => string } {
    delete require.cache[require.resolve(modulePath)];
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, import/no-dynamic-require
    return require(modulePath);
  }

  afterEach(() => {
    if (originalCurrentScript) {
      Object.defineProperty(document, 'currentScript', originalCurrentScript);
    } else {
      delete (document as any).currentScript;
    }
    originalCurrentScript = undefined;
    delete require.cache[require.resolve(modulePath)];
  });

  it('resolves the cached namespace when the live currentScript is null', () => {
    stampDocumentCurrentScript('CachedNS');
    const { getFsNamespace: fresh } = loadFresh();
    expect(fresh(makeWin({}))).to.eq('CachedNS');
  });

  it('prefers the cached namespace over the _fs_namespace global', () => {
    stampDocumentCurrentScript('CachedNS');
    const { getFsNamespace: fresh } = loadFresh();
    expect(fresh(makeWin({ fsNamespace: 'GlobalNS' }))).to.eq('CachedNS');
  });
});
