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
          <button
            type="button"
            onClick={() => onToggleExhausted(instance.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
              available === "AVAILABLE"
                ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20 hover:bg-emerald-400/20"
                : "bg-amber-400/10 text-amber-200 ring-amber-400/20 hover:bg-amber-400/20"
            }`}
          >
            {available}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Hourly allowance
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
              Weekly allowance
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
            onClick={() => onEdit(instance)}
            className="min-h-11 rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(instance.id)}
            className="min-h-11 rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Duplicate
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
