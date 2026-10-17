import React, { useEffect, useState } from 'react';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  ariaLabel?: string;
}

const DECIMAL_DRAFT = /^-?\d*(?:\.\d*)?$/;
const INCOMPLETE_DRAFT = new Set(['', '-', '.', '-.']);

function formatValue(value: number): string {
  return Number.isFinite(value) ? String(value) : '';
}

function normalizeValue(value: number, min?: number, max?: number, integer = false): number {
  const rounded = integer ? Math.round(value) : value;
  if (min !== undefined && rounded < min) return min;
  if (max !== undefined && rounded > max) return max;
  return rounded;
}

function isWithinRange(value: number, min?: number, max?: number): boolean {
  return (min === undefined || value >= min) && (max === undefined || value <= max);
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  integer = false,
  className,
  disabled,
  placeholder,
  title,
  ariaLabel,
}) => {
  const [text, setText] = useState(() => formatValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(formatValue(value));
    }
  }, [value, isFocused]);

  const commitValue = (nextValue: number) => {
    const normalized = normalizeValue(nextValue, min, max, integer);
    setText(formatValue(normalized));
    if (normalized !== value) {
      onChange(normalized);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!DECIMAL_DRAFT.test(raw)) return;

    setText(raw);
    if (INCOMPLETE_DRAFT.has(raw)) return;

    const parsed = Number(raw);
    if (Number.isFinite(parsed) && isWithinRange(parsed, min, max)) {
      onChange(parsed);
    }
  };

  const handleFocus = () => {
    setText(formatValue(value));
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = Number(text);
    if (text.trim() === '' || !Number.isFinite(parsed)) {
      setText(formatValue(value));
      return;
    }
    commitValue(parsed);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
      return;
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    event.preventDefault();
    const current = Number(text);
    const base = Number.isFinite(current) ? current : value;
    const delta = step * (event.shiftKey ? 10 : 1);
    const next = base + (event.key === 'ArrowUp' ? delta : -delta);
    commitValue(integer ? Math.round(next) : Number(next.toPrecision(12)));
  };

  return (
    <input
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      spellCheck={false}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      title={title}
      aria-label={ariaLabel}
      className={className}
    />
  );
};
