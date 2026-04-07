import React, {type JSX} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const ReactQueryDevtools = React.lazy(async () => {
  const mod = await import('@tanstack/react-query-devtools');
  return {default: mod.ReactQueryDevtools};
});

const ONE_MINUTE_MS = 60 * 1000;
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS;

// Module-scoped singleton — survives provider remounts and keeps the cache.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: ONE_MINUTE_MS,
      gcTime: FIVE_MINUTES_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry(failureCount, error) {
        const status = (error as {response?: {status?: number}})?.response?.status;
        if (status !== undefined && status >= 400 && status < 500) {
          return false;
        }

        return failureCount < 2;
      },
      retryDelay(attemptIndex) {
        return Math.min(1000 * 2 ** attemptIndex, 30_000);
      },
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});

export function ReactQueryProvider({children}: {readonly children: React.ReactNode}): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV ? (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </React.Suspense>
      ) : null}
      {children}
    </QueryClientProvider>
  );
}
