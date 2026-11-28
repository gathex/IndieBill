"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateReminderSettings } from "@/actions/reminders";

interface ReminderSettingsCardProps {
  remindersEnabled: boolean;
  remindBeforeDays: number;
  remindOnDueDate: boolean;
  remindAfterDays: string;
}

export function ReminderSettingsCard({
  remindersEnabled,
  remindBeforeDays,
  remindOnDueDate,
  remindAfterDays,
}: ReminderSettingsCardProps) {
  const [enabled, setEnabled] = useState(remindersEnabled);
  const [beforeDays, setBeforeDays] = useState(remindBeforeDays);
  const [onDue, setOnDue] = useState(remindOnDueDate);
  const [afterDays, setAfterDays] = useState(remindAfterDays);

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const formData = new FormData();
    formData.set("remindersEnabled", enabled ? "true" : "false");
    formData.set("remindBeforeDays", beforeDays.toString());
    formData.set("remindOnDueDate", onDue ? "true" : "false");
    formData.set("remindAfterDays", afterDays);

    startTransition(async () => {
      try {
        await updateReminderSettings(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update reminder settings.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-zinc-700 dark:text-zinc-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Automated Payment Reminders</span>
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Automatically email polite reminders for upcoming, due, and overdue invoices.
            </p>
          </div>

          {/* Master Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => {
              setEnabled(!enabled);
              setSaved(false);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
              enabled ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
            title={enabled ? "Disable reminders" : "Enable reminders"}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-900 shadow-md ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className={`space-y-4 transition-opacity duration-200 ${
              enabled ? "opacity-100" : "opacity-40 pointer-events-none"
            }`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Days before due date */}
              <div className="space-y-1.5">
                <Label htmlFor="remindBeforeDays" className="text-xs font-medium">
                  Upcoming reminder (days before due date)
                </Label>
                <Input
                  id="remindBeforeDays"
                  name="remindBeforeDays"
                  type="number"
                  min="0"
                  max="30"
                  value={beforeDays}
                  onChange={(e) => {
                    setBeforeDays(parseInt(e.target.value, 10) || 0);
                    setSaved(false);
                  }}
                  className="h-9"
                  disabled={!enabled}
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Set to 0 to disable the upcoming reminder notice.
                </p>
              </div>

              {/* Overdue follow-up days */}
              <div className="space-y-1.5">
                <Label htmlFor="remindAfterDays" className="text-xs font-medium">
                  Overdue follow-ups (days after due date)
                </Label>
                <Input
                  id="remindAfterDays"
                  name="remindAfterDays"
                  type="text"
                  placeholder="3, 7, 14"
                  value={afterDays}
                  onChange={(e) => {
                    setAfterDays(e.target.value);
                    setSaved(false);
                  }}
                  className="h-9 font-mono text-xs"
                  disabled={!enabled}
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Comma-separated days to send overdue reminders (e.g. 3, 7, 14).
                </p>
              </div>
            </div>

            {/* Remind on due date checkbox */}
            <div className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              <input
                id="remindOnDueDate"
                name="remindOnDueDate"
                type="checkbox"
                checked={onDue}
                onChange={(e) => {
                  setOnDue(e.target.checked);
                  setSaved(false);
                }}
                disabled={!enabled}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
              />
              <div className="text-xs">
                <label
                  htmlFor="remindOnDueDate"
                  className="font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  Send reminder on the exact due date
                </label>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                  Sends an &quot;Invoice Due Today&quot; email notification with PDF and payment link.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div>
              {saved ? (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>✓</span>
                  <span>Reminder settings saved successfully.</span>
                </p>
              ) : error ? (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Automated reminders check daily at midnight and never email the same invoice twice on the same day.
                </p>
              )}
            </div>

            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save reminder settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
