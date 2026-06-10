/* eslint-disable no-underscore-dangle, import/prefer-default-export */

/**
 * Resolves the FullStory client namespace on `window`.
 *
 * Mirrors the resolution order used by fs.js:
 *   1. The `data-fs-namespace` attribute on `document.currentScript` (best-effort).
 *   2. The `_fs_namespace` global set on `window` by the FullStory snippet.
 *   3. The default namespace `'FS'`.
 *
 * Note: `document.currentScript` is only meaningful while the helper module is being
 * evaluated synchronously by a script tag. DLO calls this helper from deferred callbacks
 * (appender log, operator handleData, lifecycle hook), so the attribute lookup is
 * opportunistic and the global is the practical fallback floor — same behavior as the
 * existing `(window as any)._fs_namespace` reads it replaces.
 *
 * @param win the global to read from; defaults to `window`
 */
export function getFsNamespace(win: any = window): string {
  try {
    const script = (win && win.document && win.document.currentScript) as HTMLScriptElement | null;
    const attr = script && script.getAttribute && script.getAttribute('data-fs-namespace');
    if (attr) return attr;
  } catch (_) {
    // ignore: cross-origin or detached document access can throw
  }
  return (win && win._fs_namespace) || 'FS';
}
