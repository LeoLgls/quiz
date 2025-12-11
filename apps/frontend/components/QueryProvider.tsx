"use client";

import React from "react";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() =>
    new QueryClient({
      queryCache: new QueryCache({
        onError: (err) => {
          // Central logging for query errors
          console.error('React Query error', err);
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60, // 1 minute
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 0,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
