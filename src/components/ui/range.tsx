interface RangeProps {
  label: string;
  value: string;
  min: number;
  max: number;
  step?: number;
  current: number;
  onChange: (value: number) => void;
}

export function Range({ label, value, min, max, step = 1, current, onChange }: RangeProps) {
  return (
    <label className="block text-sm">
      {label}
      <span className="float-right font-mono text-slate-400">{value}</span>
      <input type="range" min={min} max={max} step={step} value={current} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-emerald-500" />
    </label>
  );
}
