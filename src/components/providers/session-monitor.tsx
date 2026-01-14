"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SessionMonitor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasShownWarning = useRef(false);
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    // Only run if user is authenticated
    if (status !== "authenticated" || !session?.expires) {
      return;
    }

    const checkSession = () => {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const timeRemaining = expiresAt - now;

      // Session has expired
      if (timeRemaining <= 0) {
        if (!hasLoggedOut.current) {
          hasLoggedOut.current = true;
          toast.error("Sesi Anda telah berakhir", {
            description: "Silakan login kembali untuk melanjutkan.",
          });

          // Sign out and redirect to login
          window.location.href = "/login?reason=expired";
        }
        return;
      }

      // Warn 5 minutes before expiration
      const fiveMinutes = 5 * 60 * 1000;
      if (timeRemaining <= fiveMinutes && !hasShownWarning.current) {
        hasShownWarning.current = true;
        toast.warning("Sesi Anda akan segera berakhir", {
          description: "Silakan simpan pekerjaan Anda.",
          duration: 10000,
        });
      }
    };

    // Check immediately
    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [session, status, router]);

  // Listen for storage events (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "logout-event") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return null;
}
