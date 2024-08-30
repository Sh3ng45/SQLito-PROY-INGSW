import { useState, useEffect, useCallback } from 'react';
import isEqual from 'react-fast-compare';

interface IUseLocalStorageOptions<T> {
  encode?: (value: T) => string;
  decode?: (value: string) => T;
  sync?: boolean;
}

function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: IUseLocalStorageOptions<T> = {},
): [T, (valueOrFn: T | ((prev: T) => T)) => void] {
  const {
    encode = JSON.stringify as (value: T) => string,
    decode = JSON.parse as (value: string) => T,
    sync = true,
  } = options;

  const [localStorageValue, setLocalStorageValue] = useState<T>(() => {
    const value = localStorage.getItem(key);
    if (value) {
      return decode(value);
    }
    return defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, encode(localStorageValue));
  }, [key, localStorageValue, encode]);

  const setLocalStorageStateValue = useCallback((valueOrFn: T | ((prev: T) => T)) => {
    setLocalStorageValue((prev) => (valueOrFn instanceof Function ? valueOrFn(prev) : valueOrFn));
  }, []);

  useEffect(() => {
    if (!sync) return () => {};

    const update = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue === null) {
          setLocalStorageValue(defaultValue);
        } else {
          const newValue = decode(event.newValue);
          if (!isEqual(localStorageValue, newValue)) {
            setLocalStorageValue(newValue);
          }
        }
      }
    };

    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener('storage', update);
    };
  }, [sync, decode, defaultValue, key, localStorageValue]);

  return [localStorageValue, setLocalStorageStateValue];
}

export default useLocalStorage;
