import type { ReactNode } from "react";

/**
 * Route template — re-mounts on every navigation so the page-in animation
 * replays cleanly. Unlike layout.tsx this is NOT shared between routes.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
