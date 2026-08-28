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
    <label className="block text-xs">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-slate-400">{label}</span>
        <span className="font-mono text-[11px] text-emerald-300">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full"
      />
    </label>
  );
}
