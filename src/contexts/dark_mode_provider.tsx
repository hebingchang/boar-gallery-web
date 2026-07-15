import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { DarkModeContext } from "./dark_mode.ts";

const STORAGE_KEY = "darkMode";
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

function getSystemPreference() {
  if (typeof window === "undefined" || !window.matchMedia) return false;

  const query = window.matchMedia(DARK_MODE_QUERY);
  return query.media === DARK_MODE_QUERY && query.matches;
}

function getInitialValue() {
  if (typeof window === "undefined") return false;

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue !== null) {
      const parsedValue: unknown = JSON.parse(storedValue);
      if (typeof parsedValue === "boolean") return parsedValue;
    }
  } catch {
    // Fall back to the system preference when storage is unavailable or invalid.
  }

  return getSystemPreference();
}

export function DarkModeProvider({ children }: PropsWithChildren) {
  const [value, setValue] = useState(getInitialValue);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(value ? "dark" : "light");
    root.classList.remove(value ? "light" : "dark");

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // The current theme still works when storage is unavailable.
    }
  }, [value]);

  useEffect(() => {
    if (!window.matchMedia) return;

    const query = window.matchMedia(DARK_MODE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setValue(event.matches);

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }

    query.addListener(handleChange);
    return () => query.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue === null) return;

      try {
        const nextValue: unknown = JSON.parse(event.newValue);
        if (typeof nextValue === "boolean") setValue(nextValue);
      } catch {
        // Ignore invalid values written by other tabs.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const enable = useCallback(() => setValue(true), []);
  const disable = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((currentValue) => !currentValue), []);
  const state = useMemo(
    () => ({ value, enable, disable, toggle }),
    [value, enable, disable, toggle],
  );

  return <DarkModeContext.Provider value={state}>{children}</DarkModeContext.Provider>;
}
