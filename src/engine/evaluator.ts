import { DataSegment, DataTable } from '../types/model';

export interface EvalContext {
  labelSequenceIndex: number; // 0-based index in batch
  dbRowIndex: number;
  table?: DataTable;
  fixedNow?: Date;
  sharedOverrides?: Record<string, string>;
  printTimeInputs?: Record<string, string>;
}

/**
 * Format date according to custom masks like:
 * "yyyy年MM月dd日(数字)", "yyyy-MM-dd", "yyyy/MM/dd", "MM/dd/yyyy"
 */
export function formatDlabelDate(date: Date, mask: string): string {
  const cleanMask = mask.replace('(数字)', '');
  const yyyy = date.getFullYear().toString().padStart(4, '0');
  const yy = (date.getFullYear() % 100).toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');

  return cleanMask
    .replace(/yyyy/g, yyyy)
    .replace(/yy/g, yy)
    .replace(/MM/g, mm)
    .replace(/dd/g, dd);
}

export function formatDlabelTime(date: Date, mask: string): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');

  return mask
    .replace(/HH/g, hh)
    .replace(/mm/g, mm)
    .replace(/ss/g, ss);
}

export function applyDateOffsets(
  base: Date,
  yearOffset: number,
  monthOffset: number,
  dayOffset: number
): Date {
  const d = new Date(base.getTime());
  if (yearOffset !== 0) {
    d.setFullYear(d.getFullYear() + yearOffset);
  }
  if (monthOffset !== 0) {
    d.setMonth(d.getMonth() + monthOffset);
  }
  if (dayOffset !== 0) {
    d.setDate(d.getDate() + dayOffset);
  }
  return d;
}

export function evaluateSingleSegment(segment: DataSegment, ctx: EvalContext): string {
  const now = ctx.fixedNow || new Date();

  switch (segment.type) {
    case 'constant':
      return segment.text;

    case 'database': {
      const row = ctx.table?.rows?.[ctx.dbRowIndex];
      const val = row?.[segment.headerField] ?? `<${segment.headerField}>`;
      if (segment.showHeaderPrefix) {
        return `${segment.headerField}:${val}`;
      }
      return val;
    }

    case 'serial': {
      const safeRepeat = Math.max(1, segment.repeat || 1);
      const stepCount = Math.floor(ctx.labelSequenceIndex / safeRepeat);
      const delta = stepCount * (segment.interval || 1);

      let currentVal = segment.startValue;
      if (segment.direction === 'incremental') {
        currentVal += delta;
      } else {
        currentVal -= delta;
      }

      if (segment.paddingWidth > 0 && currentVal >= 0) {
        return currentVal.toString().padStart(segment.paddingWidth, '0');
      }
      return currentVal.toString();
    }

    case 'date': {
      const shifted = applyDateOffsets(
        now,
        segment.yearOffset || 0,
        segment.monthOffset || 0,
        segment.dayOffset || 0
      );
      return formatDlabelDate(shifted, segment.format || 'yyyy-MM-dd');
    }

    case 'time': {
      const shifted = new Date(now.getTime() + (segment.minuteOffset || 0) * 60000);
      return formatDlabelTime(shifted, segment.format || 'HH:mm:ss');
    }
  }
}

export function evaluateSegments(segments: DataSegment[], ctx: EvalContext): string {
  if (!segments || segments.length === 0) return '';
  return segments.map((seg) => evaluateSingleSegment(seg, ctx)).join('');
}
