import React from 'react';
import { Printer } from 'lucide-react';
import { LabelProject } from '../../types/model';

interface StatusBarProps {
  project: LabelProject;
  selectedPrinter: string;
  onChangePrinter: (printer: string) => void;
  cursorMm: [number, number];
  zoom: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  project,
  selectedPrinter,
  onChangePrinter,
  cursorMm,
  zoom,
}) => {
  return (
    <footer className="no-print h-7 bg-white border-t border-slate-200 px-3 flex items-center justify-between text-[11px] text-slate-600 select-none shrink-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono tabular-nums font-medium text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80">
          {project.paper.widthMm.toFixed(0)}×{project.paper.heightMm.toFixed(0)}mm ·{' '}
          {project.paper.columns}列
        </span>

        <span className="text-slate-300">|</span>

        <div className="flex items-center gap-1.5">
          <Printer className="w-3 h-3 text-slate-400 shrink-0" />
          <select
            value={selectedPrinter}
            onChange={(e) => onChangePrinter(e.target.value)}
            className="bg-transparent border-0 outline-none text-slate-800 font-medium text-[11px]"
          >
            <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
            <option value="Thermal TSPL2 (203 DPI)">
              TSC / Gainscha Thermal (203 DPI)
            </option>
            <option value="Zebra ZPL II (300 DPI)">Zebra ZPL II (300 DPI)</option>
          </select>
        </div>

        <span className="text-slate-300">|</span>

        <span className="font-mono tabular-nums text-slate-600">
          X: {cursorMm[0].toFixed(2)}mm &nbsp; Y: {cursorMm[1].toFixed(2)}mm
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-slate-400">
          图元: <strong className="font-mono text-slate-600">{project.elements.length}</strong>
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-400 hidden sm:inline">Clean-Room TSPL2/ZPL II</span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="font-mono tabular-nums font-semibold text-slate-700">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </footer>
  );
};
