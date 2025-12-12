'use client';

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            console.error('React Query error:', error);
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}