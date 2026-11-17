"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "@/lib/errors";

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

interface Result<T> {
  key: object;
  data: T | null;
  error: string | null;
}

/** Ejecuta `loader` (debe ser estable: módulo o useCallback). `null` = no cargar todavía. */
export function useAsync<T>(loader: (() => Promise<T>) | null): AsyncState<T> {
  const [version, setVersion] = useState(0);
  const key = useMemo(() => ({ loader, version }), [loader, version]);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (!loader) return;
    let active = true;
    loader().then(
      (data) => active && setResult({ key, data, error: null }),
      (error: unknown) => active && setResult({ key, data: null, error: errorMessage(error) }),
    );
    return () => {
      active = false;
    };
  }, [loader, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const done = result?.key === key;

  return {
    data: result?.data ?? null,
    error: done ? result.error : null,
    loading: loader !== null && !done,
    reload,
  };
}
