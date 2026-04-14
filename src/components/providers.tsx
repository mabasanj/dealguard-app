"use client";

import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { ReactNode } from "react";
import { apiClient } from "@/lib/api-client";

function AuthTokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const accessToken = (session as any)?.accessToken;
    if (accessToken) {
      apiClient.setToken(accessToken);
      return;
    }

    if (status === "unauthenticated") {
      apiClient.removeToken();
    }
  }, [session, status]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthTokenSync />
      {children}
    </SessionProvider>
  );
}
