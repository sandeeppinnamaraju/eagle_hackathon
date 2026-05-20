import { useEffect, useMemo, useRef, useState } from "react";

interface UseIncrementalListOptions {
  initialCount: number;
  incrementCount: number;
  resetKey: string;
}

export function useIncrementalList<T>(items: T[], options: UseIncrementalListOptions) {
  const { initialCount, incrementCount, resetKey } = options;
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [initialCount, resetKey]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) {
          return;
        }

        setVisibleCount((current) => Math.min(current + incrementCount, items.length));
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [incrementCount, items.length]);

  const visibleItems = useMemo(
    () => items.slice(0, Math.min(visibleCount, items.length)),
    [items, visibleCount],
  );

  return {
    visibleItems,
    visibleCount: Math.min(visibleCount, items.length),
    loadMoreRef,
  };
}