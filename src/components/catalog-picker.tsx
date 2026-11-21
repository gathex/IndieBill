"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { type SerializedCatalogItem } from "@/components/catalog-manager";

interface CatalogPickerProps {
  onSelect: (item: SerializedCatalogItem) => void;
  items?: SerializedCatalogItem[];
  currency?: string;
  locale?: string;
  buttonLabel?: string;
  size?: "sm" | "default";
}

export function CatalogPicker({
  onSelect,
  items: propItems,
  currency = "USD",
  locale,
  buttonLabel = "Select from catalog",
  size = "sm",
}: CatalogPickerProps) {
  const [open, setOpen] = useState(false);
  const [fetchedItems, setFetchedItems] = useState<SerializedCatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const catalogItems = useMemo(() => {
    if (propItems && propItems.length > 0) {
      return propItems.filter((i) => i.isActive);
    }
    return fetchedItems.filter((i) => i.isActive);
  }, [propItems, fetchedItems]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return catalogItems;
    const q = search.toLowerCase();
    return catalogItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.unit && item.unit.toLowerCase().includes(q)) ||
        (item.hsnSac && item.hsnSac.toLowerCase().includes(q))
    );
  }, [catalogItems, search]);

  function handleSelect(item: SerializedCatalogItem) {
    onSelect(item);
    setOpen(false);
    setSearch("");
  }

  function handleToggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next && (!propItems || propItems.length === 0) && fetchedItems.length === 0) {
        setLoading(true);
        fetch("/api/catalog?activeOnly=true")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setFetchedItems(data);
            }
          })
          .catch((err) => console.error("Error fetching catalog:", err))
          .finally(() => setLoading(false));
      }
      if (!next) setSearch("");
      return next;
    });
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
        className={`inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-medium transition-colors ${
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        }`}
      >
        <svg
          className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <span>{buttonLabel}</span>
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-1.5 w-80 sm:w-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search catalog items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  setSearch("");
                }
                if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  handleSelect(filtered[0]);
                }
              }}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {loading ? (
              <div className="py-6 text-center text-xs text-zinc-500">Loading catalog…</div>
            ) : filtered.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {catalogItems.length === 0
                  ? "No active items in catalog."
                  : "No items match your search."}
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white">
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">
                      {formatCurrency(item.rate, currency, locale)}
                      {item.unit ? (
                        <span className="font-normal text-[11px] text-zinc-500 dark:text-zinc-400 ml-0.5">
                          /{item.unit}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  {item.description ? (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {item.unit ? (
                      <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-300 font-mono">
                        {item.unit}
                      </span>
                    ) : null}
                    {item.hsnSac ? (
                      <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-300 font-mono">
                        HSN: {item.hsnSac}
                      </span>
                    ) : null}
                    {item.defaultTaxRate !== null && item.defaultTaxRate !== undefined ? (
                      <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-medium">
                        Tax: {item.defaultTaxRate}%
                      </span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
