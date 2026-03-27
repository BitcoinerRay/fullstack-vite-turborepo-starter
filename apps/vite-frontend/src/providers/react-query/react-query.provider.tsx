'use client';

import React, {useMemo, type JSX} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const ReactQueryDevtools = React.lazy(async () => {
  const mod = await import('@tanstack/react-query-devtools');
  return {default: mod.ReactQueryDevtools};
});

export function ReactQueryProvider({children}: {readonly children: React.ReactNode}): JSX.Element {
  const queryClient = useMemo(() => new QueryClient(), []);
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
