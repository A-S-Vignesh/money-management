// components/PullToRefresh.tsx
//
// Wraps a scrollable content area and adds the iconic pull-down-to-refresh
// gesture. Designed for mobile only — desktop renders children unchanged.
//
// Behavior:
//   - Only activates when the wrapped scroll container is at scrollTop === 0
//     and the user pulls DOWN. Otherwise touches pass through to native scroll.
//   - Visual indicator grows + rotates as the user pulls past the threshold
//   - Releasing past the threshold fires onRefresh(); the indicator stays
//     spinning until the returned promise resolves.
//   - Releasing before the threshold snaps back instantly.
//
// Usage:
//   <PullToRefresh onRefresh={async () => { await refetch(); }}>
//     <div>...your content...</div>
//   </PullToRefresh>
//
// Note: place the parent's `overflow-y-auto` ON the PullToRefresh container,
// or pass `scrollContainerRef` if your scroll lives elsewhere (e.g. the
// dashboard layout's main panel). The hook below uses `window.scrollY` as a
// fallback when no specific container is passed.
"use client";

import {
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type TouchEvent,
} from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  // Pixels the user must pull past to trigger a refresh
  threshold?: number;
  // Max visual pull distance (rubber-banded beyond this)
  maxPull?: number;
  // Set to false to disable in dev / for specific routes
  enabled?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 64,
  maxPull = 120,
  enabled = true,
}: PullToRefreshProps) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const passedThresholdRef = useRef(false);

  // Decide whether the touch should engage the gesture or pass through
  // to native scroll. We only want to grab if the *outer scroll container*
  // is at the top — i.e. the user can't scroll up any further.
  const canStartPull = useCallback(() => {
    // Find the closest scrolling ancestor of the document and check its
    // scroll position. The dashboard layout sets `overflow-y-auto` on a
    // <div> inside <main>, so scrollY itself is always 0. We check both.
    const scrollEls = document.querySelectorAll<HTMLElement>(".overflow-y-auto");
    for (const el of scrollEls) {
      // First scrolling ancestor that has visible scroll wins
      if (el.scrollHeight > el.clientHeight) {
        return el.scrollTop <= 0;
      }
    }
    return window.scrollY <= 0;
  }, []);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!enabled || refreshing) return;
    if (!canStartPull()) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
    passedThresholdRef.current = false;
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!enabled || refreshing || startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) {
      // Going up — abandon gesture
      setPull(0);
      startY.current = null;
      return;
    }
    // Rubber-band past threshold
    const eased =
      dy < threshold
        ? dy
        : threshold + (dy - threshold) * 0.4;
    const clamped = Math.min(maxPull, eased);
    setPull(clamped);

    // Haptic tick when crossing threshold
    if (!passedThresholdRef.current && clamped >= threshold) {
      passedThresholdRef.current = true;
      haptic("light");
    }
  };

  const onTouchEnd = async () => {
    if (!enabled || startY.current === null) return;
    startY.current = null;

    if (pull >= threshold && !refreshing) {
      setRefreshing(true);
      setPull(threshold); // hold at threshold while spinning
      haptic("medium");
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  // Spinner intensity ramps with pull distance
  const triggered = pull >= threshold;
  const rotation = Math.min(180, (pull / threshold) * 180);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className="relative"
      style={{
        // Move the content down as the user pulls; snap back via transition
        // when no longer dragging.
        transform: `translateY(${pull}px)`,
        transition: startY.current === null ? "transform 200ms ease-out" : "none",
      }}
    >
      {/* Pull indicator — sits above content, only visible during a pull */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
        style={{
          top: -56,
          opacity: pull > 8 ? 1 : 0,
          transition: "opacity 150ms",
        }}
      >
        <div
          className={`w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center ${
            triggered ? "text-indigo-600 dark:text-indigo-300" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {refreshing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ArrowDown
              size={18}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "transform 100ms",
              }}
            />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
