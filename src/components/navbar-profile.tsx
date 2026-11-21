"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/actions/auth";

export interface NavbarUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface NavbarProfileProps {
  user?: NavbarUser | null;
}

export function NavbarProfile({ user }: NavbarProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close when pathname changes (useRef avoids react-hooks/set-state-in-effect)
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  // Close on outside click and Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email || "Account";
  const email = user.email || "";
  const avatarUrl = user.image;
  const initial = (user.name?.[0] || user.email?.[0] || "U").toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center rounded-full p-0.5 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
        aria-label="User account menu"
        aria-expanded={isOpen}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={34}
            height={34}
            unoptimized
            referrerPolicy="no-referrer"
            className="h-8.5 w-8.5 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 hover:ring-zinc-300 dark:hover:ring-zinc-600 transition-all"
          />
        ) : (
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 ring-1 ring-zinc-300 dark:ring-zinc-700">
            {initial}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 shadow-xl shadow-zinc-950/5 dark:shadow-black/50 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info Header */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={36}
                height={36}
                unoptimized
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900 shrink-0">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {displayName}
              </p>
              {email && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {email}
                </p>
              )}
            </div>
          </div>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          {/* Settings Link */}
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <svg
              className="h-4 w-4 text-zinc-400 dark:text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Settings</span>
          </Link>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          {/* Sign Out Action */}
          <form action={logoutUser} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
