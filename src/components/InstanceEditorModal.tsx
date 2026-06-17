import { useState, type FormEvent } from "react";
import type { Instance } from "../types";
import { durationToMs, remainingParts } from "../utils";

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
  const hourlyParts = remainingParts(instance?.hourlyResetTimestamp ?? Date.now());
  const weeklyParts = remainingParts(
    instance?.weeklyResetTimestamp ?? Date.now(),
  );
  const [hourlyHours, setHourlyHours] = useState(
    instance ? String(hourlyParts.days * 24 + hourlyParts.hours) : "",
  );
  const [hourlyMinutes, setHourlyMinutes] = useState(
    instance ? String(hourlyParts.minutes) : "",
  );
  const [weeklyDays, setWeeklyDays] = useState(
    instance ? String(weeklyParts.days) : "",
  );
  const [weeklyHours, setWeeklyHours] = useState(
    instance ? String(weeklyParts.hours) : "",
  );
  const [weeklyMinutes, setWeeklyMinutes] = useState(
    instance ? String(weeklyParts.minutes) : "",
  );
  const [exhausted, setExhausted] = useState(instance?.exhausted ?? false);
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

  const applyHourlyPreset = (label: "+5 Hours" | "+24 Hours" | "+7 Days") => {
    if (label === "+5 Hours") setHourlyHours(String((Number(hourlyHours) || 0) + 5));
    if (label === "+24 Hours") setHourlyHours(String((Number(hourlyHours) || 0) + 24));
    if (label === "+7 Days") setHourlyHours(String((Number(hourlyHours) || 0) + 168));
  };

  const applyWeeklyPreset = (label: "+5 Hours" | "+24 Hours" | "+7 Days") => {
    if (label === "+5 Hours") setWeeklyHours(String((Number(weeklyHours) || 0) + 5));
    if (label === "+24 Hours") setWeeklyHours(String((Number(weeklyHours) || 0) + 24));
    if (label === "+7 Days") setWeeklyDays(String((Number(weeklyDays) || 0) + 7));
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

    onSubmit(
      {
        name: name.trim(),
        website: website.trim(),
        accountLabel: accountLabel.trim() || undefined,
        configBlock: configBlock.trim(),
        hourlyAllowance: hourlyAllowance.trim() || "Quota",
        weeklyAllowance: weeklyAllowance.trim() || "Quota",
        hourlyResetTimestamp:
          now + durationToMs(0, Math.max(Number(hourlyHours) || 0, 0), Math.max(Number(hourlyMinutes) || 0, 0)),
        weeklyResetTimestamp:
          now + durationToMs(Math.max(Number(weeklyDays) || 0, 0), Math.max(Number(weeklyHours) || 0, 0), Math.max(Number(weeklyMinutes) || 0, 0)),
        exhausted: exhausted,
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
              <select
                value={exhausted ? "exhausted" : "available"}
                onChange={(event) => setExhausted(event.target.value === "exhausted")}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
              >
                <option value="available">Available</option>
                <option value="exhausted">Exhausted</option>
              </select>
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
            {/* Hourly reset */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-white">Hourly Reset</p>
                <div className="flex gap-1.5">
                  {[["+5 Hours", "+5h"], ["+24 Hours", "+24h"], ["+7 Days", "+7d"]].map(([label, display]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => applyHourlyPreset(label as "+5 Hours" | "+24 Hours" | "+7 Days")}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                    >
                      {display}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] text-slate-500">Hours</span>
                  <input
                    type="number"
                    min="0"
                    value={hourlyHours}
                    onChange={(event) => setHourlyHours(event.target.value)}
                    className="input-premium mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    value={hourlyMinutes}
                    onChange={(event) => setHourlyMinutes(event.target.value)}
                    className="input-premium mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
                  />
                </label>
              </div>
            </div>

            {/* Weekly reset */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-white">Weekly Reset</p>
                <div className="flex gap-1.5">
                  {[["+5 Hours", "+5h"], ["+24 Hours", "+24h"], ["+7 Days", "+7d"]].map(([label, display]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => applyWeeklyPreset(label as "+5 Hours" | "+24 Hours" | "+7 Days")}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                    >
                      {display}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[11px] text-slate-500">Days</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyDays}
                    onChange={(event) => setWeeklyDays(event.target.value)}
                    className="input-premium mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500">Hours</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyHours}
                    onChange={(event) => setWeeklyHours(event.target.value)}
                    className="input-premium mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyMinutes}
                    onChange={(event) => setWeeklyMinutes(event.target.value)}
                    className="input-premium mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
                  />
                </label>
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
