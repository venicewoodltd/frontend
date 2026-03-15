import { useEffect } from "react";
import { usePathname } from "next/navigation";

const API_URL = "";

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const trackVisit = async () => {
      try {
        await fetch(`${API_URL}/api/track-visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer,
          }),
        });
      } catch {
        // Silently fail — don't impact user experience
      }
    };

    trackVisit();
  }, [pathname]);
}
