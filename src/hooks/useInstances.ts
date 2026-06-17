import { useState } from "react";
import type { Instance } from "../types";
import { createId, normalizeInstances } from "../utils";

const STORAGE_KEY = "quota-tracker.instances";

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
      { ...instance, id: createId(), exhausted: false },
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

  const toggleExhausted = (id: string) => {
    persist((current) =>
      current.map((instance) =>
        instance.id === id
          ? { ...instance, exhausted: !instance.exhausted }
          : instance,
      ),
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
      };
      return [...current, clone];
    });
  };

  const markAllAvailable = () => {
    persist((current) =>
      current.map((instance) => ({ ...instance, exhausted: false })),
    );
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
    toggleExhausted,
    duplicateInstance,
    markAllAvailable,
    exportInstances,
    importInstances,
  };
}
