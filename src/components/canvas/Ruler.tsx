import React from 'react';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  lengthPx: number;
  offsetPx: number;
  pxPerMm: number;
  cursorMm?: number;
}

export const RULER_THICKNESS = 22;

export const Ruler: React.FC<RulerProps> = ({
  orientation,
  lengthPx,
  offsetPx,
  pxPerMm,
  cursorMm,
}) => {
  const isH = orientation === 'horizontal';

  const minMm = Math.floor(-offsetPx / pxPerMm) - 2;
  const maxMm = Math.ceil((lengthPx - offsetPx) / pxPerMm) + 2;

  const ticks: React.ReactNode[] = [];

  for (let mm = minMm; mm <= maxMm; mm++) {
    const pos = offsetPx + mm * pxPerMm;
    if (pos < 0 || pos > lengthPx) continue;

    const is10 = mm % 10 === 0;
    const is5 = mm % 5 === 0;
    const isZero = mm === 0;

    const stroke = isZero ? '#0066FF' : is10 ? '#64748b' : '#94a3b8';

    if (isH) {
      const tickH = is10 ? 12 : is5 ? 7 : 4;
      ticks.push(
        <line
          key={`tick-${mm}`}
          x1={pos}
          y1={RULER_THICKNESS - tickH}
          x2={pos}
          y2={RULER_THICKNESS}
          stroke={stroke}
          strokeWidth={isZero ? 1.25 : 1}
        />,
      );
      if (is10) {
        ticks.push(
          <text
            key={`lbl-${mm}`}
            x={pos + 2.5}
            y={9.5}
            fontSize={9}
            fontWeight={isZero ? 700 : 500}
            fill={isZero ? '#0066FF' : '#475569'}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
            textAnchor="start"
          >
            {mm}
          </text>,
        );
      }
    } else {
      const tickW = is10 ? 12 : is5 ? 7 : 4;
      ticks.push(
        <line
          key={`tick-${mm}`}
          x1={RULER_THICKNESS - tickW}
          y1={pos}
          x2={RULER_THICKNESS}
          y2={pos}
          stroke={stroke}
          strokeWidth={isZero ? 1.25 : 1}
        />,
      );
      if (is10) {
        ticks.push(
          <text
            key={`lbl-${mm}`}
            x={2}
            y={pos + 9}
            fontSize={9}
            fontWeight={isZero ? 700 : 500}
            fill={isZero ? '#0066FF' : '#475569'}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
            textAnchor="start"
          >
            {mm}
          </text>,
        );
      }
    }
  }

  let cursorIndicator: React.ReactNode = null;
  if (cursorMm !== undefined && Number.isFinite(cursorMm)) {
    const cursorPos = offsetPx + cursorMm * pxPerMm;
    if (cursorPos >= 0 && cursorPos <= lengthPx) {
      cursorIndicator = isH ? (
        <line
          x1={cursorPos}
          y1={0}
          x2={cursorPos}
          y2={RULER_THICKNESS}
          stroke="#0066FF"
          strokeWidth={1.5}
        />
      ) : (
        <line
          x1={0}
          y1={cursorPos}
          x2={RULER_THICKNESS}
          y2={cursorPos}
          stroke="#0066FF"
          strokeWidth={1.5}
        />
      );
    }
  }

  return (
    <svg
      className={`select-none pointer-events-none block ${
        isH ? 'w-full' : 'h-full'
      } bg-[#f1f5f9] border-slate-300 ${isH ? 'border-b' : 'border-r'}`}
      style={isH ? { height: RULER_THICKNESS } : { width: RULER_THICKNESS }}
    >
      {ticks}
      {cursorIndicator}
    </svg>
  );
};
