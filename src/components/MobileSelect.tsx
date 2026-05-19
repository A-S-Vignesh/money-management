// components/MobileSelect.tsx
//
// Replacement for native <select> that gives a bottom-sheet picker on mobile
// (the single biggest "this feels like an app" win) and a styled dropdown
// on desktop. Same controlled API as a native <select>: pass value + onChange.
//
// Design choices:
//   - Single source of truth for both desktop and mobile renders. The
//     "modal" is a portal-rendered bottom sheet on small screens, a small
//     popover under the trigger on larger screens.
//   - Closes on selection. The selected item gets a checkmark.
//   - Keyboard: Esc closes, Enter on the trigger opens. Arrow navigation
//     intentionally NOT added (keep it simple — desktop users can also
//     just type-search via the native browser focus).
//   - No search bar by default. If `searchable`, shows a filter input.
//
// Usage:
//   <MobileSelect
//     value={category}
//     onChange={setCategory}
//     options={[{ value: "Food", label: "Food", icon: <Utensils/> }]}
//     placeholder="Select category"
//     label="Category"
//   />
"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { haptic } from "@/lib/haptic";

export interface MobileSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface MobileSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  label?: string;
  // Optional: pass an error message to render in red below the trigger
  error?: string;
  disabled?: boolean;
  // Show a search input above the option list. Auto-on if options.length >= 8.
  searchable?: boolean;
  // Title shown at top of the bottom sheet (defaults to label)
  sheetTitle?: string;
  className?: string;
}

export default function MobileSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  label,
  error,
  disabled,
  searchable,
  sheetTitle,
  className,
}: MobileSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);
  const showSearch = searchable ?? options.length >= 8;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q),
    );
  }, [options, query]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const choose = (v: string) => {
    haptic("light");
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  const triggerClass = `w-full flex items-center justify-between gap-2 px-3 py-2.5 border rounded-xl text-sm text-left bg-white transition-colors ${
    disabled
      ? "opacity-60 cursor-not-allowed"
      : "hover:border-gray-400 cursor-pointer"
  } ${
    error
      ? "border-red-300 bg-red-50 dark:bg-red-950/30"
      : "border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
  } ${className ?? ""}`;

  return (
    <>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          haptic("light");
          setOpen(true);
        }}
        disabled={disabled}
        className={triggerClass}
      >
        <span
          className={`flex items-center gap-2 truncate ${
            selected ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {selected?.icon && (
            <span className="shrink-0 text-gray-500 dark:text-gray-400">{selected.icon}</span>
          )}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
      </button>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p>}

      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 w-full md:max-w-md rounded-t-[2rem] md:rounded-2xl shadow-2xl animate-slide-up md:animate-none flex flex-col max-h-[85vh] md:max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile only) */}
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-1 md:hidden" />

              {/* Header */}
              <div className="flex justify-between items-center px-5 pt-3 md:pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {sheetTitle ?? label ?? "Select"}
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              {showSearch && (
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search…"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="overflow-y-auto overscroll-contain flex-1 py-1 pb-safe">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No matches
                  </div>
                ) : (
                  filtered.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => choose(opt.value)}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                          opt.disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100"
                        } ${isSelected ? "bg-indigo-50/60" : ""}`}
                      >
                        {opt.icon && (
                          <span className="shrink-0 text-gray-500 dark:text-gray-400">
                            {opt.icon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm truncate ${
                              isSelected
                                ? "font-semibold text-indigo-700 dark:text-indigo-300"
                                : "font-medium text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {opt.label}
                          </p>
                          {opt.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {opt.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check size={16} className="text-indigo-600 dark:text-indigo-300 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
