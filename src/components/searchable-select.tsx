"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import type { LocaleOption } from "@/lib/locale-data";

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  options: LocaleOption[];
  onChange: (code: string) => void;
  placeholder?: string;
}

function optionLabel(option: LocaleOption): string {
  return `${option.name} (${option.code})`;
}

export function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
}: SearchableSelectProps) {
  const selected = options.find((option) => option.code === value);
  const [query, setQuery] = useState(selected ? optionLabel(selected) : "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options
      .filter((option) =>
        `${option.name} ${option.code}`.toLowerCase().includes(needle),
      )
      .slice(0, 200);
  }, [options, query]);

  function choose(option: LocaleOption) {
    onChange(option.code);
    setQuery(optionLabel(option));
    setOpen(false);
  }

  function resetToSelection() {
    const current = options.find((option) => option.code === value);
    setQuery(current ? optionLabel(current) : "");
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-autocomplete="list"
          autoComplete="off"
          className="flex h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          value={query}
          placeholder={placeholder ?? "Type to search…"}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            resetToSelection();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              resetToSelection();
            }
            if (event.key === "Enter" && open && filtered.length > 0) {
              event.preventDefault();
              choose(filtered[0]);
            }
          }}
        />
        {open ? (
          <ul
            id={`${id}-options`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">No matches</li>
            ) : (
              filtered.map((option) => (
                <li
                  key={option.code}
                  role="option"
                  aria-selected={option.code === value}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    option.code === value ? "bg-zinc-50 dark:bg-zinc-950 font-medium" : ""
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  {optionLabel(option)}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {options.length} options · type to search
      </p>
    </div>
  );
}
