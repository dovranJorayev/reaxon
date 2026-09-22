import { QueryClient } from '@tanstack/query-core';
import { configure, when } from 'mobx';
import { describe, vi } from 'vitest';
import { createInfinityQuery } from './infinity-query';
import { itObserve, makeDeffer, noop } from './tools';

configure({
  enforceActions: 'always',
});

const it = itObserve;

const allowFetchStart = async (delay = 500) => {
  await new Promise(resolve => setTimeout(resolve, delay));
};

describe.concurrent(
  `fetching SHOULD start on empty cache value for given query key 
  on reactive vars read inside reactive environment (autorun, reaction, etc)`,
  () => {
    it('check fetch on data read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.data?.pages?.[0] === 'page1', { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on dataUpdatedAt read', async () => {
      const now = Date.now();
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.dataUpdatedAt >= now, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on error read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.error instanceof Error, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on errorUpdateCount read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.errorUpdateCount === 1, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on errorUpdatedAt read', async () => {
      const now = Date.now();
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.errorUpdatedAt >= now);

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on failureCount read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          log: noop,
          warn: noop,
          error: noop,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.failureCount > 0, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on fetchStatus read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.fetchStatus === 'fetching', { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isError read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.isError === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetched read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.isFetched === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetchedAfterMount read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.isFetchedAfterMount === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetching read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.isFetching === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetchingNextPage read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isFetchingNextPage;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetchingPreviousPage read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isFetchingPreviousPage;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isLoading read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      /** query.isLoading is true by default is there is no data in cache or no query call was made yet */
      await when(() => query.isLoading === false, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isLoadingError read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.isLoadingError === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isPaused read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isPaused;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isPlaceholderData read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isPlaceholderData;
      });
      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isPreviousData read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isPreviousData;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isRefetchError read', async ({ observe }) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const fetchMock = vi.fn();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isRefetchError;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isRefetching read', async ({ observe }) => {
      const fetchMock = vi.fn();
      const queryClient = new QueryClient({
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isRefetching;
      });
      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isStale read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient({
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      observe(() => {
        query.isStale;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isSuccess read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.isSuccess === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on status read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      await when(() => query.status === 'success', { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
  }
);
describe.concurrent(
  `fetching SHOULD NOT start on empty cache value for given query key 
  when reactive vars are read outside of any reactive environment (not inside autorun, reaction, etc)`,
  () => {
    const originalConsoleWarn = console.warn;
    beforeAll(() => {
      console.warn = noop;
    });
    afterAll(() => {
      console.warn = originalConsoleWarn;
    });

    it('should not fetch on data read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read data outside of reactive context
      const _data = query.data;

      // Wait a bit to ensure no fetch was triggered
      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on dataUpdatedAt read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read dataUpdatedAt outside of reactive context
      const _dataUpdatedAt = query.dataUpdatedAt;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on error read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read error outside of reactive context
      const _error = query.error;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on errorUpdateCount read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read errorUpdateCount outside of reactive context
      const _errorUpdateCount = query.errorUpdateCount;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on errorUpdatedAt read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read errorUpdatedAt outside of reactive context
      const _errorUpdatedAt = query.errorUpdatedAt;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on failureCount read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          log: noop,
          warn: noop,
          error: noop,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read failureCount outside of reactive context
      const _failureCount = query.failureCount;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on fetchStatus read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read fetchStatus outside of reactive context
      const _fetchStatus = query.fetchStatus;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isError read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isError outside of reactive context
      const _isError = query.isError;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetched read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isFetched outside of reactive context
      const _isFetched = query.isFetched;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetchedAfterMount read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isFetchedAfterMount outside of reactive context
      const _isFetchedAfterMount = query.isFetchedAfterMount;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetching read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isFetching outside of reactive context
      const _isFetching = query.isFetching;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetchingNextPage read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isFetchingNextPage outside of reactive context
      const _isFetchingNextPage = query.isFetchingNextPage;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetchingPreviousPage read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isFetchingPreviousPage outside of reactive context
      const _isFetchingPreviousPage = query.isFetchingPreviousPage;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isLoading read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isLoading outside of reactive context
      const _isLoading = query.isLoading;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isLoadingError read', async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error('test')));
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isLoadingError outside of reactive context
      const _isLoadingError = query.isLoadingError;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isPaused read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isPaused outside of reactive context
      const _isPaused = query.isPaused;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isPlaceholderData read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isPlaceholderData outside of reactive context
      const _isPlaceholderData = query.isPlaceholderData;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isPreviousData read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isPreviousData outside of reactive context
      const _isPreviousData = query.isPreviousData;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isRefetchError read', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const fetchMock = vi.fn();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isRefetchError outside of reactive context
      const _isRefetchError = query.isRefetchError;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isRefetching read', async () => {
      const fetchMock = vi.fn();
      const queryClient = new QueryClient({
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isRefetching outside of reactive context
      const _isRefetching = query.isRefetching;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isStale read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient({
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isStale outside of reactive context
      const _isStale = query.isStale;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isSuccess read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read isSuccess outside of reactive context
      const _isSuccess = query.isSuccess;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on status read', async () => {
      const fetchMock = vi.fn().mockResolvedValue('page1');
      const queryClient = new QueryClient();
      const query = createInfinityQuery({
        queryClient,
        getOptions: () => ({
          queryKey: ['test'],
          queryFn: fetchMock,
          getNextPageParam: () => undefined,
        }),
      });

      // Read status outside of reactive context
      const _status = query.status;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
  }
);

describe.concurrent('createInfinityQuery. Methods correctness', () => {
  it('refetch should NOT refetch the query if query fields WAS NOT observed', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue('page1');
    const query = createInfinityQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('page1'),
        getNextPageParam: () => undefined,
      }),
    });

    await query.refetch();
    await query.refetch();
    await query.refetch();

    expect(queryFn).not.toHaveBeenCalled();
  });
  it('refetch should refetch the query if query fields WAS observed', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue('page1');
    const query = createInfinityQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test'],
        queryFn: queryFn,
        getNextPageParam: () => undefined,
      }),
    });

    observe(() => {
      query.data;
    });

    await query.refetch();
    await query.refetch();

    expect(queryFn).toHaveBeenCalledTimes(2);
  });
  it('remove should remove the query data from cache but keep the query instance alive', async () => {
    const queryClient = new QueryClient();
    const query = createInfinityQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('page1'),
        getNextPageParam: () => undefined,
      }),
    });

    await when(() => query.status === 'success');

    const cachedAfterRead = queryClient.getQueryCache().find(['test']) !== undefined;
    query.remove();
    const cachedAfterRemove = queryClient.getQueryCache().find(['test']) !== undefined;

    expect(cachedAfterRead).toBeTruthy();
    expect(cachedAfterRemove).toBeFalsy();
    expect(query.data).toBeTruthy();
  });
  it('fetchNextPage should fetch the next page when hasNextPage is true', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn(({ pageParam = 0 }) =>
      Promise.resolve({
        items: [`page${pageParam}`],
        nextPage: pageParam < 2 ? pageParam + 1 : undefined,
      })
    );
    const query = createInfinityQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test-fetch-next'],
        queryFn,
        getNextPageParam: (lastPage: { items: string[]; nextPage?: number }) =>
          lastPage.nextPage,
      }),
    });

    await when(() => query.status === 'success', { timeout: 1000 });
    expect(query.data?.pages).toHaveLength(1);

    query.fetchNextPage();

    await when(() => query.data?.pages?.length === 2, { timeout: 1000 });

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(query.data?.pages).toHaveLength(2);
  });
  it('fetchPreviousPage should fetch the previous page when hasPreviousPage is true', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn(({ pageParam = 2 }) =>
      Promise.resolve({
        items: [`page${pageParam}`],
        previousPage: pageParam > 0 ? pageParam - 1 : undefined,
      })
    );
    const query = createInfinityQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test-fetch-previous'],
        queryFn,
        getPreviousPageParam: (firstPage: { items: string[]; previousPage?: number }) =>
          firstPage.previousPage,
        getNextPageParam: () => undefined,
      }),
    });

    await when(() => query.status === 'success', { timeout: 1000 });
    expect(query.data?.pages).toHaveLength(1);

    query.fetchPreviousPage();

    await when(() => query.data?.pages?.length === 2, { timeout: 1000 });

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(query.data?.pages).toHaveLength(2);
  });
  it('fetchNextPage should not fetch when hasNextPage is false', async ({ observe }) => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn(() =>
      Promise.resolve({
        items: ['page0'],
        nextPage: undefined, // No next page
      })
    );
    const query = createInfinityQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test-no-next'],
        queryFn,
        getNextPageParam: (lastPage: { items: string[]; nextPage?: number }) =>
          lastPage.nextPage,
      }),
    });

    observe(() => {
      query.data;
    });
    await when(() => query.status === 'success', { timeout: 1000 });

    expect(queryFn).toHaveBeenCalledTimes(1);

    query.fetchNextPage();

    await allowFetchStart();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(query.data?.pages).toHaveLength(1);
  });
  it('fetchPreviousPage should not fetch when hasPreviousPage is false', async ({
    observe,
  }) => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn(() =>
      Promise.resolve({
        items: ['page0'],
        previousPage: undefined, // No previous page
      })
    );
    const query = createInfinityQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test-no-previous'],
        queryFn,
        getPreviousPageParam: (firstPage: { items: string[]; previousPage?: number }) =>
          firstPage.previousPage,
        getNextPageParam: () => undefined,
      }),
    });

    observe(() => {
      query.data;
    });

    await when(() => query.status === 'success', { timeout: 1000 });
    expect(queryFn).toHaveBeenCalledTimes(1);

    query.fetchPreviousPage();

    await allowFetchStart();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(query.data?.pages).toHaveLength(1);
  });
});

describe('createInfinityQuery. Ensure correct type invariants for infinite query result', () => {
  it(`
    should match InfiniteQueryObserverLoadingResult invariants:
    data: undefined,
    error: null,
    isError: false,
    isLoading: true,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: false,
    status: loading,
    fetchStatus: 'fetching',
    isFetchingNextPage: false,
    isFetchingPreviousPage: false
  `, async () => {
    const defer = makeDeffer<{ pages: string[]; pageParams: number[] }>();
    const queryClient = new QueryClient();
    const getOptions = () => ({
      queryKey: ['test-infinite'],
      queryFn: () => defer.promise,
      getNextPageParam: () => undefined,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    await when(
      () => {
        return query.fetchStatus === 'fetching';
      },
      { timeout: 1000 }
    );
    defer.resolve({ pages: ['page1'], pageParams: [0] });

    expect(query.status).toBe('loading');
    expect(query.data).toBeUndefined();
    expect(query.error).toBeNull();
    expect(query.isLoading).toBe(true);
    expect(query.isError).toBe(false);
    expect(query.isSuccess).toBe(false);
    expect(query.isLoadingError).toBe(false);
    expect(query.isRefetchError).toBe(false);
    expect(query.fetchStatus).toBe('fetching');
    expect(query.isFetchingNextPage).toBe(false);
    expect(query.isFetchingPreviousPage).toBe(false);
  });

  it(`
    should match InfiniteQueryObserverLoadingErrorResult invariants:
    data: undefined,
    error: TError,
    isError: true,
    isLoading: false,
    isLoadingError: true,
    isRefetchError: false,
    isSuccess: false,
    status: error,
    fetchStatus: 'idle'
  `, async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
      logger: {
        log: console.log,
        warn: console.warn,
        error: noop,
      },
    });
    const getOptions = () => ({
      queryKey: ['test-infinite-error'],
      queryFn: () => Promise.reject(new Error('test')),
      getNextPageParam: () => undefined,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    await when(
      () => {
        return query.status === 'error';
      },
      { timeout: 1000 }
    );

    expect(query.data).toBeUndefined();
    expect(query.error).toBeInstanceOf(Error);
    expect(query.isError).toBe(true);
    expect(query.isLoading).toBe(false);
    expect(query.isLoadingError).toBe(true);
    expect(query.isRefetchError).toBe(false);
    expect(query.isSuccess).toBe(false);
    expect(query.status).toBe('error');
    expect(query.fetchStatus).toBe('idle');
  });

  it(`
    should match InfiniteQueryObserverRefetchErrorResult invariants:
    data: TData,
    error: TError,
    isError: true,
    isLoading: false,
    isLoadingError: false,
    isRefetchError: true,
    isSuccess: false,
    status: error,
    isRefetchError: true
  `, async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
      logger: {
        log: console.log,
        warn: console.warn,
        error: noop,
      },
    });
    let i = 0;
    const getOptions = () => ({
      queryKey: ['test-infinite-refetch-error'],
      queryFn: () =>
        i++ === 0 ? Promise.resolve('page1') : Promise.reject(new Error('test')),
      getNextPageParam: () => undefined,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    await when(
      () => {
        return query.status === 'success';
      },
      { timeout: 1000 }
    );
    await when(
      () => {
        return query.status === 'error';
      },
      { timeout: 1000 }
    );

    expect(query.data).toEqual({ pages: ['page1'], pageParams: [undefined] });
    expect(query.error).toBeInstanceOf(Error);
    expect(query.isError).toBe(true);
    expect(query.isLoading).toBe(false);
    expect(query.isLoadingError).toBe(false);
    expect(query.isRefetchError).toBe(true);
    expect(query.isSuccess).toBe(false);
    expect(query.status).toBe('error');
    expect(query.isRefetchError).toBe(true);
  });

  it(`
    should match InfiniteQueryObserverSuccessResult invariants:
    data: TData (with pages and pageParams),
    error: null,
    isError: false,
    isLoading: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: true
    status: success,
  `, async () => {
    const queryClient = new QueryClient();
    const getOptions = () => ({
      queryKey: ['test-infinite-success'],
      queryFn: () => Promise.resolve('page1'),
      getNextPageParam: () => undefined,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    await when(
      () => {
        return query.status === 'success';
      },
      { timeout: 1000 }
    );

    expect(query.data).toEqual({ pages: ['page1'], pageParams: [undefined] });
    expect(query.error).toBeNull();
    expect(query.isError).toBe(false);
    expect(query.isSuccess).toBe(true);
    expect(query.isLoading).toBe(false);
    expect(query.isLoadingError).toBe(false);
    expect(query.isRefetchError).toBe(false);
    expect(query.status).toBe('success');
  });
});

describe('createInfinityQuery. Data structure correctness', () => {
  it(`
    should have correct InfiniteData structure with pages and pageParams
  `, async () => {
    const queryClient = new QueryClient();
    const getOptions = () => ({
      queryKey: ['test-data-structure'],
      queryFn: ({ pageParam = 0 }) =>
        Promise.resolve({
          items: [`item-${pageParam}-1`, `item-${pageParam}-2`],
          nextPage: pageParam < 1 ? pageParam + 1 : undefined,
        }),
      getNextPageParam: (lastPage: { items: string[]; nextPage?: number }) =>
        lastPage.nextPage,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    await when(
      () => {
        return query.status === 'success';
      },
      { timeout: 1000 }
    );

    // Fetch second page
    query.fetchNextPage();

    await when(
      () => {
        return query.data?.pages?.length === 2;
      },
      { timeout: 1000 }
    );

    expect(query.data).toBeDefined();
    expect(query.data?.pages).toHaveLength(2);
    expect(query.data?.pageParams).toHaveLength(2);
    expect(query.data?.pages[0]).toEqual({
      items: ['item-0-1', 'item-0-2'],
      nextPage: 1,
    });
    expect(query.data?.pages[1]).toEqual({
      items: ['item-1-1', 'item-1-2'],
      nextPage: undefined,
    });
    expect(query.data?.pageParams[0]).toBe(undefined); // First page uses default
    expect(query.data?.pageParams[1]).toBe(1);
  });
});

describe('createInfinityQuery. Infinite query specific pagination functionality', () => {
  it(`
    should correctly handle fetchNextPage:
    data should contain multiple pages after fetchNextPage
  `, async () => {
    const queryClient = new QueryClient();
    const getOptions = () => ({
      queryKey: ['test-fetch-next-page'],
      queryFn: ({ pageParam = 0 }) =>
        Promise.resolve({
          items: [`page${pageParam}`],
          nextPage: pageParam < 2 ? pageParam + 1 : undefined,
        }),
      getNextPageParam: (lastPage: { items: string[]; nextPage?: number }) =>
        lastPage.nextPage,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    // Wait for initial load
    await when(
      () => {
        return query.status === 'success';
      },
      { timeout: 1000 }
    );

    expect(query.data?.pages).toHaveLength(1);
    expect(query.data?.pages[0]).toEqual({ items: ['page0'], nextPage: 1 });

    // Fetch next page
    query.fetchNextPage();

    // Wait for next page to load
    await when(
      () => {
        return query.data?.pages?.length === 2;
      },
      { timeout: 1000 }
    );

    expect(query.data?.pages).toHaveLength(2);
    expect(query.data?.pages[1]).toEqual({ items: ['page1'], nextPage: 2 });
  });

  it(`
    should correctly handle fetchPreviousPage:
    data should contain multiple pages after fetchPreviousPage
  `, async () => {
    const queryClient = new QueryClient();
    const getOptions = () => ({
      queryKey: ['test-fetch-previous-page'],
      queryFn: ({ pageParam = 2 }) =>
        Promise.resolve({
          items: [`page${pageParam}`],
          previousPage: pageParam > 0 ? pageParam - 1 : undefined,
        }),
      getPreviousPageParam: (firstPage: { items: string[]; previousPage?: number }) =>
        firstPage.previousPage,
      getNextPageParam: () => undefined,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    // Wait for initial load
    await when(
      () => {
        return query.status === 'success';
      },
      { timeout: 1000 }
    );

    expect(query.data?.pages).toHaveLength(1);

    // Fetch previous page
    query.fetchPreviousPage();

    // Wait for previous page to load
    await when(
      () => {
        return query.data?.pages?.length === 2;
      },
      { timeout: 1000 }
    );

    expect(query.data?.pages).toHaveLength(2);
  });

  it(`
    should track isFetchingNextPage correctly during async operations
  `, async () => {
    const defer1 = makeDeffer<{ items: string[]; nextPage?: number }>();
    const defer2 = makeDeffer<{ items: string[]; nextPage?: number }>();
    const queryClient = new QueryClient();
    let callCount = 0;
    let capturedIsFetchingNextPage: boolean | undefined;

    const getOptions = () => ({
      queryKey: ['test-fetching-next-tracking'],
      queryFn: ({ pageParam: _pageParam = 0 }) => {
        callCount++;
        if (callCount === 1) {
          return defer1.promise;
        }
        // Capture the state when the second queryFn is called
        capturedIsFetchingNextPage = true;
        return defer2.promise;
      },
      getNextPageParam: (lastPage: { items: string[]; nextPage?: number }) =>
        lastPage.nextPage,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    // Wait for fetching to start
    await when(
      () => {
        return query.fetchStatus === 'fetching';
      },
      { timeout: 1000 }
    );

    expect(query.isFetchingNextPage).toBe(false); // Initial fetch is not "next page"

    // Resolve initial fetch with a nextPage so fetchNextPage can be triggered
    defer1.resolve({ items: ['page0'], nextPage: 1 });

    await when(
      () => {
        return query.status === 'success' && query.fetchStatus === 'idle';
      },
      { timeout: 1000 }
    );

    expect(query.data?.pages).toHaveLength(1);

    // Trigger fetch next page
    query.fetchNextPage();

    // Wait for next page fetch to complete
    await when(
      () => {
        return callCount === 2;
      },
      { timeout: 1000 }
    );

    expect(query.status).toBe('success'); // Status stays success during pagination
    expect(capturedIsFetchingNextPage).toBe(true);

    // Resolve next page fetch
    defer2.resolve({ items: ['page1'], nextPage: undefined });

    await when(
      () => {
        return query.data?.pages?.length === 2;
      },
      { timeout: 1000 }
    );

    expect(query.data?.pages).toHaveLength(2);
  });

  it(`
    should handle fetchNextPage error gracefully
  `, async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
      logger: {
        log: console.log,
        warn: console.warn,
        error: noop,
      },
    });
    let callCount = 0;

    const getOptions = () => ({
      queryKey: ['test-fetch-next-error'],
      queryFn: ({ pageParam: _pageParam = 0 }) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ items: ['page0'], nextPage: 1 });
        }
        return Promise.reject(new Error('Next page error'));
      },
      getNextPageParam: (lastPage: { items: string[]; nextPage?: number }) =>
        lastPage.nextPage,
    });
    const query = createInfinityQuery({
      queryClient,
      getOptions,
    });

    // Wait for initial success
    await when(
      () => {
        return query.status === 'success';
      },
      { timeout: 1000 }
    );

    expect(query.data?.pages).toHaveLength(1);

    // Trigger fetch next page that will fail
    query.fetchNextPage();

    await when(
      () => {
        return query.isError === true;
      },
      { timeout: 1000 }
    );

    expect(query.isError).toBe(true);
    expect(query.error).toBeInstanceOf(Error);
    // Data should still be preserved from successful first page
    expect(query.data?.pages).toHaveLength(1);
  });
});
