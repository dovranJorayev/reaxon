import { QueryClient } from '@tanstack/query-core';
import { configure, when } from 'mobx';
import { afterAll, beforeAll, describe, expect, vi } from 'vitest';
import { createQuery } from './query';
import { makeDeffer, itObserve } from './tools';

configure({
  enforceActions: 'always',
});

const it = itObserve;

const noop = () => {};
const allowFetchStart = async (delay = 500) => {
  await new Promise(resolve => setTimeout(resolve, delay));
};

describe.concurrent(
  `fetching SHOULD start on empty cache value for given query key 
  on reactive vars read inside reactive environment (autorun, reaction, etc)`,
  () => {
    it('check fetch on data read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.data?.name === 'test', { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on dataUpdatedAt read', async () => {
      const now = Date.now();
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.failureCount > 0, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on fetchStatus read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.isError === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetched read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.isFetched === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetchedAfterMount read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.isFetchedAfterMount === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isFetching read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.isFetching === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isLoading read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      /** query.isLoading is true by default is there is no data in cache or no query call was made yet */
      await when(() => query.isLoading === false, { timeout: 1000 });

      // await new Promise(resolve => setTimeout(resolve, 1000));

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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.isLoadingError === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isPaused read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      observe(() => {
        query.isPaused;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isPlaceholderData read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      observe(() => {
        query.isPlaceholderData;
      });
      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isPreviousData read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      observe(() => {
        query.isRefetching;
      });
      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isStale read', async ({ observe }) => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient({
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      observe(() => {
        query.isStale;
      });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on isSuccess read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      await when(() => query.isSuccess === true, { timeout: 1000 });

      expect(fetchMock).toHaveBeenCalled();
    });
    it('check fetch on status read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read data outside of reactive context
      const _data = query.data;

      // Wait a bit to ensure no fetch was triggered
      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on dataUpdatedAt read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read failureCount outside of reactive context
      const _failureCount = query.failureCount;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on fetchStatus read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isError outside of reactive context
      const _isError = query.isError;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetched read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isFetched outside of reactive context
      const _isFetched = query.isFetched;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetchedAfterMount read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isFetchedAfterMount outside of reactive context
      const _isFetchedAfterMount = query.isFetchedAfterMount;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isFetching read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isFetching outside of reactive context
      const _isFetching = query.isFetching;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isLoading read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isLoadingError outside of reactive context
      const _isLoadingError = query.isLoadingError;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isPaused read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isPaused outside of reactive context
      const _isPaused = query.isPaused;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isPlaceholderData read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isPlaceholderData outside of reactive context
      const _isPlaceholderData = query.isPlaceholderData;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isPreviousData read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
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
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isRefetching outside of reactive context
      const _isRefetching = query.isRefetching;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isStale read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient({
        logger: {
          error: noop,
          log: console.log,
          warn: console.warn,
        },
      });
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isStale outside of reactive context
      const _isStale = query.isStale;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on isSuccess read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read isSuccess outside of reactive context
      const _isSuccess = query.isSuccess;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
    it('should not fetch on status read', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
      const queryClient = new QueryClient();
      const query = createQuery({
        queryClient,
        getOptions: () => ({ queryKey: ['test'], queryFn: fetchMock }),
      });

      // Read status outside of reactive context
      const _status = query.status;

      await allowFetchStart();

      expect(fetchMock).not.toHaveBeenCalled();
    });
  }
);

describe.concurrent(
  'createQuery. Ensure correct type invariants for query result',
  () => {
    it(`
    should match QueryObserverLoadingResult invariants:
    status: loading,
    data: undefined,
    error: null,
    isLoading: true,
    isError: false,
    isSuccess: false,
    fetchStatus: 'fetching'
  `, async () => {
      const defer = makeDeffer<{ data: string }>();
      const queryClient = new QueryClient();
      const getOptions = () => ({
        queryKey: ['test'],
        queryFn: () => defer.promise,
      });
      const query = createQuery({
        queryClient,
        getOptions,
      });

      await when(
        () => {
          return query.fetchStatus === 'fetching';
        },
        { timeout: 1000 }
      );
      defer.resolve({ data: 'test' });

      expect(query.status).toBe('loading');
      expect(query.data).toBeUndefined();
      expect(query.error).toBeNull();
      expect(query.isLoading).toBe(true);
      expect(query.isError).toBe(false);
      expect(query.isSuccess).toBe(false);
      expect(query.fetchStatus).toBe('fetching');
    });
    it(`
    should match QueryObserverLoadingErrorResult invariants:
    status: error,
    data: undefined,
    error: TError,
    isLoading: false,
    isError: true,
    isSuccess: false,
    isLoadingError: true
  `, async () => {
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
      const getOptions = () => ({
        queryKey: ['test'],
        queryFn: () => Promise.reject(new Error('test')),
      });
      const query = createQuery({
        queryClient,
        getOptions,
      });

      await when(
        () => {
          return query.status === 'error';
        },
        { timeout: 1000 }
      );

      expect(query.status).toBe('error');
      expect(query.data).toBeUndefined();
      expect(query.error).toBeInstanceOf(Error);
      expect(query.isLoading).toBe(false);
      expect(query.isError).toBe(true);
      expect(query.isSuccess).toBe(false);
      expect(query.fetchStatus).toBe('idle');
    });
    it(`
    should match QueryObserverRefetchErrorResult invariants:
    status: error,
    data: TData,
    error: TError,
    isLoading: false,
    isError: true,
    isSuccess: false,
    isRefetchError: true
  `, async () => {
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
      let i = 0;
      const getOptions = () => ({
        queryKey: ['test'],
        queryFn: () =>
          i++ === 0
            ? Promise.resolve({ data: 'test' })
            : Promise.reject(new Error('test')),
      });
      const query = createQuery({
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

      expect(query.status).toBe('error');
      expect(query.data).toEqual({ data: 'test' });
      expect(query.error).toBeInstanceOf(Error);
      expect(query.isLoading).toBe(false);
      expect(query.isError).toBe(true);
      expect(query.isSuccess).toBe(false);
      expect(query.isRefetchError).toBe(true);
    });
    it(`
    should match QueryObserverSuccessResult invariants:
    status: success,
    data: TData,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true
  `, async () => {
      const queryClient = new QueryClient();
      const getOptions = () => ({
        queryKey: ['test'],
        queryFn: () => Promise.resolve({ data: 'test' }),
      });
      const query = createQuery({
        queryClient,
        getOptions,
      });

      await when(
        () => {
          return query.status === 'success';
        },
        { timeout: 1000 }
      );

      expect(query.status).toBe('success');
      expect(query.data).toEqual({ data: 'test' });
      expect(query.error).toBeNull();
      expect(query.isLoading).toBe(false);
      expect(query.isError).toBe(false);
      expect(query.isSuccess).toBe(true);
      expect(query.fetchStatus).toBe('idle');
    });
  }
);

describe.concurrent('methods correctness', () => {
  it('refetch should NOT refetch the query if query fields WAS NOT observed', async () => {
    const queryClient = new QueryClient();
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });
    const query = createQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test'],
        queryFn: () => Promise.resolve({ data: 'test' }),
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
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });
    const query = createQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test'],
        queryFn: queryFn,
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
    const query = createQuery({
      queryClient,
      getOptions: () => ({
        queryKey: ['test'],
        queryFn: () => Promise.resolve({ data: 'test' }),
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
});

/**
 * @description for test that requires to wait for a error throw there is a recipe
 * @example
 * ```ts
 * import { _resetGlobalState, observable } from 'mobx';
 *
 * configure({ disableErrorBoundaries: true });
 *
 * describe('Throw if age is negative', () => {
 *    test('Throw if age is negative', () => {
 *      expect(() => {
 *        const age = observable.box(10);
 *        autorun(() => {
 *          if (age.get() < 0) throw new Error('Age should not be negative');
 *        });
 *        age.set(-1);
 *      }).toThrow('Age should not be negative');
 *    });
 *
 *    afterEach(() => {
 *      _resetGlobalState();
 *    });
 * });
 * ```
 */
