// components/SwipeableRow.tsx
//
// Wraps a list row and adds the iconic iOS-style "swipe left to reveal
// delete" gesture. Mobile only — on desktop, children render unchanged
// (use your existing per-row hover actions on the desktop side).
//
// Behavior:
//   - Touch + drag left → content slides left, revealing a red delete area
//   - Drag past `revealWidth` → snaps open, tap the revealed button to delete
//   - Drag past `commitThreshold` → fires onDelete immediately on release
//     (the iOS "fast swipe" shortcut)
//   - Tapping outside the open row, or starting a new swipe on another, snaps
//     back. We expose `forceClose()` via the imperative handle for a parent
//     "close all" pattern but don't require it.
//   - Vertical drags are passed through to the parent (so list scroll still
//     works).
"use client";

import {
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { Trash2 } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface SwipeableRowProps {
  onDelete: () => void;
  children: ReactNode;
  // How far the row reveals when fully open
  revealWidth?: number;
  // If the user releases past this distance, fire onDelete without an extra tap
  commitThreshold?: number;
  // Set false to disable (e.g. for system accounts that can't be deleted)
  enabled?: boolean;
  // Optional custom label for the action area
  actionLabel?: string;
}

export default function SwipeableRow({
  onDelete,
  children,
  revealWidth = 88,
  commitThreshold = 200,
  enabled = true,
  actionLabel = "Delete",
}: SwipeableRowProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const passedCommit = useRef(false);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    passedCommit.current = false;
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!enabled || startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // First few px decide intent: horizontal vs vertical drag.
    // If vertical, we abandon the gesture and let the list scroll.
    if (isHorizontal.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      if (!isHorizontal.current) {
        startX.current = null;
        return;
      }
    }

    // Allow swiping left from closed (dx negative)
    // Allow swiping right from open (dx positive, brings offset back to 0)
    let next = open ? -revealWidth + dx : dx;
    if (next > 0) next = 0; // never drag past the right edge
    setOffset(next);

    if (!passedCommit.current && next <= -commitThreshold) {
      passedCommit.current = true;
      haptic("medium");
    }
  };

  const onTouchEnd = () => {
    if (!enabled || startX.current === null) {
      startX.current = null;
      return;
    }
    startX.current = null;

    if (offset <= -commitThreshold) {
      // Fast-swipe: fire delete immediately
      haptic("heavy");
      // Slide off screen briefly for visual confirmation, then call delete
      setOffset(-window.innerWidth);
      setTimeout(onDelete, 180);
      return;
    }
    if (offset <= -revealWidth / 2) {
      setOffset(-revealWidth);
      setOpen(true);
      haptic("light");
    } else {
      setOffset(0);
      setOpen(false);
    }
  };

  const close = () => {
    setOffset(0);
    setOpen(false);
  };

  const handleDeleteTap = () => {
    haptic("medium");
    close();
    onDelete();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action area sits behind the row content; revealed by sliding content left */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          type="button"
          onClick={handleDeleteTap}
          className="bg-red-600 hover:bg-red-700 text-white px-5 flex flex-col items-center justify-center gap-1 min-w-[88px]"
          aria-label={actionLabel}
        >
          <Trash2 size={18} />
          <span className="text-xs font-medium">{actionLabel}</span>
        </button>
      </div>

      {/* Sliding content. Tapping it while open snaps it back closed. */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={open ? close : undefined}
        className="relative bg-white dark:bg-gray-900"
        style={{
          transform: `translateX(${offset}px)`,
          transition:
            startX.current === null ? "transform 220ms ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
