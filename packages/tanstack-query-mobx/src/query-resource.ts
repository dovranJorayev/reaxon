import {
  DefaultedInfiniteQueryObserverOptions,
  DefaultedQueryObserverOptions,
  InfiniteQueryObserver,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core';
import { reaction } from 'mobx';
import { IResource, resource } from './resource';

/**
 * @private
 * @description
 * QueryResource is a wrapper around query observer to make it reactive.
 * It is used to subscribe to query observer and update the result when the options change.
 * It is also used to abort the query observer when the component is disposed.
 * It is also used to update the result when the query observer is updated.
 * It is also used to get the optimistic result when the query observer is not subscribed.
 * @param options.getOptions - function to get defaulted options for query observer
 * @param options.observer - query observer
 * @param options.batcher - batcher to batch calls to query observer
 * @param options.abortCtrl - abort controller to abort query observer. reaction and query abort controllers.
 * abortCtrl options are passed as function params for sake of testability. DO NOT abort them outside of queryResource.
 * @returns resource to query observer
 */
export function queryResource<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(options: {
  getOptions: () => DefaultedQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >;
  observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
  batcher: {
    batchCalls: <T extends unknown[]>(callback: (...args: T) => void) => (...args: T) => void;
  };
  abortCtrl: {
    reaction: AbortController;
    query: AbortController;
  };
}): IResource<QueryObserverResult<TData, TError>>;

export function queryResource<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(options: {
  getOptions: () => DefaultedInfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >;
  observer: InfiniteQueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
  batcher: {
    batchCalls: <T extends unknown[]>(callback: (...args: T) => void) => (...args: T) => void;
  };
  abortCtrl: {
    reaction: AbortController;
    query: AbortController;
  };
}): IResource<InfiniteQueryObserverResult<TData, TError>>;

export function queryResource<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(options: {
  getOptions: () => DefaultedQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >;
  observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
  batcher: {
    batchCalls: <T extends unknown[]>(callback: (...args: T) => void) => (...args: T) => void;
  };
  abortCtrl: {
    reaction: AbortController;
    query: AbortController;
  };
}): IResource<QueryObserverResult<TData, TError>> {
  const { getOptions, observer, batcher, abortCtrl } = options;

  return resource<QueryObserverResult<TData, TError>>(
    sink => {
      /**
       * @description
       * Abort the reaction when it is first resource consumtion
       */
      abortCtrl.reaction.abort();
      abortCtrl.reaction = new AbortController();
      abortCtrl.reaction.signal.addEventListener(
        'abort',
        () => {
          abortCtrl.query.abort();
        },
        { once: true }
      );

      reaction(
        getOptions,
        options => {
          /**
           * @description
           * Clean up for update. Check for possible empty reference on first call.
           */
          abortCtrl.query.abort();
          abortCtrl.query = new AbortController();

          observer.setOptions(options);

          const unsubscribe = observer.subscribe(batcher.batchCalls(sink));
          abortCtrl.query.signal.addEventListener('abort', unsubscribe, {
            once: true,
          });

          /**
           * @description
           * Update result to make sure we did not miss any query updates
           * between creating the observer and subscribing to it.
           * @link https://github.com/TanStack/query/blob/main/packages/react-query/src/useBaseQuery.ts#L103C8-L105C32
           */
          observer.updateResult();
        },
        {
          fireImmediately: true,
          signal: abortCtrl.reaction.signal,
        }
      );
    },
    () => {
      abortCtrl.reaction.abort();
    },
    observer.getOptimisticResult(getOptions())
  );
}
