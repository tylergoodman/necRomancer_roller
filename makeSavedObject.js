export function makeSavedObject(storageName, defaults = {}) {
    let target;
    try {
      target = JSON.parse(localStorage.getItem(storageName));
    } catch {
      target = {};
    } finally {
      if (typeof target !== 'object' || Number.isNaN(target) || target === null) {
        target = {};
      }
    }
    const isFirstGet = new Set();
    return new Proxy(target, {
      get(target, prop) {
        if (isFirstGet.has(prop)) {
          return Reflect.get(...arguments);
        }
        isFirstGet.add(prop);
        const ret = Reflect.get(...arguments);
        if (ret === undefined) {
          return defaults[prop];
        }
        return ret;
      },
      set(target) {
        const ret = Reflect.set(...arguments);
        localStorage.setItem(storageName, JSON.stringify(target));
        return ret;
      },
    });
  }