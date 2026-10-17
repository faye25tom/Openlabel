import React from 'react';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  lengthPx: number;
  offsetPx: number; // The screen pixel coordinate where label 0mm starts
  pxPerMm: number;
  cursorMm?: number;
}

export const Ruler: React.FC<RulerProps> = ({
  orientation,
  lengthPx,
  offsetPx,
  pxPerMm,
  cursorMm,
}) => {
  const isH = orientation === 'horizontal';

  // Calculate range of mm visible in lengthPx
  const minMm = Math.floor(-offsetPx / pxPerMm) - 2;
  const maxMm = Math.ceil((lengthPx - offsetPx) / pxPerMm) + 2;

  const ticks: React.ReactNode[] = [];

  for (let mm = minMm; mm <= maxMm; mm++) {
    const pos = offsetPx + mm * pxPerMm;
    if (pos < 0 || pos > lengthPx) continue;

    const is10 = mm % 10 === 0;
    const is5 = mm % 5 === 0;

    if (isH) {
      const tickH = is10 ? 12 : is5 ? 8 : 4;
      ticks.push(
        <line
          key={`tick-${mm}`}
          x1={pos}
          y1={20 - tickH}
          x2={pos}
          y2={20}
          stroke={is10 ? '#64748b' : '#94a3b8'}
          strokeWidth={1}
        />
      );
      if (is10) {
        ticks.push(
          <text
            key={`lbl-${mm}`}
            x={pos + 2}
            y={9}
            fontSize={9}
            fill="#475569"
            fontFamily="monospace"
            textAnchor="start"
          >
            {mm}
          </text>
        );
      }
    } else {
      const tickW = is10 ? 12 : is5 ? 8 : 4;
      ticks.push(
        <line
          key={`tick-${mm}`}
          x1={20 - tickW}
          y1={pos}
          x2={20}
          y2={pos}
          stroke={is10 ? '#64748b' : '#94a3b8'}
          strokeWidth={1}
        />
      );
      if (is10) {
        ticks.push(
          <text
            key={`lbl-${mm}`}
            x={2}
            y={pos + 9}
            fontSize={9}
            fill="#475569"
            fontFamily="monospace"
            textAnchor="start"
          >
            {mm}
          </text>
        );
      }
    }
  }

  // Cursor indicator hairline
  let cursorIndicator: React.ReactNode = null;
  if (cursorMm !== undefined) {
    const cursorPos = offsetPx + cursorMm * pxPerMm;
    if (cursorPos >= 0 && cursorPos <= lengthPx) {
      if (isH) {
        cursorIndicator = (
          <line
            x1={cursorPos}
            y1={0}
            x2={cursorPos}
            y2={20}
            stroke="#0284c7"
            strokeWidth={1.5}
          />
        );
      } else {
        cursorIndicator = (
          <line
            x1={0}
            y1={cursorPos}
            x2={20}
            y2={cursorPos}
            stroke="#0284c7"
            strokeWidth={1.5}
          />
        );
      }
    }
  }

  return (
    <svg
      className={`select-none pointer-events-none block ${
        isH ? 'w-full h-5' : 'w-5 h-full'
      } bg-[#eef1f6] border-[#cbd5e1] ${isH ? 'border-b' : 'border-r'}`}
      style={isH ? { height: 20 } : { width: 20 }}
    >
      {ticks}
      {cursorIndicator}
    </svg>
  );
};
