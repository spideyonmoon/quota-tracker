import { useEffect, useMemo, useRef, useState } from "react";
import type { Instance } from "./types";
import { useInstances } from "./hooks/useInstances";
import { InstanceCard } from "./components/InstanceCard";
import { InstanceEditorModal } from "./components/InstanceEditorModal";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { sortInstances, filterInstances } from "./utils";

export default function App() {
  const {
    instances,
    addInstance,
    updateInstance,
    deleteInstance,
    toggleExhausted,
    duplicateInstance,
    markAllAvailable,
    exportInstances,
    importInstances,
  } = useInstances();
  const [, setMinuteTick] = useState(0);
  const [editorState, setEditorState] = useState<{
    mode: "add" | "edit";
    instance: Instance | null;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMinuteTick((tick) => tick + 1);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const sortedInstances = useMemo(() => sortInstances(instances), [instances]);
  const filteredInstances = useMemo(
    () => filterInstances(sortedInstances, searchQuery),
    [sortedInstances, searchQuery],
  );

  const hasExhausted = instances.some((i) => i.exhausted);

  const handleExport = async () => {
    const json = exportInstances();
    try {
      await navigator.clipboard.writeText(json);
      setExportCopied(true);
      window.setTimeout(() => setExportCopied(false), 2000);
    } catch {
      setExportCopied(false);
    }
  };

  const handleExportFile = () => {
    const json = exportInstances();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quota-tracker-instances.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const ok = importInstances(importText);
    if (ok) {
      setShowImport(false);
      setImportText("");
      setImportError(false);
    } else {
      setImportError(true);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100">
      {/* Header with mesh gradient */}
      <div className="relative border-b border-white/[0.06]">
        <div className="mesh-gradient absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/20">
                  <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Quota Tracker
                </h1>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">
                Track third-party API quota windows across accounts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Instance count */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm">
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                  Tracked
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  {instances.length}
                </p>
              </div>

              {/* Mark All Available */}
              {hasExhausted && (
                <button
                  type="button"
                  onClick={markAllAvailable}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-2 text-[13px] font-semibold text-emerald-300 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/15"
                >
                  Reset All
                </button>
              )}

              {/* Import */}
              <button
                type="button"
                onClick={() => setShowImport(true)}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
              >
                Import
              </button>

              {/* Export */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                >
                  {exportCopied ? "Copied!" : "Export"}
                </button>
                <button
                  type="button"
                  onClick={handleExportFile}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.1] bg-slate-800 text-[10px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                  title="Download as file"
                >
                  ↓
                </button>
              </div>

              {/* Add Instance */}
              <button
                type="button"
                onClick={() => setEditorState({ mode: "add", instance: null })}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:from-cyan-400 hover:to-blue-400 hover:shadow-xl hover:shadow-cyan-500/25"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add
              </button>
            </div>
          </div>

          {/* Search */}
          {instances.length > 0 && (
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Filter instances..."
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 pl-10 text-[13px] text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
              />
              <svg
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors hover:text-slate-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredInstances.length > 0 ? (
            filteredInstances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onEdit={(item) => setEditorState({ mode: "edit", instance: item })}
                onDelete={(id) => setDeleteTarget(id)}
                onToggleExhausted={toggleExhausted}
                onDuplicate={duplicateInstance}
              />
            ))
          ) : instances.length > 0 && searchQuery ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center text-slate-500 lg:col-span-2">
              <svg className="mx-auto h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <p className="mt-3 text-[13px]">No instances match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center text-slate-500 lg:col-span-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03]">
                <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="mt-4 text-[13px]">Add your first instance to start tracking</p>
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

      {deleteTarget ? (
        <ConfirmDialog
          title="Delete Instance"
          message="This will permanently remove this instance and its config block. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            deleteInstance(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}

      {showImport ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-backdrop">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-slate-900/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <h3 className="text-lg font-bold tracking-tight text-white">Import Instances</h3>
            <p className="mt-1.5 text-[13px] text-slate-500">
              Paste exported JSON or load a file.
            </p>
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-slate-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
              >
                Load JSON File
              </button>
            </div>
            <textarea
              value={importText}
              onChange={(event) => {
                setImportText(event.target.value);
                setImportError(false);
              }}
              placeholder='[{"name": "...", "website": "...", ...}]'
              rows={10}
              className="input-premium mt-4 w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-[13px] text-white placeholder:text-slate-700 outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
            />
            {importError && (
              <p className="mt-2 text-[13px] text-rose-400/80">
                Invalid JSON. Please check the format.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportText("");
                  setImportError(false);
                }}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
