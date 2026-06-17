import { useEffect, useState } from "react";
import type { Instance } from "../types";
import { createId, normalizeInstances } from "../utils";
import type { QuotaFlag } from "../types";

const STORAGE_KEY = "quota-tracker.instances";
const DEMO_SEEN_KEY = "quota-tracker.demo-seen";

const HOUR_MS = 60 * 60 * 1000;

function makeDemoInstance(): Instance {
  const now = Date.now();
  return {
    id: "demo-openai-gpt4",
    name: "OpenAI GPT-4o",
    website: "https://platform.openai.com",
    accountLabel: "demo@openai.com",
    configBlock:
      'OPENAI_API_KEY="sk-demo-xxxxxxxxxxxx"\nBASE_URL="https://api.openai.com/v1"',
    hourlyAllowance: "500 RPM",
    weeklyAllowance: "10M tokens",
    hourlyCooldownMs: 60 * 60 * 1000,
    weeklyCooldownMs: 7 * 24 * 60 * 60 * 1000,
    hourlyResetTimestamp: now - 10 * 60 * 1000,
    weeklyResetTimestamp: now - 2 * HOUR_MS,
    exhausted: false,
    weeklyExhausted: false,
  };
}

function readStoredInstances(): Instance[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? normalizeInstances(parsed as Instance[])
      : [];
  } catch {
    return [];
  }
}

export function useInstances() {
  const [instances, setInstances] = useState<Instance[]>(readStoredInstances);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (instances.length > 0) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return;
      if (localStorage.getItem(DEMO_SEEN_KEY)) return;

      const demo = makeDemoInstance();
      localStorage.setItem(DEMO_SEEN_KEY, "1");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([demo]));
      setInstances([demo]);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const persist = (updater: (current: Instance[]) => Instance[]) => {
    setInstances((current) => {
      const nextInstances = normalizeInstances(updater(current));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInstances));
      return nextInstances;
    });
  };

  const addInstance = (instance: Omit<Instance, "id">) => {
    persist((current) => [
      ...current,
      { ...instance, id: createId(), exhausted: false, weeklyExhausted: false },
    ]);
  };

  const updateInstance = (id: string, patch: Partial<Instance>) => {
    persist((current) =>
      current.map((instance) =>
        instance.id === id ? { ...instance, ...patch } : instance,
      ),
    );
  };

  const deleteInstance = (id: string) => {
    persist((current) => current.filter((instance) => instance.id !== id));
  };

  const setQuotaFlag = (id: string, flag: QuotaFlag) => {
    const now = Date.now();
    persist((current) =>
      current.map((instance) => {
        if (instance.id !== id) return instance;
        return {
          ...instance,
          exhausted: flag === "exhausted",
          weeklyExhausted: flag === "weekly_exhausted",
          hourlyResetTimestamp:
            flag === "exhausted"
              ? now + instance.hourlyCooldownMs
              : instance.hourlyResetTimestamp,
          weeklyResetTimestamp:
            flag === "weekly_exhausted"
              ? now + instance.weeklyCooldownMs
              : instance.weeklyResetTimestamp,
        };
      }),
    );
  };

  const duplicateInstance = (id: string) => {
    persist((current) => {
      const source = current.find((i) => i.id === id);
      if (!source) return current;
      const clone: Instance = {
        ...source,
        id: createId(),
        name: `${source.name} (copy)`,
        exhausted: false,
        weeklyExhausted: false,
      };
      return [...current, clone];
    });
  };

  const renewExpired = () => {
    persist((current) => normalizeInstances(current));
  };

  const exportInstances = (): string => {
    return JSON.stringify(instances, null, 2);
  };

  const importInstances = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) return false;
      const valid = normalizeInstances(parsed as Instance[]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      setInstances(valid);
      return true;
    } catch {
      return false;
    }
  };

  return {
    instances,
    addInstance,
    updateInstance,
    deleteInstance,
    setQuotaFlag,
    duplicateInstance,
    renewExpired,
    exportInstances,
    importInstances,
  };
}
