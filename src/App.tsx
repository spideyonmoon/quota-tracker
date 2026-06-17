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
    setQuotaFlag,
    duplicateInstance,
    renewExpired,
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
      renewExpired();
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const sortedInstances = useMemo(() => sortInstances(instances), [instances]);
  const filteredInstances = useMemo(
    () => filterInstances(sortedInstances, searchQuery),
    [sortedInstances, searchQuery],
  );

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
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <path d="M12 12l5-5" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Quota Tracker
                </h1>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">
                Track third-party API quota windows across accounts.
              </p>
              <a
                href="https://github.com/spideyonmoon/quota-tracker"
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-slate-600 transition-colors hover:text-slate-400"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Source on GitHub
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Instance count */}
              <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Tracked</span>
                <span className="text-sm font-bold text-white">{instances.length}</span>
              </div>

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
                className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 pl-10 text-[13px] text-white placeholder:text-slate-600 outline-none transition-all duration-200 focus:border-cyan-400/40 focus:bg-white/[0.05]"
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
                onDuplicate={duplicateInstance}
                onSetQuotaFlag={setQuotaFlag}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-slate-900 p-6 shadow-2xl shadow-black/50">
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
