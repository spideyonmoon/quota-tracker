import { useState } from "react";
import type { Instance, QuotaFlag } from "../types";
import {
  calculateStatus,
  formatTimeRemaining,
  statusStyles,
  availabilityLabel,
  durationToLabel,
  remainingParts,
} from "../utils";

interface InstanceCardProps {
  instance: Instance;
  onEdit: (instance: Instance) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSetQuotaFlag: (id: string, flag: QuotaFlag) => void;
}

const flagStyles: Record<QuotaFlag, { bg: string; text: string; border: string; ring: string }> = {
  available: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
  },
  exhausted: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    ring: "ring-amber-500/20",
  },
  weekly_exhausted: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-300",
    border: "border-cyan-500/30",
    ring: "ring-cyan-500/20",
  },
};

const flagLabels: Record<QuotaFlag, string> = {
  available: "Available",
  exhausted: "Exhausted",
  weekly_exhausted: "Weekly Exhausted",
};

export function InstanceCard({
  instance,
  onEdit,
  onDelete,
  onDuplicate,
  onSetQuotaFlag,
}: InstanceCardProps) {
  const [copied, setCopied] = useState(false);
  const status = calculateStatus(instance);
  const styles = statusStyles(status);
  const flag = availabilityLabel(instance);
  const fs = flagStyles[flag];

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
      className={`group relative rounded-2xl border-l-[3px] ${styles.border} bg-slate-900/80 p-5 shadow-lg shadow-black/20 transition-all duration-150 ring-1 ring-transparent hover:ring-white/[0.08] hover:shadow-xl hover:shadow-black/30`}
    >
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-white">
              {instance.name}
            </h2>
            <a
              href={instance.website}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-[13px] text-cyan-400/80 transition-colors hover:text-cyan-300"
            >
              {instance.website}
            </a>
            {instance.accountLabel ? (
              <p className="mt-0.5 truncate text-[13px] text-slate-500">
                {instance.accountLabel}
              </p>
            ) : null}
          </div>
          <div className="relative shrink-0">
            <select
              value={flag}
              onChange={(event) => onSetQuotaFlag(instance.id, event.target.value as QuotaFlag)}
              className={`appearance-none cursor-pointer rounded-lg border ${fs.border} ${fs.bg} ${fs.text} px-3 py-1.5 pr-7 text-[11px] font-bold uppercase tracking-wider outline-none transition-all duration-200 hover:brightness-110 focus:ring-2 ${fs.ring}`}
            >
              <option value="available">Available</option>
              <option value="exhausted">Exhausted</option>
              <option value="weekly_exhausted">Weekly Exhausted</option>
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-current opacity-60" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Quota boxes */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                Hourly
              </p>
              <p className="text-xs font-medium text-slate-400">
                {instance.hourlyAllowance}
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white">
              {formatTimeRemaining(instance.hourlyResetTimestamp)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {durationToLabel(remainingParts(instance.hourlyResetTimestamp))}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                Weekly
              </p>
              <p className="text-xs font-medium text-slate-400">
                {instance.weeklyAllowance}
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white">
              {formatTimeRemaining(instance.weeklyResetTimestamp)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {durationToLabel(remainingParts(instance.weeklyResetTimestamp))}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={handleCopy}
            className={`min-h-10 rounded-xl px-4 py-2 text-[13px] font-semibold tracking-wide transition-all duration-200 ${styles.button}`}
          >
            {copied ? "Copied!" : "Use"}
          </button>
          <button
            type="button"
            onClick={() => onEdit(instance)}
            className="min-h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(instance.id)}
            className="min-h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => onDelete(instance.id)}
            className="min-h-10 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-4 py-2 text-[13px] font-medium text-rose-300/80 transition-all duration-200 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-200"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
