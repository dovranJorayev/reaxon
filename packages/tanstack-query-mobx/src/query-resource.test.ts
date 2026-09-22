import {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/react-query';
import { IReactionDisposer, autorun, observable, runInAction } from 'mobx';
import { fromResource } from 'mobx-utils';
import { describe, expect, vi } from 'vitest';
import { queryResource } from './query-resource';
import { itObserve } from './tools';

const it = itObserve;

const makeDefaultBatcher = () => ({
  // eslint-disable-next-line @typescript-eslint/ban-types
  batchCalls: <Clbck extends Function>(fn: Clbck) => fn,
});

const makeDefaultOptions = <
  TQueryFnData,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(config: {
  options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
  client: QueryClient;
}) => config.client.defaultQueryOptions(config.options);

describe('tanstack query invariants ', () => {
  it('checks that QueryObserver does not call subscribe passed callback when changed options', async () => {
    const queryClient = new QueryClient();
    const options = {
      queryKey: ['test'],
      queryFn: () => Promise.resolve({ data: 'test' }),
    };

    const observer = new QueryObserver(queryClient, options);

    const onSubscribeMock = vi.fn();

    observer.subscribe(onSubscribeMock);

    observer.setOptions({
      queryKey: ['test'],
      enabled: false,
      queryFn: () => Promise.resolve({ data: 'test2' }),
    });

    queryClient.setQueryData(options.queryKey, () => ({ data: 'test2' }));

    expect(onSubscribeMock).toBeCalledTimes(2);
  });
  it(`check that fromResource subscribes only on first consumer untill it resets on unsubscribe,
  and behave exactly the same over and over. Intermediate calls of consumers should not subscribe again`, () => {
    const subscribeMock = vi.fn();
    const unsubscribeMock = vi.fn();
    const updateMock = vi.fn();

    let timerId: ReturnType<typeof setInterval>;
    const resource = fromResource<{ a: number }>(
      sink => {
        subscribeMock();
        timerId = setInterval(() => {
          const value = { a: Math.random() };
          updateMock();
          sink(value);
        }, 1000);
      },
      () => {
        clearInterval(timerId);
        unsubscribeMock();
      },
      { a: 0 }
    );

    vi.useFakeTimers();

    const disposers: IReactionDisposer[] = [];

    disposers.push(
      autorun(() => {
        resource.current();
      })
    );
    disposers.push(
      autorun(() => {
        resource.current();
      })
    );

    vi.advanceTimersByTime(3000);
    disposers.forEach(consumer => consumer());

    disposers.push(
      autorun(() => {
        resource.current();
      })
    );

    vi.advanceTimersByTime(3000);
    disposers.forEach(consumer => consumer());

    expect(subscribeMock).toBeCalledTimes(2);
    expect(updateMock).toBeCalledTimes(6);
    expect(unsubscribeMock).toBeCalledTimes(2);

    vi.useRealTimers();
  });
  it('check that queryClient.defaultQueryOptions does notprovide default option for notifyOnChangeProps', () => {
    const queryClient = new QueryClient();
    expect(
      queryClient.defaultQueryOptions({ queryKey: ['test'] }).notifyOnChangeProps
    ).toBeUndefined();
  });
});

describe('reactive options updates', () => {
  it('if getOptions closure read reactive data changes options should be updated', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();
    const id = observable.box(0);

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test', `${id.get()}`],
          queryFn: () => Promise.resolve({ data: id.get() }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    // eslint-disable-next-line @typescript-eslint/ban-types
    const batcher = { batchCalls: <Clbck extends Function>(fn: Clbck) => fn };
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const setOptionsSpy = vi.spyOn(observer, 'setOptions');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });

    const initialSetCount = setOptionsSpy.mock.calls.length;
    runInAction(() => {
      id.set(2);
    });
    runInAction(() => {
      id.set(3);
    });
    const afterActionSetCount = setOptionsSpy.mock.calls.length;

    expect(afterActionSetCount).toBe(initialSetCount + 2);
  });

  it('would NOT updated options if getOptions closure does not read reactive data', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();
    const id = {
      _value: 0,
      get() {
        return this._value;
      },
      set(value: number) {
        this._value = value;
      },
    };

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test', `${id.get()}`],
          queryFn: () => Promise.resolve({ data: id.get() }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const setOptionsSpy = vi.spyOn(observer, 'setOptions');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });

    const initialSetCount = setOptionsSpy.mock.calls.length;
    runInAction(() => {
      id.set(2);
    });
    runInAction(() => {
      id.set(3);
    });
    const afterActionSetCount = setOptionsSpy.mock.calls.length;

    expect(afterActionSetCount).toBe(initialSetCount);
  });
  it('should refetch when queryKey changes via getOptions', async ({ observe }) => {
    const queryClient = new QueryClient();
    const id = observable.box(0);
    const fetchMock = vi.fn((ctx: { queryKey: QueryKey }) =>
      Promise.resolve({ data: ctx.queryKey[1] })
    );

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test', `${id.get()}`],
          queryFn: fetchMock,
          staleTime: Infinity,
          cacheTime: Infinity,
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });

    // Wait for initial fetch
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Change queryKey reactively
    runInAction(() => {
      id.set(1);
    });

    // Should trigger a new fetch with the updated queryKey
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(fetchMock.mock.calls[0][0].queryKey).toEqual(['test', '0']);
    expect(fetchMock.mock.calls[1][0].queryKey).toEqual(['test', '1']);
  });

  it('should respect enabled option from getOptions', async ({ observe }) => {
    const queryClient = new QueryClient();
    const enabled = observable.box(false);
    const fetchMock = vi.fn(() => Promise.resolve({ data: 'test' }));

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test'],
          queryFn: fetchMock,
          enabled: enabled.get(),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });

    // Wait a bit to ensure no fetch was triggered when enabled is false
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(fetchMock).not.toHaveBeenCalled();

    // Enable the query
    runInAction(() => {
      enabled.set(true);
    });

    // Should trigger a fetch when enabled becomes true
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(resource.current().data?.data).toEqual('test');
  });
});

describe('optimistic result', () => {
  it('should have optimistic result even without any subscription', async () => {
    const queryClient = new QueryClient();

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test'],
          queryFn: () => Promise.resolve({ data: 'test' }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    const result = resource.current();

    expect(result).toBeDefined();
    expect(result.data).toBeUndefined();
  });
});

describe('AbortController behavior', () => {
  describe('abortCtrl.reaction', () => {
    it('should abort of abortCtrl.reaction on QueryObserver Consumer disposal', async ({
      observe,
    }) => {
      const queryClient = new QueryClient();

      const getOptions = () =>
        makeDefaultOptions({
          client: queryClient,
          options: {
            queryKey: ['test'],
            queryFn: () => Promise.resolve({ data: 'test' }),
          },
        });

      const observer = new QueryObserver(queryClient, getOptions());
      const batcher = makeDefaultBatcher();
      const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

      const resource = queryResource({
        getOptions,
        observer,
        batcher,
        abortCtrl,
      });

      observe(() => {
        resource.current();
      });
      observe.purge();

      expect(resource.isAlive()).toBe(false);
      expect(abortCtrl.reaction.signal.aborted).toBe(true);
    });

    it('should reinitialize abortCtrl.reaction on Consumer reinitialization', async ({
      observe,
    }) => {
      const queryClient = new QueryClient();

      const getOptions = () =>
        makeDefaultOptions({
          client: queryClient,
          options: {
            queryKey: ['test'],
            queryFn: () => Promise.resolve({ data: 'test' }),
          },
        });

      const observer = new QueryObserver(queryClient, getOptions());
      const batcher = makeDefaultBatcher();
      const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

      const resource = queryResource({
        getOptions,
        observer,
        batcher,
        abortCtrl,
      });

      const preObserve = abortCtrl.reaction.signal;
      observe(() => {
        resource.current();
      });
      const postObserve = abortCtrl.reaction.signal;
      observe.purge();
      const postPurge = abortCtrl.reaction.signal;
      observe(() => {
        resource.current();
      });
      const postSecondObserve = abortCtrl.reaction.signal;

      expect(preObserve).not.toBe(postObserve);
      expect(postObserve).toBe(postPurge);
      expect(postPurge).not.toBe(postSecondObserve);

      expect(preObserve.aborted).toBe(true);
      expect(postObserve.aborted).toBe(true);
      expect(postPurge.aborted).toBe(true);
      expect(postSecondObserve.aborted).toBe(false);
    });
  });

  describe('abortCtrl.query', () => {
    it('should abort abortCtrl.query on first resource Consumer read', async ({
      observe,
    }) => {
      const queryClient = new QueryClient();

      const getOptions = () =>
        makeDefaultOptions({
          client: queryClient,
          options: {
            queryKey: ['test'],
            queryFn: () => Promise.resolve({ data: 'test' }),
          },
        });

      const observer = new QueryObserver(queryClient, getOptions());
      const batcher = makeDefaultBatcher();
      const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

      const resource = queryResource({
        getOptions,
        observer,
        batcher,
        abortCtrl,
      });

      const preObserve = abortCtrl.reaction.signal;
      observe(() => {
        resource.current();
      });
      const postObserve = abortCtrl.reaction.signal;

      expect(preObserve.aborted).toBe(true);
      expect(postObserve.aborted).toBe(false);
    });

    it('should abort old abortCtrl.query on reaction disposition', async ({
      observe,
    }) => {
      const queryClient = new QueryClient();

      const getOptions = () =>
        makeDefaultOptions({
          client: queryClient,
          options: {
            queryKey: ['test'],
            queryFn: () => Promise.resolve({ data: 'test' }),
          },
        });

      const observer = new QueryObserver(queryClient, getOptions());
      const batcher = makeDefaultBatcher();
      const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

      const resource = queryResource({
        getOptions,
        observer,
        batcher,
        abortCtrl,
      });

      observe(() => {
        resource.current();
      });
      observe.purge();

      expect(abortCtrl.query.signal.aborted).toBe(true);
    });

    it('should abort abortCtrl.query on options reactive values changed', async ({
      observe,
    }) => {
      const queryClient = new QueryClient();
      const id = observable.box(0);

      const getOptions = () =>
        makeDefaultOptions({
          client: queryClient,
          options: {
            queryKey: ['test', `${id.get()}`],
            queryFn: ctx => Promise.resolve({ data: 'test', id: ctx.queryKey[1]! }),
          },
        });

      const observer = new QueryObserver(queryClient, getOptions());
      const batcher = makeDefaultBatcher();
      const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

      const resource = queryResource({
        getOptions,
        observer,
        batcher,
        abortCtrl,
      });

      const preObserve = abortCtrl.query.signal;
      observe(() => {
        resource.current();
      });
      const postObserve = abortCtrl.query.signal;

      runInAction(() => {
        id.set(1);
      });
      const postFirstAction = abortCtrl.query.signal;
      runInAction(() => {
        id.set(2);
      });
      const postSecondAction = abortCtrl.query.signal;

      expect(preObserve.aborted).toBe(true);
      expect(postObserve.aborted).toBe(true);
      expect(postFirstAction.aborted).toBe(true);
      expect(postSecondAction.aborted).toBe(false);
      expect(preObserve).not.toBe(postObserve);
      expect(postObserve).not.toBe(postFirstAction);
      expect(postFirstAction).not.toBe(postSecondAction);
    });
  });
});

describe('setOptions behavior', () => {
  it('should setOptions to QueryObserver on first resource Consumer read', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test'],
          queryFn: () => Promise.resolve({ data: 'test' }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const setOptionsSpy = vi.spyOn(observer, 'setOptions');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    const preObserve = setOptionsSpy.mock.calls.length;

    observe(() => {
      resource.current();
    });
    const postObserveCall = setOptionsSpy.mock.calls.length;

    expect(preObserve).toEqual(0);
    expect(postObserveCall).toEqual(preObserve + 1);
  });

  it('should setOptions to QueryObserver on options reactive values changed', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();
    const id = observable.box(0);

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test', `${id.get()}`],
          queryFn: ctx => Promise.resolve({ data: 'test', id: ctx.queryKey[1]! }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const setOptionsSpy = vi.spyOn(observer, 'setOptions');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    const preObserve = setOptionsSpy.mock.calls.length;

    observe(() => {
      resource.current();
    });
    const postObserveCall = setOptionsSpy.mock.calls.length;

    runInAction(() => {
      id.set(1);
    });
    const postFirstAction = setOptionsSpy.mock.calls.length;
    runInAction(() => {
      id.set(2);
    });
    const postSecondAction = setOptionsSpy.mock.calls.length;
    observe.purge();
    const postPurge = setOptionsSpy.mock.calls.length;

    expect(preObserve).toEqual(0);
    expect(postObserveCall).toEqual(preObserve + 1);
    expect(postFirstAction).toEqual(postObserveCall + 1);
    expect(postSecondAction).toEqual(postFirstAction + 1);
    expect(postPurge).toEqual(postSecondAction);
  });
});

describe('subscription management', () => {
  it('should subscribe to QueryObserver on first resource Consumer read', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test'],
          queryFn: () => Promise.resolve({ data: 'test' }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const subscribeSpy = vi.spyOn(observer, 'subscribe');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });
    const postObserveCall = subscribeSpy.mock.calls.length;

    expect(postObserveCall).toEqual(1);
  });

  it('should unsubscribe & resubscribe to QueryObserver on reactive values changed', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();
    const id = observable.box(0);

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test', `${id.get()}`],
          queryFn: ctx => Promise.resolve({ data: 'test', id: ctx.queryKey[1]! }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const subscribeSpy = vi.spyOn(observer, 'subscribe');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });
    const postObserveCall = subscribeSpy.mock.calls.length;
    runInAction(() => {
      id.set(1);
    });
    const postFirstAction = subscribeSpy.mock.calls.length;
    runInAction(() => {
      id.set(2);
    });
    const postSecondAction = subscribeSpy.mock.calls.length;
    observe.purge();
    const postPurge = subscribeSpy.mock.calls.length;

    expect(postObserveCall).toEqual(1);
    expect(postFirstAction).toEqual(postObserveCall + 1);
    expect(postSecondAction).toEqual(postFirstAction + 1);
    expect(postPurge).toEqual(postSecondAction);
  });

  it('should unsubscribe from QueryObserver on abortCtrl.query abort', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test'] as QueryKey,
          queryFn: () => Promise.resolve({ data: 'test' }),
        },
      });

    const observer = new (class extends QueryObserver<{
      data: string;
    }> {
      subscribe = (
        fn: (
          res: QueryObserverResult<{
            data: string;
          }>
        ) => void
      ) => {
        const result = super.subscribe(fn);
        return vi.fn(() => {
          result();
        });
      };
    })(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const subscribeSpy = vi.spyOn(observer, 'subscribe');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });
    observe.purge();

    expect(abortCtrl.query.signal.aborted).toBe(true);
    expect(subscribeSpy.mock.results).toHaveLength(1);
    expect(subscribeSpy.mock.results[0].value).toHaveBeenCalled();
  });

  it('should unsubscribe from QueryObserver on abortCtrl.reaction abort', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test'] as QueryKey,
          queryFn: () => Promise.resolve({ data: 'test' }),
        },
      });

    const observer = new (class extends QueryObserver<{
      data: string;
    }> {
      subscribe = (
        fn: (
          res: QueryObserverResult<{
            data: string;
          }>
        ) => void
      ) => {
        const result = super.subscribe(fn);
        return vi.fn(() => {
          result();
        });
      };
    })(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const subscribeSpy = vi.spyOn(observer, 'subscribe');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });
    observe.purge();

    expect(abortCtrl.reaction.signal.aborted).toBe(true);
    expect(subscribeSpy.mock.results).toHaveLength(1);
    expect(subscribeSpy.mock.results[0].value).toHaveBeenCalled();
  });
});

describe('updateResult behavior', () => {
  it('should trigger updateResult on QueryObserver on each subscribe', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();
    const id = observable.box(0);

    const getOptions = () =>
      makeDefaultOptions({
        client: queryClient,
        options: {
          queryKey: ['test', `${id.get()}`],
          queryFn: ctx => Promise.resolve({ data: 'test' + ctx.queryKey[1]! }),
        },
      });

    const observer = new QueryObserver(queryClient, getOptions());
    const batcher = makeDefaultBatcher();
    const abortCtrl = { reaction: new AbortController(), query: new AbortController() };

    const subscribeSpy = vi.spyOn(observer, 'subscribe');
    const updateResultSpy = vi.spyOn(observer, 'updateResult');

    const resource = queryResource({
      getOptions,
      observer,
      batcher,
      abortCtrl,
    });

    observe(() => {
      resource.current();
    });
    const postObserveCall = {
      subscribe: subscribeSpy.mock.calls.length,
      updateResult: updateResultSpy.mock.calls.length,
    };
    runInAction(() => {
      id.set(1);
    });
    const postFirstAction = {
      subscribe: subscribeSpy.mock.calls.length,
      updateResult: updateResultSpy.mock.calls.length,
    };
    runInAction(() => {
      id.set(2);
    });
    const postSecondAction = {
      subscribe: subscribeSpy.mock.calls.length,
      updateResult: updateResultSpy.mock.calls.length,
    };
    observe.purge();
    const postPurge = {
      subscribe: subscribeSpy.mock.calls.length,
      updateResult: updateResultSpy.mock.calls.length,
    };

    /**
     * @description observer.updateResult is called several times for each subscribe call due
     * to observer internal implementation
     */
    expect(postObserveCall.subscribe).toEqual(1);
    expect(postObserveCall.updateResult).toEqual(3);

    expect(postFirstAction.subscribe).toEqual(postObserveCall.subscribe + 1);
    expect(postFirstAction.updateResult).toBeGreaterThanOrEqual(
      postObserveCall.subscribe
    );

    expect(postSecondAction.subscribe).toEqual(postFirstAction.subscribe + 1);
    expect(postSecondAction.updateResult).toBeGreaterThanOrEqual(
      postFirstAction.updateResult
    );

    expect(postPurge.subscribe).toEqual(postSecondAction.subscribe);
    expect(postPurge.updateResult).toEqual(postSecondAction.updateResult);
  });
});
