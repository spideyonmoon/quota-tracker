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
    if (label === "+5 Hours") {
      setHourlyHours(String((Number(hourlyHours) || 0) + 5));
    }
    if (label === "+24 Hours") {
      setHourlyHours(String((Number(hourlyHours) || 0) + 24));
    }
    if (label === "+7 Days") {
      setHourlyHours(String((Number(hourlyHours) || 0) + 24 * 7));
    }
  };

  const applyWeeklyPreset = (label: "+5 Hours" | "+24 Hours" | "+7 Days") => {
    if (label === "+5 Hours") {
      setWeeklyHours(String((Number(weeklyHours) || 0) + 5));
    }
    if (label === "+24 Hours") {
      setWeeklyHours(String((Number(weeklyHours) || 0) + 24));
    }
    if (label === "+7 Days") {
      setWeeklyDays(String((Number(weeklyDays) || 0) + 7));
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

    onSubmit(
      {
        name: name.trim(),
        website: website.trim(),
        accountLabel: accountLabel.trim() || undefined,
        configBlock: configBlock.trim(),
        hourlyAllowance: hourlyAllowance.trim() || "Quota",
        weeklyAllowance: weeklyAllowance.trim() || "Quota",
        hourlyResetTimestamp:
          now +
          durationToMs(
            0,
            Math.max(Number(hourlyHours) || 0, 0),
            Math.max(Number(hourlyMinutes) || 0, 0),
          ),
        weeklyResetTimestamp:
          now +
          durationToMs(
            Math.max(Number(weeklyDays) || 0, 0),
            Math.max(Number(weeklyHours) || 0, 0),
            Math.max(Number(weeklyMinutes) || 0, 0),
          ),
        exhausted: instance?.exhausted ?? false,
      },
      instance?.id,
    );
    onClose();
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 outline-none transition ${
      hasError
        ? "border-rose-500/60 focus:border-rose-400"
        : "border-slate-700 focus:border-cyan-400"
    }`;

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
            <div>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearError("name");
                }}
                placeholder="Name"
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-rose-400/90">{errors.name}</p>
              )}
            </div>
            <div>
              <input
                value={website}
                onChange={(event) => {
                  setWebsite(event.target.value);
                  clearError("website");
                }}
                placeholder="Website"
                className={inputClass(!!errors.website)}
              />
              {errors.website && (
                <p className="mt-1.5 text-xs text-rose-400/90">{errors.website}</p>
              )}
            </div>
            <input
              value={accountLabel}
              onChange={(event) => setAccountLabel(event.target.value)}
              placeholder="Account label"
              className={inputClass(false)}
            />
            <input
              value={hourlyAllowance}
              onChange={(event) => setHourlyAllowance(event.target.value)}
              placeholder="Hourly allowance"
              className={inputClass(false)}
            />
            <input
              value={weeklyAllowance}
              onChange={(event) => setWeeklyAllowance(event.target.value)}
              placeholder="Weekly allowance"
              className={inputClass(false)}
            />
          </div>

          <div>
            <textarea
              value={configBlock}
              onChange={(event) => {
                setConfigBlock(event.target.value);
                clearError("configBlock");
              }}
              placeholder="Config block"
              rows={5}
              className={`w-full resize-y rounded-md border bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-500 outline-none transition ${
                errors.configBlock
                  ? "border-rose-500/60 focus:border-rose-400"
                  : "border-slate-700 focus:border-cyan-400"
              }`}
            />
            {errors.configBlock && (
              <p className="mt-1.5 text-xs text-rose-400/90">{errors.configBlock}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  Hourly reset window
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyHourlyPreset("+5 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +5h
                  </button>
                  <button
                    type="button"
                    onClick={() => applyHourlyPreset("+24 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    onClick={() => applyHourlyPreset("+7 Days")}
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
                    value={hourlyHours}
                    onChange={(event) => setHourlyHours(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    value={hourlyMinutes}
                    onChange={(event) => setHourlyMinutes(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                  Weekly reset window
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyWeeklyPreset("+5 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +5h
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWeeklyPreset("+24 Hours")}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWeeklyPreset("+7 Days")}
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
                    value={weeklyDays}
                    onChange={(event) => setWeeklyDays(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Hours</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyHours}
                    onChange={(event) => setWeeklyHours(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-400">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    value={weeklyMinutes}
                    onChange={(event) => setWeeklyMinutes(event.target.value)}
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
