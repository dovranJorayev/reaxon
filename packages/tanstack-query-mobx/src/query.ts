import {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
  notifyManager,
} from '@tanstack/query-core';
import { action, computed, makeObservable } from 'mobx';
import { IResource } from './resource';
import { queryResource } from './query-resource';

export const createQuery = <
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(config: {
  queryClient: QueryClient;
  getOptions: () => QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >;
}) => {
  /**
   * @description there is no other way to guarantee good DX with discriminated unions and computed properties
   * without casting to predefined type.
   * Class can be typed as discriminated union, but has ability to create granular computed properties for query result.
   * Factory function & regular objects can be typed as discriminated union,
   * but has no ability to create granular computed properties for query result with not verbose way.
   * All casting are covered with unit tests
   */
  const query = new MobxQuery(
    config.queryClient,
    config.getOptions
  ) as unknown as QueryObserverResult<TData, TError>;

  return query;
};

export class MobxQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> {
  private observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
  private queryResource: IResource<QueryObserverResult<TData, TError>>;

  private getDefaultedOptions() {
    return this.queryClient.defaultQueryOptions(this.getOptions());
  }

  constructor(
    private readonly queryClient: QueryClient,
    private readonly getOptions: () => QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  ) {
    this.observer = new QueryObserver(this.queryClient, this.getDefaultedOptions());

    this.queryResource = queryResource({
      getOptions: this.getDefaultedOptions.bind(this),
      observer: this.observer,
      batcher: notifyManager,
      abortCtrl: {
        reaction: new AbortController(),
        query: new AbortController(),
      },
    });

    makeObservable(this, {
      data: computed,
      dataUpdatedAt: computed,
      error: computed,
      errorUpdateCount: computed,
      errorUpdatedAt: computed,
      failureCount: computed,
      fetchStatus: computed,
      isError: computed,
      isFetched: computed,
      isFetchedAfterMount: computed,
      isFetching: computed,
      isLoading: computed,
      isLoadingError: computed,
      isPaused: computed,
      isPlaceholderData: computed,
      isPreviousData: computed,
      isRefetchError: computed,
      isRefetching: computed,
      isStale: computed,
      isSuccess: computed,
      isInitialLoading: computed,
      status: computed,
      failureReason: computed,
      refetch: action,
      remove: action,
    });
  }

  get data() {
    return this.queryResource.current().data;
  }

  get dataUpdatedAt() {
    return this.queryResource.current().dataUpdatedAt;
  }

  get error() {
    return this.queryResource.current().error;
  }

  get errorUpdateCount() {
    return this.queryResource.current().errorUpdateCount;
  }

  get errorUpdatedAt() {
    return this.queryResource.current().errorUpdatedAt;
  }

  get failureCount() {
    return this.queryResource.current().failureCount;
  }

  get fetchStatus() {
    return this.queryResource.current().fetchStatus;
  }

  get isError() {
    return this.queryResource.current().isError;
  }

  get isFetched() {
    return this.queryResource.current().isFetched;
  }

  get isFetchedAfterMount() {
    return this.queryResource.current().isFetchedAfterMount;
  }

  get isFetching() {
    return this.queryResource.current().isFetching;
  }

  get isLoading() {
    return this.queryResource.current().isLoading;
  }

  get isLoadingError() {
    return this.queryResource.current().isLoadingError;
  }

  get isPaused() {
    return this.queryResource.current().isPaused;
  }

  get isPlaceholderData() {
    return this.queryResource.current().isPlaceholderData;
  }

  get isPreviousData() {
    return this.queryResource.current().isPreviousData;
  }

  get isRefetchError() {
    return this.queryResource.current().isRefetchError;
  }

  get isRefetching() {
    return this.queryResource.current().isRefetching;
  }

  get isStale() {
    return this.queryResource.current().isStale;
  }

  get isSuccess() {
    return this.queryResource.current().isSuccess;
  }

  get status() {
    return this.queryResource.current().status;
  }

  get failureReason() {
    return this.queryResource.current().failureReason;
  }

  get isInitialLoading() {
    return this.queryResource.current().isInitialLoading;
  }

  refetch = () => {
    return this.queryResource.current().refetch();
  };

  remove = () => {
    this.queryResource.current().remove();
  };
}
