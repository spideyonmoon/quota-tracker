interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-backdrop">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-slate-900/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
          <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="mt-3 text-[15px] font-bold tracking-tight text-white">{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-5 py-2 text-[13px] font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-200 hover:from-rose-400 hover:to-red-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
