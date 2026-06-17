import { useEffect, useRef, useState } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface CustomDropdownProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  colorMap: Record<T, { bg: string; text: string; border: string; dot: string }>;
}

export function CustomDropdown<T extends string>({
  value,
  options,
  onChange,
  colorMap,
}: CustomDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = colorMap[value];
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:brightness-110 ${current.bg} ${current.text} ${current.border}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
        {currentLabel}
        <svg
          className={`h-3 w-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-white/[0.08] bg-slate-900 shadow-2xl shadow-black/50">
          {options.map((option) => {
            const c = colorMap[option.value];
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium transition-colors duration-150 hover:bg-white/[0.05] ${
                  option.value === value ? `${c.text}` : "text-slate-400"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {option.label}
                {option.value === value && (
                  <svg className="ml-auto h-3.5 w-3.5 opacity-50" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 8.5l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
