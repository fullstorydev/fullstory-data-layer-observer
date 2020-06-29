/**
 * Defines a subset of FullStory browser APIs used by DLO.
 */
export interface FullStoryAPI {
  event(eventName: string, payload: { [key: string]: any }, source: string): void;
}

/**
 * Gets the instance of FS from the global window.
 */
export function getFS(): FullStoryAPI | undefined {
  const wnd = (window as any);
  return wnd[wnd._fs_namespace];
}