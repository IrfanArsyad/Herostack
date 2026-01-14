"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { SessionMonitor } from "./session-monitor";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window is focused
      refetchOnWindowFocus={true}
    >
      <SessionMonitor />
      {children}
    </NextAuthSessionProvider>
  );
}
