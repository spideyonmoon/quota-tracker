import { useState } from "react";
import type { Instance } from "../types";
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
  onToggleExhausted: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function InstanceCard({
  instance,
  onEdit,
  onDelete,
  onToggleExhausted,
  onDuplicate,
}: InstanceCardProps) {
  const [copied, setCopied] = useState(false);
  const status = calculateStatus(instance);
  const styles = statusStyles(status);
  const available = availabilityLabel(instance);
  const isReady = status === "READY";
  const isExhausted = available === "EXHAUSTED";

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
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] border-l-[3px] ${styles.border} bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.1] hover:bg-slate-900/80 hover:shadow-2xl hover:shadow-black/40 ${styles.glow}`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex flex-col gap-4">
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
          <button
            type="button"
            onClick={() => onToggleExhausted(instance.id)}
            className={`relative shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ring-1 transition-all duration-200 ${
              isExhausted
                ? "bg-amber-500/10 text-amber-300 ring-amber-500/20 hover:bg-amber-500/15"
                : isReady
                  ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20 hover:bg-emerald-400/15"
                  : "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20 hover:bg-cyan-400/15"
            }`}
          >
            {isExhausted && (
              <span className="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-glow-pulse" />
            )}
            {isReady && !isExhausted && (
              <span className="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
            )}
            {available}
          </button>
        </div>

        {/* Quota boxes */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Hourly
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                {instance.hourlyAllowance}
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white">
              {formatTimeRemaining(instance.hourlyResetTimestamp)}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              {durationToLabel(remainingParts(instance.hourlyResetTimestamp))}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Weekly
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                {instance.weeklyAllowance}
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white">
              {formatTimeRemaining(instance.weeklyResetTimestamp)}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              {durationToLabel(remainingParts(instance.weeklyResetTimestamp))}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className={`min-h-10 flex-1 rounded-xl px-4 py-2 text-[13px] font-semibold tracking-wide transition-all duration-200 ${styles.button}`}
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
