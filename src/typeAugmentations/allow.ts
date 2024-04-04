// Define properties missing in default types.

export {}; // This file is a module.

// Note: These declarations are accessible not only to modules that import
// this module directly, but to anything that imports *those* modules.
declare global {

  interface Window {
    Map: typeof Map;
  }

  interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
    readonly size: number;
  }

  interface MapConstructor {
    new (): Map<any, any>;
    new <K, V>(entries?: readonly (readonly [K, V])[] | null): Map<K, V>;
    readonly prototype: Map<any, any>;
  }

  let Map: MapConstructor;
}
