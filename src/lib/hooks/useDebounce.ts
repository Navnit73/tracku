"use client";

import { useState, useEffect } from "react";

/**
 * Custom React hook that debounces a fast-changing value by delay milliseconds.
 * Useful for text searches, numerical inputs, and filter queries to avoid excessive server requests.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
