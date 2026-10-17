import React, { useState } from 'react';
import { DataTable } from '../types/model';
import { SAMPLE_DATABASE } from '../data/sampleTemplates';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  currentDatabase?: DataTable;
  onClose: () => void;
  onApplyDatabase: (database: DataTable) => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  currentDatabase,
  onClose,
  onApplyDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'csv'>('sample');
  const [csvContent, setCsvContent] = useState<string>(
    'SKU,ProductName,LotNumber,Location,Qty\nOL-7001,High Precision Temp Sensor,LOT-2026-X1,WH-A1,100\nOL-7002,Industrial Stepper Driver,LOT-2026-X2,WH-A2,50\nOL-7003,Photoelectric Proximity Switch,LOT-2026-X3,WH-B4,250'
  );

  if (!isOpen) return null;

  const handleParseCsv = () => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = parts[i]?.trim() || '';
      });
      return row;
    });

    onApplyDatabase({
      name: 'Imported_Dataset.csv',
      headers,
      rows,
    });
    onClose();
  };

  const handleLoadSample = () => {
    onApplyDatabase(SAMPLE_DATABASE);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs select-none">
      <div className="w-[640px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">
              Database & Excel Manager
            </span>
            <span className="text-xs text-slate-500 font-mono">
              (Batch Print Source)
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg w-6 h-6 flex items-center justify-center rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('sample')}
              className={`px-3 py-1 font-medium rounded ${
                activeTab === 'sample'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Industrial Preset Dataset
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1 font-medium rounded ${
                activeTab === 'csv'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste / Import CSV
            </button>
          </div>

          {activeTab === 'sample' ? (
            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed">
                Load a ready-to-use industrial inventory database with 5 standard headers (
                <code>SKU</code>, <code>ProductName</code>, <code>LotNumber</code>,{' '}
                <code>Location</code>, <code>StandardQty</code>).
              </p>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] overflow-x-auto max-h-48">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold text-slate-800">
                      {SAMPLE_DATABASE.headers.map((h) => (
                        <th key={h} className="py-1 px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_DATABASE.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-200 last:border-b-0">
                        {SAMPLE_DATABASE.headers.map((h) => (
                          <td key={h} className="py-1 px-2">
                            {(row as Record<string, string>)[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleLoadSample}
                className="w-full py-2 bg-[#0084ff] hover:bg-[#0073e6] text-white font-medium rounded-lg text-xs"
              >
                Apply Industrial Preset Database
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-slate-600 font-medium">
                CSV Data (First line must be headers):
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded outline-none focus:border-sky-500"
              />
              <button
                onClick={handleParseCsv}
                className="w-full py-2 bg-[#0084ff] hover:bg-[#0073e6] text-white font-medium rounded-lg text-xs"
              >
                Parse & Bind CSV Table
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
