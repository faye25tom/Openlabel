import React, { useState } from 'react';
import { Database, FileSpreadsheet, Upload } from 'lucide-react';
import { DataTable } from '../../types/model';
import { SAMPLE_DATABASE } from '../../data/sampleTemplates';
import { ModalShell } from '../ui/ModalShell';

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
    'SKU,ProductName,LotNumber,Location,Qty\nOL-7001,High Precision Temp Sensor,LOT-2026-X1,WH-A1,100\nOL-7002,Industrial Stepper Driver,LOT-2026-X2,WH-A2,50\nOL-7003,Photoelectric Proximity Switch,LOT-2026-X3,WH-B4,250',
  );

  const handleParseCsv = () => {
    const lines = csvContent.trim().split(/\r?\n/);
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

  const handleLoadCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvContent(reader.result);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="数据源与表格绑定 (Database & CSV)"
      subtitle={
        currentDatabase
          ? `当前已绑定: ${currentDatabase.name} (${currentDatabase.rows.length} 行)`
          : '批量序列打印数据源管理器'
      }
      icon={<Database className="w-4 h-4" />}
      maxWidthClass="max-w-[660px] w-full"
    >
      <div className="p-5 space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('sample')}
            className={`px-3 py-1.5 font-medium rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'sample'
                ? 'bg-blue-50 text-[#0066FF] border border-blue-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>行业示例数据集</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 font-medium rounded-md flex items-center gap-1.5 transition-colors ${
              activeTab === 'csv'
                ? 'bg-blue-50 text-[#0066FF] border border-blue-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>粘贴 / 导入 CSV</span>
          </button>
        </div>

        {activeTab === 'sample' ? (
          <div className="space-y-3">
            <p className="text-slate-600 leading-relaxed">
              一键加载标准工业库存数据集，包含 5 个字段（
              <code className="px-1 py-0.5 bg-slate-100 rounded">SKU</code>、
              <code className="px-1 py-0.5 bg-slate-100 rounded">ProductName</code>、
              <code className="px-1 py-0.5 bg-slate-100 rounded">LotNumber</code>、
              <code className="px-1 py-0.5 bg-slate-100 rounded">Location</code>、
              <code className="px-1 py-0.5 bg-slate-100 rounded">StandardQty</code>）。
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] overflow-x-auto max-h-52">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-300 font-bold text-slate-800">
                    {SAMPLE_DATABASE.headers.map((h) => (
                      <th key={h} className="py-1.5 px-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_DATABASE.rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-200 last:border-b-0">
                      {SAMPLE_DATABASE.headers.map((h) => (
                        <td key={h} className="py-1.5 px-2 text-slate-700">
                          {(row as Record<string, string>)[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => {
                onApplyDatabase(SAMPLE_DATABASE);
                onClose();
              }}
              className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-lg text-xs transition-colors"
            >
              应用工业预置数据源
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-medium">
                CSV 数据内容（首行须为列标题）:
              </label>
              <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>选择本地 .csv</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleLoadCsvFile}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={7}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg outline-none focus:border-[#0066FF]"
            />
            <button
              type="button"
              onClick={handleParseCsv}
              className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-lg text-xs transition-colors"
            >
              解析并绑定 CSV 数据表
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
