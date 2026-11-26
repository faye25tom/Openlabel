import React, { useEffect, useRef, useState } from 'react';
import {
  Barcode,
  ChevronDown,
  Contrast,
  Database,
  Image as ImageIcon,
  Layers,
  Lock,
  QrCode,
  ScanText,
  Search,
  Shapes,
  Stamp,
  Table2,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';
import {
  BarcodeSymbology,
  LabelElement,
  ShapeKind,
  TwoDCodeType,
} from '../../types/model';
import {
  BARCODE_SYMBOLOGIES,
  SHAPE_CATALOG,
  ShapeCatalogCategory,
  TWO_D_CODE_TYPES,
} from '../../data/catalogs';
import {
  createBarcodeElement,
  createGraphElement,
  createImageElement,
  createQrElement,
  createReverseElement,
  createTableElement,
  createTextElement,
} from '../../data/elementFactory';
import { GraphShapeSvg } from '../ui/ShapePreviewSvg';

interface LeftToolboxProps {
  elements: LabelElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onToggleLockElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (element: LabelElement) => void;
  onOpenDatabaseManager: () => void;
  onOpenOcrModal: () => void;
  onOpenIconPicker: () => void;
  onOpenBarcodePicker: () => void;
}

export const LeftToolbox: React.FC<LeftToolboxProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onToggleLockElement,
  onDeleteElement,
  onAddElement,
  onOpenDatabaseManager,
  onOpenOcrModal,
  onOpenIconPicker,
  onOpenBarcodePicker,
}) => {
  const [showBarcodeDropdown, setShowBarcodeDropdown] = useState(false);
  const [showQrDropdown, setShowQrDropdown] = useState(false);
  const [showGraphDropdown, setShowGraphDropdown] = useState(false);
  const [graphCategory, setGraphCategory] = useState<'all' | ShapeCatalogCategory>('all');
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const barcodeBtnRef = useRef<HTMLButtonElement | null>(null);
  const qrBtnRef = useRef<HTMLButtonElement | null>(null);
  const graphBtnRef = useRef<HTMLButtonElement | null>(null);

  const barcodeMenuRef = useRef<HTMLDivElement | null>(null);
  const qrMenuRef = useRef<HTMLDivElement | null>(null);
  const graphMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showBarcodeDropdown &&
        barcodeBtnRef.current &&
        !barcodeBtnRef.current.contains(target) &&
        barcodeMenuRef.current &&
        !barcodeMenuRef.current.contains(target)
      ) {
        setShowBarcodeDropdown(false);
      }
      if (
        showQrDropdown &&
        qrBtnRef.current &&
        !qrBtnRef.current.contains(target) &&
        qrMenuRef.current &&
        !qrMenuRef.current.contains(target)
      ) {
        setShowQrDropdown(false);
      }
      if (
        showGraphDropdown &&
        graphBtnRef.current &&
        !graphBtnRef.current.contains(target) &&
        graphMenuRef.current &&
        !graphMenuRef.current.contains(target)
      ) {
        setShowGraphDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showBarcodeDropdown, showQrDropdown, showGraphDropdown]);

  const openPopup = (btnEl: HTMLElement | null, menuHeight = 360) => {
    if (!btnEl) return;
    const rect = btnEl.getBoundingClientRect();
    const left = rect.right + 8;
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - menuHeight - 16));
    setMenuPos({ top, left });
  };

  const handleAddBarcode = (symbology: BarcodeSymbology) => {
    onAddElement(createBarcodeElement(symbology));
    setShowBarcodeDropdown(false);
  };

  const handleAddQrcode = (codeType: TwoDCodeType) => {
    onAddElement(createQrElement(codeType));
    setShowQrDropdown(false);
  };

  const handleAddGraph = (shape: ShapeKind) => {
    onAddElement(createGraphElement(shape));
    setShowGraphDropdown(false);
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
          onAddElement(createImageElement(reader.result as string));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const quickBarcodes = BARCODE_SYMBOLOGIES.filter((b) => b.quickCommon);

  return (
    <aside className="no-print w-52 h-full bg-[#f8fafc] border-r border-slate-200 flex flex-col select-none shrink-0 z-20 overflow-hidden">
      {/* Toolbox Grid */}
      <div className="p-2.5 border-b border-slate-200/80">
        <div className="px-0.5 pb-2 mb-2 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            插入元素 (Insert)
          </span>
          <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
            10
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 w-full">
          <ToolButton
            icon={<Type className="w-4 h-4 text-slate-700" />}
            title="文本"
            sub="Text"
            onClick={() => onAddElement(createTextElement())}
          />

          <ToolButton
            icon={<ImageIcon className="w-4 h-4 text-slate-700" />}
            title="图片"
            sub="Image"
            onClick={handleAddImage}
          />

          {/* 3. 1D Barcode */}
          <div className="relative">
            <FlyoutToolButton
              ref={barcodeBtnRef}
              active={showBarcodeDropdown}
              icon={<Barcode className="w-4 h-4 text-slate-700" />}
              title="一维条码"
              sub="BarCode"
              onClick={() => {
                if (showBarcodeDropdown) {
                  setShowBarcodeDropdown(false);
                } else {
                  setShowQrDropdown(false);
                  setShowGraphDropdown(false);
                  openPopup(barcodeBtnRef.current, 380);
                  setShowBarcodeDropdown(true);
                }
              }}
            />

            {showBarcodeDropdown && menuPos && (
              <div
                ref={barcodeMenuRef}
                style={{ top: menuPos.top, left: menuPos.left }}
                className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 w-56 z-50 text-xs"
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>常用一维条码</span>
                  <span className="text-slate-400 font-normal">Symbology</span>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {quickBarcodes.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleAddBarcode(b.id)}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-[#0066FF] flex items-center justify-between text-slate-800 transition-colors"
                    >
                      <span className="font-semibold text-xs">{b.name}</span>
                      <span className="text-[10px] text-slate-400">{b.shortTag}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 pt-1.5 px-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBarcodeDropdown(false);
                      onOpenBarcodePicker();
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-[#0066FF] hover:bg-blue-50 rounded-md font-medium flex items-center gap-1.5 text-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>浏览全部条码类型...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. 2D QR Code */}
          <div className="relative">
            <FlyoutToolButton
              ref={qrBtnRef}
              active={showQrDropdown}
              icon={<QrCode className="w-4 h-4 text-slate-700" />}
              title="二维码"
              sub="QR Code"
              onClick={() => {
                if (showQrDropdown) {
                  setShowQrDropdown(false);
                } else {
                  setShowBarcodeDropdown(false);
                  setShowGraphDropdown(false);
                  openPopup(qrBtnRef.current, 300);
                  setShowQrDropdown(true);
                }
              }}
            />

            {showQrDropdown && menuPos && (
              <div
                ref={qrMenuRef}
                style={{ top: menuPos.top, left: menuPos.left }}
                className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 w-56 z-50 text-xs"
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  二维条码类型 (2D Barcodes)
                </div>
                {TWO_D_CODE_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAddQrcode(item.type)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-[#0066FF] flex flex-col justify-center text-slate-800 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <span className="font-semibold text-xs">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. Shapes */}
          <div className="relative">
            <FlyoutToolButton
              ref={graphBtnRef}
              active={showGraphDropdown}
              icon={<Shapes className="w-4 h-4 text-slate-700" />}
              title="几何图形"
              sub="Shapes"
              onClick={() => {
                if (showGraphDropdown) {
                  setShowGraphDropdown(false);
                } else {
                  setShowBarcodeDropdown(false);
                  setShowQrDropdown(false);
                  openPopup(graphBtnRef.current, 420);
                  setShowGraphDropdown(true);
                }
              }}
            />

            {showGraphDropdown && menuPos && (
              <div
                ref={graphMenuRef}
                style={{ top: menuPos.top, left: menuPos.left }}
                className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl p-3 w-[340px] z-50 text-xs max-h-[calc(100vh-40px)] flex flex-col"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="font-bold text-slate-900 text-xs">几何形状与线条库</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {SHAPE_CATALOG.length} 工业图形
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1 text-[11px]">
                  {(
                    [
                      { id: 'all', label: '全部' },
                      { id: 'basic', label: '基础几何' },
                      { id: 'lines', label: '线条箭头' },
                      { id: 'safety', label: '包装安全' },
                      { id: 'polygons', label: '多边形' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setGraphCategory(c.id)}
                      className={`px-2 py-0.5 rounded font-medium whitespace-nowrap transition-colors ${
                        graphCategory === c.id
                          ? 'bg-[#0066FF] text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-72 overflow-y-auto grid grid-cols-4 gap-1.5 pr-1">
                  {SHAPE_CATALOG.filter(
                    (s) => graphCategory === 'all' || s.category === graphCategory,
                  ).map((item) => (
                    <button
                      key={item.shape}
                      type="button"
                      onClick={() => handleAddGraph(item.shape)}
                      className="p-1.5 flex flex-col items-center justify-center rounded-md border border-slate-100 hover:border-blue-300 hover:bg-blue-50/70 text-slate-700 hover:text-[#0066FF] transition-colors text-center group"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <GraphShapeSvg
                          shape={item.shape}
                          strokeWidth={5}
                          strokeColor="currentColor"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </div>
                      <span className="text-[10px] mt-1 font-medium leading-tight text-slate-600 truncate w-full">
                        {item.zhLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ToolButton
            icon={<Stamp className="w-4 h-4 text-slate-700" />}
            title="工业图标"
            sub="Icon"
            onClick={onOpenIconPicker}
          />

          <ToolButton
            icon={<Table2 className="w-4 h-4 text-slate-700" />}
            title="数据表格"
            sub="Table"
            onClick={() => onAddElement(createTableElement())}
          />

          <ToolButton
            icon={<Database className="w-4 h-4 text-emerald-700" />}
            title="数据源"
            sub="Excel / DB"
            onClick={onOpenDatabaseManager}
          />

          <ToolButton
            icon={<ScanText className="w-4 h-4 text-slate-700" />}
            title="文字识别"
            sub="OCR"
            onClick={onOpenOcrModal}
          />

          <ToolButton
            icon={<Contrast className="w-4 h-4 text-slate-700" />}
            title="区域反白"
            sub="Reverse"
            onClick={() => onAddElement(createReverseElement())}
          />
        </div>
      </div>

      {/* Elements / Layers Panel */}
      <div className="flex-1 flex flex-col min-h-0 p-2.5">
        <div className="px-0.5 pb-1.5 mb-1.5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>图层 (Elements)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {elements.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {elements.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-slate-400">
              画布暂无图元
            </div>
          ) : (
            elements.map((el) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div
                  key={el.id}
                  onClick={() => onSelectElement(el.id)}
                  className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 text-slate-900 font-medium'
                      : 'bg-white border-slate-200/70 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <ElementKindGlyph type={el.kind.type} active={isSelected} />
                  <span className="flex-1 truncate text-[11px]">{el.name}</span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLockElement(el.id);
                    }}
                    title={el.locked ? '解锁元素' : '锁定元素'}
                    className={`p-0.5 rounded transition-opacity ${
                      el.locked
                        ? 'text-amber-600 opacity-100'
                        : 'text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {el.locked ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </button>

                  {!el.locked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(el.id);
                      }}
                      title="删除元素"
                      className="p-0.5 rounded text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};

function ElementKindGlyph({
  type,
  active,
}: {
  type: LabelElement['kind']['type'];
  active: boolean;
}) {
  const cls = `w-3.5 h-3.5 shrink-0 ${active ? 'text-[#0066FF]' : 'text-slate-400'}`;
  switch (type) {
    case 'text':
      return <Type className={cls} />;
    case 'barcode':
      return <Barcode className={cls} />;
    case 'qrcode':
      return <QrCode className={cls} />;
    case 'graph':
      return <Shapes className={cls} />;
    case 'table':
      return <Table2 className={cls} />;
    case 'icon':
      return <Stamp className={cls} />;
    case 'image':
      return <ImageIcon className={cls} />;
    case 'reverse':
      return <Contrast className={cls} />;
  }
}

function ToolButton({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white border border-slate-200/90 hover:border-[#0066FF]/60 hover:bg-blue-50/40 hover:shadow-xs text-slate-700 transition-all h-14 group"
    >
      <div className="group-hover:scale-105 transition-transform h-5 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-tight text-center">
        {title}
      </span>
      <span className="text-[9px] text-slate-400 font-sans leading-none text-center">
        {sub}
      </span>
    </button>
  );
}

const FlyoutToolButton = React.forwardRef<
  HTMLButtonElement,
  {
    active: boolean;
    icon: React.ReactNode;
    title: string;
    sub: string;
    onClick: () => void;
  }
>(({ active, icon, title, sub, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all h-14 relative ${
      active
        ? 'bg-blue-50 border-[#0066FF] shadow-xs ring-1 ring-blue-300'
        : 'bg-white border-slate-200/90 hover:border-[#0066FF]/60 hover:bg-blue-50/40 hover:shadow-xs text-slate-700'
    }`}
  >
    <div className="flex items-center gap-0.5 h-5">
      {icon}
      <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
    </div>
    <span className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-tight text-center">
      {title}
    </span>
    <span className="text-[9px] text-slate-400 font-sans leading-none text-center">
      {sub}
    </span>
  </button>
));
FlyoutToolButton.displayName = 'FlyoutToolButton';
