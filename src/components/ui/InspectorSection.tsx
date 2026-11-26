import React from 'react';

interface InspectorSectionProps {
  title: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const InspectorSection: React.FC<InspectorSectionProps> = ({
  title,
  icon,
  rightSlot,
  children,
  className = '',
}) => {
  return (
    <section
      className={`rounded-lg border border-slate-200/90 bg-slate-50/65 p-3 space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 truncate">
            {title}
          </h3>
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
};

interface SegmentedOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string | number> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  columns?: number;
  size?: 'xs' | 'sm';
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  columns,
  size = 'sm',
}: SegmentedControlProps<T>) {
  const colsStyle = columns
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` };

  return (
    <div
      className="grid gap-1 p-0.5 bg-slate-200/65 rounded-md border border-slate-200/70"
      style={colsStyle}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`${
              size === 'xs' ? 'py-1 text-[10px]' : 'py-1.5 text-[11px]'
            } px-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
              active
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
