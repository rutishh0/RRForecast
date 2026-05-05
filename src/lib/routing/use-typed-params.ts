import { useSearchParams } from "react-router-dom";
import { useMemo, useCallback } from "react";

function readString(params: URLSearchParams, key: string): string | undefined {
  const v = params.get(key);
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

function readEnum<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]): T | undefined {
  const v = params.get(key) as T | null;
  return v && allowed.includes(v) ? v : undefined;
}

type Patch<T> = Partial<{ [K in keyof T]: T[K] | undefined | null | "" }>;

function useUpdater<T>() {
  const [, setParams] = useSearchParams();
  return useCallback(
    (patch: Patch<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === null || v === "") next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
}

// ---- /shop-visits ----

export interface ShopVisitsParams {
  lessor?: string;
  operator?: string;
  engineType?: string;
  aircraftType?: string;
  status?: string;
  shop?: string;
  wingStatus?: string;
  priority?: string;
  search?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

export function useShopVisitsParams(): readonly [ShopVisitsParams, (patch: Patch<ShopVisitsParams>) => void] {
  const [params] = useSearchParams();
  const value = useMemo<ShopVisitsParams>(
    () => ({
      lessor:       readString(params, "lessor"),
      operator:     readString(params, "operator"),
      engineType:   readString(params, "engineType"),
      aircraftType: readString(params, "aircraftType"),
      status:       readString(params, "status"),
      shop:         readString(params, "shop"),
      wingStatus:   readString(params, "wingStatus"),
      priority:     readString(params, "priority"),
      search:       readString(params, "search"),
      sort:         readString(params, "sort"),
      dir:          readEnum(params, "dir", ["asc", "desc"] as const),
    }),
    [params],
  );
  const update = useUpdater<ShopVisitsParams>();
  return [value, update] as const;
}

// ---- /forecast ----

export interface ForecastParams {
  lessor?: string;
  operator?: string;
  engineType?: string;
  wingStatus?: string;
  priority?: string;
  search?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

export function useForecastParams(): readonly [ForecastParams, (patch: Patch<ForecastParams>) => void] {
  const [params] = useSearchParams();
  const value = useMemo<ForecastParams>(
    () => ({
      lessor:     readString(params, "lessor"),
      operator:   readString(params, "operator"),
      engineType: readString(params, "engineType"),
      wingStatus: readString(params, "wingStatus"),
      priority:   readString(params, "priority"),
      search:     readString(params, "search"),
      sort:       readString(params, "sort"),
      dir:        readEnum(params, "dir", ["asc", "desc"] as const),
    }),
    [params],
  );
  const update = useUpdater<ForecastParams>();
  return [value, update] as const;
}

// ---- /engine-map ----

export interface EngineMapParams {
  esn?: string;
  msn?: string;
  registration?: string;
}

export function useEngineMapParams(): readonly [EngineMapParams, (patch: Patch<EngineMapParams>) => void] {
  const [params] = useSearchParams();
  const value = useMemo<EngineMapParams>(
    () => ({
      esn:          readString(params, "esn"),
      msn:          readString(params, "msn"),
      registration: readString(params, "registration"),
    }),
    [params],
  );
  const update = useUpdater<EngineMapParams>();
  return [value, update] as const;
}
