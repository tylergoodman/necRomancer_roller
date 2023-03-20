export function makeSavedObject<T extends object = {}>(
  storageName: string,
  defaults: T = {} as T,
): T {
  let target: T;
  try {
    target = JSON.parse(localStorage.getItem(storageName)!);
  } catch (e: unknown) {
    console.warn(
      `Couldn't parse saved object with key "${storageName}" from storage.`,
      e,
    );
    target = {} as T;
  } finally {
    if (
      typeof target! !== 'object' || Number.isNaN(target) || target === null
    ) {
      target = {} as T;
    }
  }
  const isFirstGet = new Set();
  return new Proxy<T>(target, {
    get(target, prop) {
      if (isFirstGet.has(prop)) {
        return Reflect.get(target, prop);
      }
      isFirstGet.add(prop);
      const ret = Reflect.get(target, prop);
      if (ret === undefined) {
        // What's the right type for this?
        // Error: No index signature with a parameter of type 'string' was found
        // on type '{}'.
        // It's not:
        // - {[K in keyof T]: T[K]}
        // - {[index: keyof T]: T[keyof T]}
        return (defaults as any)[prop];
      }
      return ret;
    },
    set(target, prop, value) {
      const ret = Reflect.set(target, prop, value);
      localStorage.setItem(storageName, JSON.stringify(target));
      return ret;
    },
    ownKeys() {
      return Reflect.ownKeys(defaults);
    },
    getOwnPropertyDescriptor(target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: (target as any)[prop],
      };
    },
  });
}
