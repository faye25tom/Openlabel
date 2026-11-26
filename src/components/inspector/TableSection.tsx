import React, { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ClipboardPaste,
  Minus,
  Plus,
  Table2,
  X,
} from 'lucide-react';
import { LabelElement } from '../../types/model';
import { NumberInput } from '../ui/NumberInput';
import { InspectorSection, SegmentedControl } from '../ui/InspectorSection';

interface TableSectionProps {
  kind: Extract<LabelElement['kind'], { type: 'table' }>;
  onChangeKind: (kind: LabelElement['kind']) => void;
}

export const TableSection: React.FC<TableSectionProps> = ({
  kind,
  onChangeKind,
}) => {
  const [showBatchPaste, setShowBatchPaste] = useState(false);
  const [pasteRawText, setPasteRawText] = useState('');

  return (
    <InspectorSection
      title="表格配置与矩阵数据 (Table)"
      icon={<Table2 className="w-3.5 h-3.5" />}
      rightSlot={
        <span className="text-[10px] font-mono text-slate-500">
          {kind.rows}×{kind.cols}
        </span>
      }
    >
      <div className="space-y-3">
        {/* Rows & Cols Steppers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
            <span className="text-[10px] font-medium text-slate-500 px-1">行</span>
            <button
              type="button"
              title="删除末行"
              onClick={() => {
                const newRows = Math.max(1, kind.rows - 1);
                onChangeKind({
                  ...kind,
                  rows: newRows,
                  cells: kind.cells.slice(0, newRows),
                });
              }}
              className="w-6 h-6 bg-slate-50 hover:bg-slate-200 rounded border border-slate-200 flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="flex-1 text-center font-mono font-bold text-xs tabular-nums">
              {kind.rows}
            </span>
            <button
              type="button"
              title="末尾加行"
              onClick={() => {
                const newRows = kind.rows + 1;
                onChangeKind({
                  ...kind,
                  rows: newRows,
                  cells: [...kind.cells, Array(kind.cols).fill('')],
                });
              }}
              className="w-6 h-6 bg-slate-50 hover:bg-slate-200 rounded border border-slate-200 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
            <span className="text-[10px] font-medium text-slate-500 px-1">列</span>
            <button
              type="button"
              title="删除末列"
              onClick={() => {
                const newCols = Math.max(1, kind.cols - 1);
                onChangeKind({
                  ...kind,
                  cols: newCols,
                  cells: kind.cells.map((row) => row.slice(0, newCols)),
                });
              }}
              className="w-6 h-6 bg-slate-50 hover:bg-slate-200 rounded border border-slate-200 flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="flex-1 text-center font-mono font-bold text-xs tabular-nums">
              {kind.cols}
            </span>
            <button
              type="button"
              title="右侧加列"
              onClick={() => {
                const newCols = kind.cols + 1;
                onChangeKind({
                  ...kind,
                  cols: newCols,
                  cells: kind.cells.map((row) => [...row, '']),
                });
              }}
              className="w-6 h-6 bg-slate-50 hover:bg-slate-200 rounded border border-slate-200 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Fast Data Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowBatchPaste(!showBatchPaste)}
            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 rounded text-[11px] font-medium flex items-center gap-1"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span>粘贴 CSV/TSV</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeKind({
                ...kind,
                rows: 3,
                cols: 3,
                headerRow: true,
                cells: [
                  ['Item', 'Qty', 'Status'],
                  ['Part A-102', '50', 'PASS'],
                  ['Sensor Mod', '12', 'OK'],
                ],
              })
            }
            className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
          >
            示例填充
          </button>

          <button
            type="button"
            onClick={() => {
              const cleared = Array.from({ length: kind.rows }).map(() =>
                Array(kind.cols).fill(''),
              );
              onChangeKind({ ...kind, cells: cleared });
            }}
            className="px-2 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded text-[11px] font-medium ml-auto"
          >
            清空
          </button>
        </div>

        {showBatchPaste && (
          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
            <div className="text-[11px] text-slate-800 font-semibold flex items-center justify-between">
              <span>粘贴表格数据 (TSV / CSV)</span>
              <button
                type="button"
                onClick={() => setShowBatchPaste(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              rows={4}
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
              placeholder={`Header1\tHeader2\tHeader3\nValue1\tValue2\tValue3`}
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono outline-none focus:border-[#0066FF]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!pasteRawText.trim()) return;
                  const rawLines = pasteRawText.trim().split('\n');
                  const parsedGrid = rawLines.map((line) =>
                    line.includes('\t') ? line.split('\t') : line.split(','),
                  );
                  const newR = parsedGrid.length;
                  const newC = Math.max(...parsedGrid.map((row) => row.length));
                  const normalizedGrid = parsedGrid.map((row) => {
                    const r = [...row];
                    while (r.length < newC) r.push('');
                    return r;
                  });
                  onChangeKind({
                    ...kind,
                    rows: newR,
                    cols: newC,
                    cells: normalizedGrid,
                  });
                  setShowBatchPaste(false);
                  setPasteRawText('');
                }}
                className="px-3 py-1 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded text-xs font-semibold"
              >
                应用到表格
              </button>
            </div>
          </div>
        )}

        {/* Line Thickness & Font Size */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-200/70">
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              线宽 (mm)
            </label>
            <NumberInput
              min={0.01}
              step={0.01}
              value={kind.lineThicknessMm}
              onChange={(lineThicknessMm) =>
                onChangeKind({ ...kind, lineThicknessMm })
              }
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              字号 (pt)
            </label>
            <NumberInput
              min={0.1}
              step={0.1}
              value={kind.fontSizePt ?? 8}
              onChange={(fontSizePt) => onChangeKind({ ...kind, fontSizePt })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 items-center">
          <div>
            <label className="block text-slate-600 font-medium text-[11px] mb-1">
              边框颜色
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={kind.borderColor || '#000000'}
                onChange={(e) =>
                  onChangeKind({ ...kind, borderColor: e.target.value })
                }
                className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <span className="font-mono text-xs uppercase text-slate-600">
                {kind.borderColor || '#000000'}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-medium text-[11px] pt-4">
            <input
              type="checkbox"
              checked={kind.headerRow ?? true}
              onChange={(e) =>
                onChangeKind({ ...kind, headerRow: e.target.checked })
              }
              className="rounded text-[#0066FF]"
            />
            <span>首行表头高亮</span>
          </label>
        </div>

        <div>
          <label className="block text-slate-600 font-medium text-[11px] mb-1">
            单元格对齐
          </label>
          <SegmentedControl<'left' | 'center' | 'right'>
            value={kind.align || 'center'}
            onChange={(align) => onChangeKind({ ...kind, align })}
            size="xs"
            options={[
              {
                value: 'left',
                label: (
                  <>
                    <AlignLeft className="w-3 h-3" />
                    <span>Left</span>
                  </>
                ),
              },
              {
                value: 'center',
                label: (
                  <>
                    <AlignCenter className="w-3 h-3" />
                    <span>Center</span>
                  </>
                ),
              },
              {
                value: 'right',
                label: (
                  <>
                    <AlignRight className="w-3 h-3" />
                    <span>Right</span>
                  </>
                ),
              },
            ]}
          />
        </div>

        {/* Cell Content Matrix */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
          <div className="flex items-center justify-between">
            <label className="text-slate-700 font-semibold text-[11px]">
              单元格内容矩阵
            </label>
            <span className="text-[10px] text-slate-400">支持画板双击直编</span>
          </div>

          <div className="p-2 bg-white border border-slate-200 rounded-lg max-h-56 overflow-y-auto space-y-2">
            {Array.from({ length: kind.rows }).map((_, r) => {
              const isH = r === 0 && kind.headerRow;
              return (
                <div key={r} className="space-y-0.5">
                  <div className="text-[10px] font-mono px-0.5 text-slate-400">
                    <span className={isH ? 'font-bold text-[#0066FF]' : ''}>
                      {isH ? 'Row 1 (Header)' : `Row ${r + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: kind.cols }).map((_, c) => {
                      const val = kind.cells?.[r]?.[c] || '';
                      return (
                        <input
                          key={c}
                          type="text"
                          value={val}
                          placeholder={`C${c + 1}`}
                          onChange={(e) => {
                            const newCells = kind.cells.map((row) => [...row]);
                            while (newCells.length <= r) {
                              newCells.push(Array(kind.cols).fill(''));
                            }
                            while (newCells[r].length <= c) {
                              newCells[r].push('');
                            }
                            newCells[r][c] = e.target.value;
                            onChangeKind({ ...kind, cells: newCells });
                          }}
                          className={`flex-1 min-w-0 px-1.5 py-1 text-xs border rounded outline-none focus:border-[#0066FF] bg-white ${
                            isH
                              ? 'font-semibold border-blue-200 bg-blue-50/30 text-slate-900'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </InspectorSection>
  );
};
