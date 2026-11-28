import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AppLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading page">
      {/* Page Header Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-52 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-72 max-w-full rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-24 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 hidden sm:block" />
        </div>
      </div>

      {/* KPI / Summary Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardHeader className="pb-2">
              <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-7 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Table / Panel Skeleton */}
      <Card>
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-9 w-full max-w-xs rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-56 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
            >
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-32 rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
              </div>
              <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
              <div className="h-5 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
