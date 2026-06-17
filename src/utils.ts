import type { Instance, InstanceStatus, QuotaFlag } from "./types";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const createId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

    if (a.exhausted && !b.exhausted) return 1;
    if (!a.exhausted && b.exhausted) return -1;

    if (a.weeklyExhausted && !b.weeklyExhausted) return 1;
    if (!a.weeklyExhausted && b.weeklyExhausted) return -1;

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

function normalizeInstance(instance: Instance): Instance {
  const now = Date.now();
  let updated = { ...instance };

  if (updated.hourlyResetTimestamp <= now && updated.hourlyCooldownMs > 0) {
    updated.hourlyResetTimestamp = now + updated.hourlyCooldownMs;
  }
  if (updated.weeklyResetTimestamp <= now && updated.weeklyCooldownMs > 0) {
    updated.weeklyResetTimestamp = now + updated.weeklyCooldownMs;
  }

  const ready = calculateStatus(updated) === "READY";
  if (ready && updated.exhausted) {
    updated = { ...updated, exhausted: false };
  }
  if (ready && updated.weeklyExhausted) {
    updated = { ...updated, weeklyExhausted: false };
  }

  return updated;
}

export function normalizeInstances(instances: Instance[]): Instance[] {
  return instances.map(normalizeInstance);
}

export function statusStyles(status: InstanceStatus) {
  switch (status) {
    case "READY":
      return {
        border: "border-l-emerald-400",
        glow: "",
        badge: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
        button: "bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 hover:from-emerald-400 hover:to-emerald-300",
      };
    case "SOON":
      return {
        border: "border-l-amber-400",
        glow: "",
        badge: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
        button: "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300",
      };
    case "COOLING":
      return {
        border: "border-l-slate-600",
        glow: "",
        badge: "bg-slate-500/10 text-slate-300 ring-slate-400/20",
        button: "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700",
      };
  }
}

export function availabilityLabel(instance: Instance): QuotaFlag {
  if (instance.exhausted && calculateStatus(instance) !== "READY") return "exhausted";
  if (instance.weeklyExhausted && calculateStatus(instance) !== "READY") return "weekly_exhausted";
  return "available";
}

export function durationFromMs(ms: number) {
  const totalMinutes = Math.max(Math.ceil(ms / MINUTE_MS), 0);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

export function durationToMs(days: number, hours: number, minutes: number) {
  return days * DAY_MS + hours * HOUR_MS + minutes * MINUTE_MS;
}

export function durationToLabel(parts: ReturnType<typeof durationFromMs>) {
  const out: string[] = [];
  if (parts.days > 0) out.push(`${parts.days}d`);
  if (parts.hours > 0) out.push(`${parts.hours}h`);
  if (parts.minutes > 0 || out.length === 0) out.push(`${parts.minutes}m`);
  return out.join(" ");
}

export function remainingParts(timestamp: number) {
  return durationFromMs(Math.max(timestamp - Date.now(), 0));
}

export function filterInstances(instances: Instance[], query: string): Instance[] {
  if (!query.trim()) return instances;
  const q = query.toLowerCase();
  return instances.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.website.toLowerCase().includes(q) ||
      (i.accountLabel && i.accountLabel.toLowerCase().includes(q)) ||
      i.hourlyAllowance.toLowerCase().includes(q) ||
      i.weeklyAllowance.toLowerCase().includes(q),
  );
}
