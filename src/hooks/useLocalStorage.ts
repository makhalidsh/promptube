'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * A custom hook to synchronize state with localStorage.
 * Safe for Next.js SSR (Server-Side Rendering).
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Always initialize with initialValue to prevent hydration mismatches
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Load from localStorage only after mount (client-side only, after hydration)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed !== null && parsed !== undefined) {
          setStoredValue(parsed);
        }
      }
    } catch (error) {
      console.warn(`Error loading localStorage key "${key}":`, error);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((currentVal) => {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(currentVal) : value;
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

