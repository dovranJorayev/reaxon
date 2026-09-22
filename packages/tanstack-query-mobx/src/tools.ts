import { it } from 'vitest';
import mobx from 'mobx';

export const itObserve = it.extend<{
  observe: {
    purge: () => void;
    (callback: () => void): void;
  };
}>({
  observe: async ({ onTestFailed, onTestFinished }, use) => {
    const disposers: Array<mobx.IReactionDisposer> = [];

    const observe = (callback: () => void) => {
      const disposer = mobx.autorun(callback);
      disposers.push(disposer);
    };
    const purge = () => {
      for (const disposer of disposers) {
        disposer();
      }
      disposers.splice(0, disposers.length);
    };
    observe.purge = purge;

    onTestFailed(purge);
    onTestFinished(purge);

    await use(observe);
  },
});

export const makeDeffer = <T = void>() => {
  const noop = () => {};
  let resolve: (value: T) => void = noop;
  let reject: (error?: unknown) => void = noop;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

export const noop = () => {};
