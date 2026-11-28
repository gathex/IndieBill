"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Portals modal/dialog overlays directly to `document.body` so they never get
 * trapped inside ancestor transform/animation stacking contexts.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isClient) return null;
  return createPortal(children, document.body);
}
