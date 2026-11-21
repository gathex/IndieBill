"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
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
  if (!user) {
    return null;
  }

  const displayName = user.name || user.email || "Account";
  const email = user.email || "";
  const avatarUrl = user.image;
  const initial = (user.name?.[0] || user.email?.[0] || "U").toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            unoptimized
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {initial}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
            {displayName}
          </p>
          {email && email !== displayName && (
            <p className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400 truncate max-w-[140px] mt-0.5">
              {email}
            </p>
          )}
        </div>
      </div>

      <form action={logoutUser}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="text-xs font-medium"
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}
