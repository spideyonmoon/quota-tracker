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
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Tracked
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {instances.length} instances
                </p>
              </div>
              {hasExhausted && (
                <button
                  type="button"
                  onClick={markAllAvailable}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-950/40"
                >
                  Mark All Available
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowImport(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Import
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                >
                  {exportCopied ? "Copied!" : "Export"}
                </button>
                <button
                  type="button"
                  onClick={handleExportFile}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] text-slate-400 hover:bg-slate-700 hover:text-white"
                  title="Download as file"
                >
                  ↓
                </button>
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

          {instances.length > 0 && (
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, website, label..."
                className="w-full rounded-md border border-slate-800 bg-slate-900 px-4 py-2.5 pl-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/50"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
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
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-400 lg:col-span-2">
              No instances match "{searchQuery}"
            </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-semibold text-white">Import Instances</h3>
            <p className="mt-2 text-sm text-slate-400">
              Paste exported JSON or load a file to import instances.
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
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
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
              className="mt-4 w-full resize-y rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
            />
            {importError && (
              <p className="mt-2 text-sm text-rose-400/90">
                Invalid JSON. Please check the format and try again.
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportText("");
                  setImportError(false);
                }}
                className="rounded-md px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
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
