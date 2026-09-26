import { useCallback, useState } from 'react';

// Like useState, but remembered in sessionStorage for the current browser tab/session.
export function useSessionState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.sessionStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch (_) {
      return initial;
    }
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          window.sessionStorage.setItem(key, JSON.stringify(resolved));
        } catch (_) {
          /* storage unavailable (private mode etc.) - state still works in memory */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set];
}
