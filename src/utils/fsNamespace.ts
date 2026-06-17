/* eslint-disable no-underscore-dangle, import/prefer-default-export */

const FS_NAMESPACE_ATTR = 'data-fs-namespace';
const DEFAULT_NAMESPACE = 'FS';

function readCurrentScriptNamespace(): string | undefined {
  try {
    if (typeof document === 'undefined') return undefined;
    const script = document.currentScript as HTMLScriptElement | null;
    return (script && script.getAttribute && script.getAttribute(FS_NAMESPACE_ATTR)) || undefined;
  } catch (_) {
    return undefined;
  }
}

/**
 * The data-fs-namespace value read from the executing script tag at the moment
 * this module is first evaluated. document.currentScript is only non-null while a
 * script runs synchronously and is reset to null once control returns to the event
 * loop, so DLO's deferred callbacks would otherwise never see it. When the DLO
 * library script tag is stamped with data-fs-namespace, we read it once here while
 * currentScript is still live and cache the resolved string (not the element, so it
 * can still be garbage collected after DOM removal).
 */
const cachedScriptNamespace = readCurrentScriptNamespace();

/**
 * Resolves the FullStory client namespace on `win`.
 * Resolution order:
 *   1. The data-fs-namespace attribute on the live document.currentScript.
 *   2. The same attribute captured at module-evaluation time (cachedScriptNamespace).
 *   3. The _fs_namespace global set on window by the FullStory snippet.
 *   4. The default namespace 'FS'.
 *
 * @param win the global to read from; defaults to `window`
 */
export function getFsNamespace(win: any = window): string {
  let fromLiveScript: string | undefined;
  try {
    const script = (win && win.document && win.document.currentScript) as HTMLScriptElement | null;
    fromLiveScript = (script && script.getAttribute && script.getAttribute(FS_NAMESPACE_ATTR))
      || undefined;
  } catch (_) {
    // ignore: cross-origin or detached document access can throw. cachedScriptNamespace
    // is captured at module load and does not depend on win.document, so it is still
    // consulted below before the global fallback.
  }
  return fromLiveScript || cachedScriptNamespace || (win && win._fs_namespace) || DEFAULT_NAMESPACE;
}
