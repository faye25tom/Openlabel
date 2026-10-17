import React, { useState } from 'react';
import {
  BarcodeSymbology,
  DEFAULT_FONT,
  DEFAULT_PROMPT,
  ElementKind,
  LabelElement,
  ShapeKind,
} from '../types/model';

interface LeftToolboxProps {
  onAddElement: (element: LabelElement) => void;
  onOpenDatabaseManager: () => void;
  onOpenOcrModal: () => void;
  onOpenIconPicker: () => void;
}

export const LeftToolbox: React.FC<LeftToolboxProps> = ({
  onAddElement,
  onOpenDatabaseManager,
  onOpenOcrModal,
  onOpenIconPicker,
}) => {
  const [showGraphDropdown, setShowGraphDropdown] = useState(false);

  const handleAddText = () => {
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'Text',
      xMm: 6,
      yMm: 6,
      widthMm: 45,
      heightMm: 8,
      locked: false,
      kind: {
        type: 'text',
        segments: [{ type: 'constant', text: 'Double click to input content' }],
        activeSegmentIdx: 0,
        font: { ...DEFAULT_FONT },
        prompt: { ...DEFAULT_PROMPT },
      },
    };
    onAddElement(el);
  };

  const handleAddBarcode = () => {
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'BarCode',
      xMm: 6,
      yMm: 15,
      widthMm: 50,
      heightMm: 16,
      locked: false,
      kind: {
        type: 'barcode',
        symbology: 'code128',
        segments: [
          {
            type: 'serial',
            startValue: 10001,
            direction: 'incremental',
            repeat: 1,
            interval: 1,
            memory: false,
            paddingWidth: 5,
          },
        ],
        activeSegmentIdx: 0,
        showHumanReadable: true,
        font: { ...DEFAULT_FONT, sizePt: 8, align: 'center' },
        prompt: { ...DEFAULT_PROMPT },
      },
    };
    onAddElement(el);
  };

  const handleAddQrcode = () => {
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'QRCode',
      xMm: 10,
      yMm: 10,
      widthMm: 22,
      heightMm: 22,
      locked: false,
      kind: {
        type: 'qrcode',
        segments: [{ type: 'constant', text: 'https://openlabel.local/trace/001' }],
        activeSegmentIdx: 0,
        errorCorrection: 'M',
        prompt: { ...DEFAULT_PROMPT },
      },
    };
    onAddElement(el);
  };

  const handleAddGraph = (shape: ShapeKind) => {
    const isLine = shape === 'line';
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: shape === 'line' ? 'Line' : shape === 'circle' ? 'Circle' : 'Rectangle',
      xMm: 5,
      yMm: 5,
      widthMm: isLine ? 55 : 30,
      heightMm: isLine ? 1 : 20,
      locked: false,
      kind: {
        type: 'graph',
        shape,
        lineThicknessMm: 0.5,
        filled: false,
        strokeColor: '#000000',
        fillColor: '#ffffff',
      },
    };
    onAddElement(el);
    setShowGraphDropdown(false);
  };

  const handleAddTable = () => {
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'Table',
      xMm: 5,
      yMm: 5,
      widthMm: 60,
      heightMm: 25,
      locked: false,
      kind: {
        type: 'table',
        rows: 3,
        cols: 3,
        lineThicknessMm: 0.3,
        cells: [
          ['Item', 'Qty', 'Pass'],
          ['PCB-A', '10', 'YES'],
          ['SENSOR', '5', 'YES'],
        ],
      },
    };
    onAddElement(el);
  };

  const handleAddReverse = () => {
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'Reverse Area',
      xMm: 6,
      yMm: 6,
      widthMm: 35,
      heightMm: 12,
      locked: false,
      kind: {
        type: 'reverse',
      },
    };
    onAddElement(el);
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const el: LabelElement = {
            id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: 'Image',
            xMm: 10,
            yMm: 10,
            widthMm: 25,
            heightMm: 25,
            locked: false,
            kind: {
              type: 'image',
              src: reader.result as string,
              aspectRatioLock: true,
            },
          };
          onAddElement(el);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <aside className="w-28 h-full bg-[#f8fafc] border-r border-slate-200 flex flex-col items-center py-3 select-none shrink-0 z-10">
      <div className="grid grid-cols-2 gap-2 px-2 w-full">
        {/* 1. Text */}
        <ToolButton
          icon={<span className="text-base font-bold text-slate-800 font-serif">T</span>}
          label="Text"
          onClick={handleAddText}
        />

        {/* 2. Image */}
        <ToolButton
          icon={<span className="text-base">🖼</span>}
          label="Image"
          onClick={handleAddImage}
        />

        {/* 3. BarCode */}
        <ToolButton
          icon={<span className="text-base font-mono font-bold tracking-tighter">|||</span>}
          label="BarCode"
          onClick={handleAddBarcode}
        />

        {/* 4. QRCode */}
        <ToolButton
          icon={<span className="text-base">回</span>}
          label="QRCode"
          onClick={handleAddQrcode}
        />

        {/* 5. Graph */}
        <div className="relative">
          <ToolButton
            icon={<span className="text-base">⬜</span>}
            label="Graph"
            onClick={() => setShowGraphDropdown(!showGraphDropdown)}
          />
          {showGraphDropdown && (
            <div className="absolute left-full top-0 ml-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-28 z-50 text-xs">
              <button
                onClick={() => handleAddGraph('rectangle')}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <span>▭</span> Rectangle
              </button>
              <button
                onClick={() => handleAddGraph('line')}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <span>―</span> Line
              </button>
              <button
                onClick={() => handleAddGraph('circle')}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <span>◯</span> Circle
              </button>
            </div>
          )}
        </div>

        {/* 6. Icon */}
        <ToolButton
          icon={<span className="text-base font-semibold">标</span>}
          label="Icon"
          onClick={onOpenIconPicker}
        />

        {/* 7. Table */}
        <ToolButton
          icon={<span className="text-base">田</span>}
          label="Table"
          onClick={handleAddTable}
        />

        {/* 8. Excel */}
        <ToolButton
          icon={<span className="text-base">📗</span>}
          label="Excel"
          onClick={onOpenDatabaseManager}
        />

        {/* 9. Recognize */}
        <ToolButton
          icon={<span className="text-base">🔍</span>}
          label="Recognize"
          onClick={onOpenOcrModal}
        />

        {/* 10. Reverse */}
        <ToolButton
          icon={<span className="text-base">🌓</span>}
          label="Reverse"
          onClick={handleAddReverse}
        />
      </div>
    </aside>
  );
};

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-slate-200/80 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-xs text-slate-700 transition-all cursor-pointer h-14 group"
    >
      <div className="group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[10px] font-medium text-slate-600 mt-1 tracking-tight truncate w-full text-center">
        {label}
      </span>
    </button>
  );
}
