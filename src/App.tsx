import { useEffect, useMemo, useState, type FormEvent } from "react";

export interface Instance {
  id: string;
  name: string;
  website: string;
  accountLabel?: string;
  configBlock: string;
  hourlyAllowance: string;
  weeklyAllowance: string;
  hourlyResetTimestamp: number;
  weeklyResetTimestamp: number;
  exhausted: boolean;
}

type InstanceStatus = "READY" | "SOON" | "COOLING";

const STORAGE_KEY = "quota-tracker.instances";
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const createId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createStarterInstances = (): Instance[] => [];

function normalizeInstance(instance: Instance): Instance {
  const ready = calculateStatus(instance) === "READY";
  return ready && instance.exhausted ? { ...instance, exhausted: false } : instance;
}

function normalizeInstances(instances: Instance[]): Instance[] {
  return instances.map(normalizeInstance);
}

export function calculateStatus(instance: Instance): InstanceStatus {
  const now = Date.now();
  const hourlyRemaining = instance.hourlyResetTimestamp - now;
  const weeklyRemaining = instance.weeklyResetTimestamp - now;

  if (hourlyRemaining <= 0 && weeklyRemaining <= 0) {
    return "READY";
  }

  const nextReset = Math.min(
    Math.max(hourlyRemaining, 0),
    Math.max(weeklyRemaining, 0),
  );

  return nextReset < THIRTY_MINUTES_MS ? "SOON" : "COOLING";
}

export function formatTimeRemaining(targetTimestamp: number): string {
  const remaining = Math.max(targetTimestamp - Date.now(), 0);

  if (remaining === 0) {
    return "Ready";
  }

  const totalMinutes = Math.ceil(remaining / MINUTE_MS);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function sortInstances(instances: Instance[]): Instance[] {
  const now = Date.now();

  return [...instances].sort((a, b) => {
    const aStatus = calculateStatus(a);
    const bStatus = calculateStatus(b);

    if (aStatus === "READY" && bStatus !== "READY") return -1;
    if (aStatus !== "READY" && bStatus === "READY") return 1;

    const aNearest = Math.min(
      Math.max(a.hourlyResetTimestamp - now, 0),
      Math.max(a.weeklyResetTimestamp - now, 0),
    );
    const bNearest = Math.min(
      Math.max(b.hourlyResetTimestamp - now, 0),
      Math.max(b.weeklyResetTimestamp - now, 0),
    );

    return aNearest - bNearest;
  });
}

function readStoredInstances(): Instance[] {
  if (typeof window === "undefined") {
    return createStarterInstances();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createStarterInstances();

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? normalizeInstances(parsed as Instance[])
      : createStarterInstances();
  } catch {
    return createStarterInstances();
  }
}

function useInstances() {
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

  return { instances, addInstance, updateInstance, deleteInstance, toggleExhausted };
}

function statusStyles(status: InstanceStatus) {
  switch (status) {
    case "READY":
      return {
        border: "border-l-emerald-400",
        badge: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
        button: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
      };
    case "SOON":
      return {
        border: "border-l-yellow-400",
        badge: "bg-yellow-400/10 text-yellow-200 ring-yellow-400/20",
        button: "bg-yellow-400 text-slate-950 hover:bg-yellow-300",
      };
    case "COOLING":
      return {
        border: "border-l-slate-500",
        badge: "bg-slate-500/10 text-slate-300 ring-slate-400/20",
        button: "bg-slate-700 text-slate-100 hover:bg-slate-600",
      };
  }
}

function availabilityLabel(instance: Instance) {
  return instance.exhausted && calculateStatus(instance) !== "READY"
    ? "EXHAUSTED"
    : "AVAILABLE";
}

function durationFromMs(ms: number) {
  const totalMinutes = Math.max(Math.ceil(ms / MINUTE_MS), 0);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

function durationToMs(days: number, hours: number, minutes: number) {
  return days * DAY_MS + hours * HOUR_MS + minutes * MINUTE_MS;
}

function durationToLabel(parts: ReturnType<typeof durationFromMs>) {
  const out: string[] = [];
  if (parts.days > 0) out.push(`${parts.days}d`);
  if (parts.hours > 0) out.push(`${parts.hours}h`);
  if (parts.minutes > 0 || out.length === 0) out.push(`${parts.minutes}m`);
  return out.join(" ");
}

function remainingParts(timestamp: number) {
  return durationFromMs(Math.max(timestamp - Date.now(), 0));
}

interface InstanceCardProps {
  instance: Instance;
  onEdit: (instance: Instance) => void;
  onDelete: (id: string) => void;
  onToggleExhausted: (id: string) => void;
}

function InstanceCard({ instance, onEdit, onDelete, onToggleExhausted }: InstanceCardProps) {
  const [copied, setCopied] = useState(false);
  const status = calculateStatus(instance);
  const styles = statusStyles(status);
  const available = availabilityLabel(instance);
  const availableStyles =
    available === "AVAILABLE"
      ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20"
      : "bg-amber-400/10 text-amber-200 ring-amber-400/20";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(instance.configBlock);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      className={`rounded-lg border border-slate-800 border-l-4 ${styles.border} bg-slate-900/85 p-5 shadow-xl shadow-black/20`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">
              {instance.name}
            </h2>
            <a
              href={instance.website}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-sm text-cyan-300 hover:text-cyan-200"
            >
              {instance.website}
            </a>
            {instance.accountLabel ? (
              <p className="mt-1 truncate text-sm text-slate-400">
                {instance.accountLabel}
              </p>
            ) : null}
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${availableStyles}`}
          >
            {available}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Primary quota
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {instance.hourlyAllowance}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatTimeRemaining(instance.hourlyResetTimestamp)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {durationToLabel(remainingParts(instance.hourlyResetTimestamp))}
            </p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Secondary quota
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {instance.weeklyAllowance}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatTimeRemaining(instance.weeklyResetTimestamp)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {durationToLabel(remainingParts(instance.weeklyResetTimestamp))}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className={`min-h-11 flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${styles.button}`}
          >
            {copied ? "Copied!" : "Use"}
          </button>
          <button
            type="button"
            onClick={() => onToggleExhausted(instance.id)}
            className={`min-h-11 rounded-md border px-4 py-2 text-sm font-semibold transition ${
              instance.exhausted
                ? "border-emerald-700 text-emerald-200 hover:bg-emerald-950/40"
                : "border-amber-700 text-amber-200 hover:bg-amber-950/40"
            }`}
          >
            {instance.exhausted ? "Available" : "Exhausted"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(instance)}
            className="min-h-11 rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(instance.id)}
            className="min-h-11 rounded-md border border-rose-900/70 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-700 hover:bg-rose-950/40"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

interface InstanceEditorModalProps {
  mode: "add" | "edit";
  instance: Instance | null;
  onClose: () => void;
  onSubmit: (payload: Omit<Instance, "id">, existingId?: string) => void;
}

function InstanceEditorModal({
  mode,
  instance,
  onClose,
  onSubmit,
}: InstanceEditorModalProps) {
  const [name, setName] = useState(instance?.name ?? "");
  const [website, setWebsite] = useState(instance?.website ?? "");
  const [accountLabel, setAccountLabel] = useState(instance?.accountLabel ?? "");
  const [configBlock, setConfigBlock] = useState(instance?.configBlock ?? "");
  const [primaryAllowance, setPrimaryAllowance] = useState(
    instance?.hourlyAllowance ?? "",
  );
  const [secondaryAllowance, setSecondaryAllowance] = useState(
    instance?.weeklyAllowance ?? "",
  );
  const primaryParts = remainingParts(instance?.hourlyResetTimestamp ?? Date.now());
  const secondaryParts = remainingParts(
    instance?.weeklyResetTimestamp ?? Date.now(),
  );
  const [primaryHours, setPrimaryHours] = useState(
    instance ? String(primaryParts.days * 24 + primaryParts.hours) : "",
  );
  const [primaryMinutes, setPrimaryMinutes] = useState(
    instance ? String(primaryParts.minutes) : "",
  );
  const [secondaryDays, setSecondaryDays] = useState(
    instance ? String(secondaryParts.days) : "",
  );
  const [secondaryHours, setSecondaryHours] = useState(
    instance ? String(secondaryParts.hours) : "",
  );
  const [secondaryMinutes, setSecondaryMinutes] = useState(
    instance ? String(secondaryParts.minutes) : "",
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!configBlock.trim()) return;
    try {
      await navigator.clipboard.writeText(configBlock);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const applyPrimaryPreset = (label: "+5 Hours" | "+24 Hours" | "+7 Days") => {
    if (label === "+5 Hours") {
      setPrimaryHours(String((Number(primaryHours) || 0) + 5));
    }
    if (label === "+24 Hours") {
      setPrimaryHours(String((Number(primaryHours) || 0) + 24));
    }
    if (label === "+7 Days") {
      setPrimaryHours(String((Number(primaryHours) || 0) + 24 * 7));
    }
  };

  const applySecondaryPreset = (label: "+5 Hours" | "+24 Hours" | "+7 Days") => {
    if (label === "+5 Hours") {
      setSecondaryHours(String((Number(secondaryHours) || 0) + 5));
    }
    if (label === "+24 Hours") {
      setSecondaryHours(String((Number(secondaryHours) || 0) + 24));
    }
    if (label === "+7 Days") {
      setSecondaryDays(String((Number(secondaryDays) || 0) + 7));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !website.trim() || !configBlock.trim()) return;

    const now = Date.now();

    onSubmit(
      {
        name: name.trim(),
        website: website.trim(),
        accountLabel: accountLabel.trim() || undefined,
        configBlock: configBlock.trim(),
        hourlyAllowance: primaryAllowance.trim() || "Quota",
        weeklyAllowance: secondaryAllowance.trim() || "Quota",
        hourlyResetTimestamp:
          now +
          durationToMs(
            0,
            Math.max(Number(primaryHours) || 0, 0),
            Math.max(Number(primaryMinutes) || 0, 0),
          ),
        weeklyResetTimestamp:
          now +
          durationToMs(
            Math.max(Number(secondaryDays) || 0, 0),
            Math.max(Number(secondaryHours) || 0, 0),
            Math.max(Number(secondaryMinutes) || 0, 0),
          ),
        exhausted: instance?.exhausted ?? false,
      },
      instance?.id,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-white">
              {mode === "add" ? "Add Instance" : "Edit Instance"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Save the account details, copy block, and reset windows.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close modal"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="Website"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
            <input
              value={accountLabel}
              onChange={(event) => setAccountLabel(event.target.value)}
              placeholder="Account label"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
            <input
              value={primaryAllowance}
              onChange={(event) => setPrimaryAllowance(event.target.value)}
              placeholder="Primary quota / allowance"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
            <input
              value={secondaryAllowance}
              onChange={(event) => setSecondaryAllowance(event.target.value)}
              placeholder="Secondary quota / allowance"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
          </div>

          <textarea
            value={configBlock}
            onChange={(event) => setConfigBlock(event.target.value)}
            placeholder="Config block"
            rows={5}
            className="w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  Primary reset window
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyPrimaryPreset("+5 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +5h
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPrimaryPreset("+24 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPrimaryPreset("+7 Days")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +7d
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-400">Hours</span>
                  <input
                    type="number"
                    min="0"
                    value={primaryHours}
                    onChange={(event) => setPrimaryHours(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    value={primaryMinutes}
                    onChange={(event) => setPrimaryMinutes(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  Secondary reset window
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applySecondaryPreset("+5 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +5h
                  </button>
                  <button
                    type="button"
                    onClick={() => applySecondaryPreset("+24 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    onClick={() => applySecondaryPreset("+7 Days")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +7d
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-400">Days</span>
                  <input
                    type="number"
                    min="0"
                    value={secondaryDays}
                    onChange={(event) => setSecondaryDays(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Hours</span>
                  <input
                    type="number"
                    min="0"
                    value={secondaryHours}
                    onChange={(event) => setSecondaryHours(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    value={secondaryMinutes}
                    onChange={(event) => setSecondaryMinutes(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Copy block</p>
              <p className="text-xs text-slate-400">
                Write the current config block to the clipboard.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const {
    instances,
    addInstance,
    updateInstance,
    deleteInstance,
    toggleExhausted,
  } = useInstances();
  const [, setMinuteTick] = useState(0);
  const [editorState, setEditorState] = useState<{
    mode: "add" | "edit";
    instance: Instance | null;
  } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMinuteTick((tick) => tick + 1);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const sortedInstances = useMemo(() => sortInstances(instances), [instances]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-900 bg-slate-950/95">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="mt-2 text-3xl font-bold text-white">
                Quota Tracking Dashboard
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Track third-party API accounts, store each config block, and
                mark an instance exhausted when you use it up.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Tracked
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {instances.length} instances
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorState({ mode: "add", instance: null })}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Add Instance
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sortedInstances.length > 0 ? (
            sortedInstances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onEdit={(item) => setEditorState({ mode: "edit", instance: item })}
                onDelete={deleteInstance}
                onToggleExhausted={toggleExhausted}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400 lg:col-span-2">
              Add your first instance to start tracking quota windows.
            </div>
          )}
        </section>
      </div>

      {editorState ? (
        <InstanceEditorModal
          mode={editorState.mode}
          instance={editorState.instance}
          onClose={() => setEditorState(null)}
          onSubmit={(payload, existingId) => {
            if (editorState.mode === "add") {
              addInstance(payload);
              return;
            }

            if (existingId) {
              updateInstance(existingId, payload);
            }
          }}
        />
      ) : null}
    </main>
  );
}
