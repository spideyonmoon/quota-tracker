import { useState, type FormEvent } from "react";
import type { Instance, QuotaFlag } from "../types";
import { durationToMs, remainingParts } from "../utils";
import { CustomDropdown } from "./CustomDropdown";

interface FieldErrors {
  name?: string;
  website?: string;
  configBlock?: string;
}

interface InstanceEditorModalProps {
  mode: "add" | "edit";
  instance: Instance | null;
  onClose: () => void;
  onSubmit: (payload: Omit<Instance, "id">, existingId?: string) => void;
}

const availabilityOptions: { value: QuotaFlag; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "exhausted", label: "Exhausted" },
  { value: "weekly_exhausted", label: "Weekly Exhausted" },
];

const availabilityColors: Record<QuotaFlag, { bg: string; text: string; border: string; dot: string }> = {
  available: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  exhausted: { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400" },
  weekly_exhausted: { bg: "bg-rose-500/15", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-400" },
};

function getAvailabilityFlag(instance: Instance | null): QuotaFlag {
  if (!instance) return "available";
  if (instance.exhausted) return "exhausted";
  if (instance.weeklyExhausted) return "weekly_exhausted";
  return "available";
}

export function InstanceEditorModal({
  mode,
  instance,
  onClose,
  onSubmit,
}: InstanceEditorModalProps) {
  const [name, setName] = useState(instance?.name ?? "");
  const [website, setWebsite] = useState(instance?.website ?? "");
  const [accountLabel, setAccountLabel] = useState(instance?.accountLabel ?? "");
  const [configBlock, setConfigBlock] = useState(instance?.configBlock ?? "");
  const [hourlyAllowance, setHourlyAllowance] = useState(
    instance?.hourlyAllowance ?? "",
  );
  const [weeklyAllowance, setWeeklyAllowance] = useState(
    instance?.weeklyAllowance ?? "",
  );
  const hourlyCooldown = remainingParts(instance?.hourlyCooldownMs ?? 0);
  const weeklyCooldown = remainingParts(instance?.weeklyCooldownMs ?? 0);
  const [hourlyHours, setHourlyHours] = useState(
    instance ? String(hourlyCooldown.days * 24 + hourlyCooldown.hours) : "",
  );
  const [hourlyMinutes, setHourlyMinutes] = useState(
    instance ? String(hourlyCooldown.minutes) : "",
  );
  const [weeklyDays, setWeeklyDays] = useState(
    instance ? String(weeklyCooldown.days) : "",
  );
  const [weeklyHours, setWeeklyHours] = useState(
    instance ? String(weeklyCooldown.hours) : "",
  );
  const [weeklyMinutes, setWeeklyMinutes] = useState(
    instance ? String(weeklyCooldown.minutes) : "",
  );
  const nextHourly = remainingParts(instance?.hourlyResetTimestamp ?? 0);
  const nextWeekly = remainingParts(instance?.weeklyResetTimestamp ?? 0);
  const [nextHourlyHours, setNextHourlyHours] = useState(
    instance ? String(nextHourly.days * 24 + nextHourly.hours) : "",
  );
  const [nextHourlyMinutes, setNextHourlyMinutes] = useState(
    instance ? String(nextHourly.minutes) : "",
  );
  const [nextWeeklyDays, setNextWeeklyDays] = useState(
    instance ? String(nextWeekly.days) : "",
  );
  const [nextWeeklyHours, setNextWeeklyHours] = useState(
    instance ? String(nextWeekly.hours) : "",
  );
  const [nextWeeklyMinutes, setNextWeeklyMinutes] = useState(
    instance ? String(nextWeekly.minutes) : "",
  );
  const [availability, setAvailability] = useState<QuotaFlag>(getAvailabilityFlag(instance));
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

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

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!website.trim()) newErrors.website = "Website is required";
    if (!configBlock.trim()) newErrors.configBlock = "Config block is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const now = Date.now();
    const hourlyMs = durationToMs(0, Math.max(Number(hourlyHours) || 0, 0), Math.max(Number(hourlyMinutes) || 0, 0));
    const weeklyMs = durationToMs(Math.max(Number(weeklyDays) || 0, 0), Math.max(Number(weeklyHours) || 0, 0), Math.max(Number(weeklyMinutes) || 0, 0));
    const nextHourlyMs = durationToMs(0, Math.max(Number(nextHourlyHours) || 0, 0), Math.max(Number(nextHourlyMinutes) || 0, 0));
    const nextWeeklyMs = durationToMs(Math.max(Number(nextWeeklyDays) || 0, 0), Math.max(Number(nextWeeklyHours) || 0, 0), Math.max(Number(nextWeeklyMinutes) || 0, 0));

    onSubmit(
      {
        name: name.trim(),
        website: website.trim(),
        accountLabel: accountLabel.trim() || undefined,
        configBlock: configBlock.trim(),
        hourlyAllowance: hourlyAllowance.trim() || "Quota",
        weeklyAllowance: weeklyAllowance.trim() || "Quota",
        hourlyCooldownMs: hourlyMs,
        weeklyCooldownMs: weeklyMs,
        hourlyResetTimestamp: now + (nextHourlyMs > 0 ? nextHourlyMs : hourlyMs),
        weeklyResetTimestamp: now + (nextWeeklyMs > 0 ? nextWeeklyMs : weeklyMs),
        exhausted: availability === "exhausted",
        weeklyExhausted: availability === "weekly_exhausted",
      },
      instance?.id,
    );
    onClose();
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-[13px] text-white placeholder:text-slate-600 outline-none transition-all duration-200 ${
      hasError
        ? "border-rose-500/40 focus:border-rose-400/60 focus:shadow-[0_0_0_1px_rgba(244,63,94,0.2)]"
        : "border-white/[0.08] focus:border-cyan-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
    }`;

  const numberClass =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-white">
              {mode === "add" ? "New Instance" : "Edit Instance"}
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Configure account details, config block, and reset windows.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-slate-400 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
            aria-label="Close modal"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Basic fields */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-500">Name</label>
              <input
                value={name}
                onChange={(event) => { setName(event.target.value); clearError("name"); }}
                placeholder="e.g. OpenAI Account 1"
                className={inputClass(!!errors.name)}
              />
              {errors.name && <p className="mt-1.5 text-[11px] text-rose-400/80">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-500">Website</label>
              <input
                value={website}
                onChange={(event) => { setWebsite(event.target.value); clearError("website"); }}
                placeholder="https://platform.openai.com"
                className={inputClass(!!errors.website)}
              />
              {errors.website && <p className="mt-1.5 text-[11px] text-rose-400/80">{errors.website}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-500">Account Label</label>
              <input
                value={accountLabel}
                onChange={(event) => setAccountLabel(event.target.value)}
                placeholder="Optional"
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-500">Availability</label>
              <CustomDropdown
                value={availability}
                options={availabilityOptions}
                onChange={setAvailability}
                colorMap={availabilityColors}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-500">Hourly Allowance</label>
              <input
                value={hourlyAllowance}
                onChange={(event) => setHourlyAllowance(event.target.value)}
                placeholder="e.g. 100 RPM"
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-500">Weekly Allowance</label>
              <input
                value={weeklyAllowance}
                onChange={(event) => setWeeklyAllowance(event.target.value)}
                placeholder="e.g. 10K requests"
                className={inputClass(false)}
              />
            </div>
          </div>

          {/* Config block */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-slate-500">Config Block</label>
            <textarea
              value={configBlock}
              onChange={(event) => { setConfigBlock(event.target.value); clearError("configBlock"); }}
              placeholder="Paste your API key or config here..."
              rows={5}
              className={`w-full resize-y rounded-xl border bg-white/[0.03] px-4 py-3 font-mono text-[13px] text-white placeholder:text-slate-700 outline-none transition-all duration-200 ${
                errors.configBlock
                  ? "border-rose-500/40 focus:border-rose-400/60"
                  : "border-white/[0.08] focus:border-cyan-400/40 focus:bg-white/[0.05]"
              }`}
            />
            {errors.configBlock && <p className="mt-1.5 text-[11px] text-rose-400/80">{errors.configBlock}</p>}
          </div>

          {/* Reset windows */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Hourly */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[13px] font-semibold text-white">Hourly Reset</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Cycle duration and time until next reset</p>
              <div className="mt-3 space-y-3">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Window</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={hourlyHours}
                      onChange={(event) => setHourlyHours(event.target.value)}
                      placeholder="hours"
                      className={numberClass}
                    />
                    <input
                      type="number"
                      min="0"
                      value={hourlyMinutes}
                      onChange={(event) => setHourlyMinutes(event.target.value)}
                      placeholder="min"
                      className={numberClass}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Next reset in</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={nextHourlyHours}
                      onChange={(event) => setNextHourlyHours(event.target.value)}
                      placeholder="hours"
                      className={numberClass}
                    />
                    <input
                      type="number"
                      min="0"
                      value={nextHourlyMinutes}
                      onChange={(event) => setNextHourlyMinutes(event.target.value)}
                      placeholder="min"
                      className={numberClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[13px] font-semibold text-white">Weekly Reset</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Cycle duration and time until next reset</p>
              <div className="mt-3 space-y-3">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Window</span>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={weeklyDays}
                      onChange={(event) => setWeeklyDays(event.target.value)}
                      placeholder="days"
                      className={numberClass}
                    />
                    <input
                      type="number"
                      min="0"
                      value={weeklyHours}
                      onChange={(event) => setWeeklyHours(event.target.value)}
                      placeholder="hrs"
                      className={numberClass}
                    />
                    <input
                      type="number"
                      min="0"
                      value={weeklyMinutes}
                      onChange={(event) => setWeeklyMinutes(event.target.value)}
                      placeholder="min"
                      className={numberClass}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Next reset in</span>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={nextWeeklyDays}
                      onChange={(event) => setNextWeeklyDays(event.target.value)}
                      placeholder="days"
                      className={numberClass}
                    />
                    <input
                      type="number"
                      min="0"
                      value={nextWeeklyHours}
                      onChange={(event) => setNextWeeklyHours(event.target.value)}
                      placeholder="hrs"
                      className={numberClass}
                    />
                    <input
                      type="number"
                      min="0"
                      value={nextWeeklyMinutes}
                      onChange={(event) => setNextWeeklyMinutes(event.target.value)}
                      placeholder="min"
                      className={numberClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copy block */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-white">Copy Block</p>
              <p className="text-[11px] text-slate-500">Copy the current config to clipboard</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:from-cyan-400 hover:to-blue-400"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
