'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is "fresh" for 60s — no refetch on mount/focus within this window
            staleTime: 60 * 1000,
            // Keep unused data in cache for 10 min
            gcTime: 10 * 60 * 1000,
            // Show stale data while refetching
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
