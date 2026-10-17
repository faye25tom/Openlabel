import React, { useState, useRef, useEffect } from 'react';
import {
  BarcodeSymbology,
  DEFAULT_FONT,
  DEFAULT_PROMPT,
  ElementKind,
  LabelElement,
  ShapeKind,
  TwoDCodeType,
} from '../types/model';

interface LeftToolboxProps {
  onAddElement: (element: LabelElement) => void;
  onOpenDatabaseManager: () => void;
  onOpenOcrModal: () => void;
  onOpenIconPicker: () => void;
  onOpenBarcodePicker: () => void;
}

export const LeftToolbox: React.FC<LeftToolboxProps> = ({
  onAddElement,
  onOpenDatabaseManager,
  onOpenOcrModal,
  onOpenIconPicker,
  onOpenBarcodePicker,
}) => {
  const [showBarcodeDropdown, setShowBarcodeDropdown] = useState(false);
  const [showQrDropdown, setShowQrDropdown] = useState(false);
  const [showGraphDropdown, setShowGraphDropdown] = useState(false);
  const [graphCategory, setGraphCategory] = useState<'all' | 'basic' | 'lines' | 'safety' | 'polygons'>('all');

  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const barcodeBtnRef = useRef<HTMLButtonElement | null>(null);
  const qrBtnRef = useRef<HTMLButtonElement | null>(null);
  const graphBtnRef = useRef<HTMLButtonElement | null>(null);

  const barcodeMenuRef = useRef<HTMLDivElement | null>(null);
  const qrMenuRef = useRef<HTMLDivElement | null>(null);
  const graphMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns on outside click
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

  const openPopup = (btnEl: HTMLElement | null, menuHeight = 350) => {
    if (!btnEl) return;
    const rect = btnEl.getBoundingClientRect();
    const left = rect.right + 6;
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - menuHeight - 16));
    setMenuPos({ top, left });
  };

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
        segments: [{ type: 'constant', text: '双击编辑文字内容' }],
        activeSegmentIdx: 0,
        font: { ...DEFAULT_FONT },
        prompt: { ...DEFAULT_PROMPT },
      },
    };
    onAddElement(el);
  };

  const handleAddBarcode = (symbology: BarcodeSymbology = 'code128') => {
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `BarCode (${symbology.toUpperCase()})`,
      xMm: 6,
      yMm: 15,
      widthMm: 50,
      heightMm: 16,
      locked: false,
      kind: {
        type: 'barcode',
        symbology,
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
    setShowBarcodeDropdown(false);
  };

  const handleAddQrcode = (codeType: TwoDCodeType = 'QR_Code') => {
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${codeType}`,
      xMm: 10,
      yMm: 10,
      widthMm: codeType === 'PDF_417' ? 40 : 22,
      heightMm: codeType === 'PDF_417' ? 18 : 22,
      locked: false,
      kind: {
        type: 'qrcode',
        codeType,
        segments: [{ type: 'constant', text: 'https://openlabel.local/trace/001' }],
        activeSegmentIdx: 0,
        errorCorrection: 'M',
        scalePercent: 100,
        marginModules: 1,
        prompt: { ...DEFAULT_PROMPT },
      },
    };
    onAddElement(el);
    setShowQrDropdown(false);
  };

  const handleAddGraph = (shape: ShapeKind) => {
    const isLine = shape === 'line' || shape === 'diagonal_line_up' || shape === 'diagonal_line_down';
    const isVertLine = shape === 'vertical_line' || shape === 'double_arrow_v';
    const el: LabelElement = {
      id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: shape.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      xMm: 5,
      yMm: 5,
      widthMm: isLine ? 55 : isVertLine ? 4 : 25,
      heightMm: isLine ? 4 : isVertLine ? 40 : 25,
      locked: false,
      kind: {
        type: 'graph',
        shape,
        lineThicknessMm: 0.5,
        lineStyle: 'solid',
        cornerRadiusMm: shape === 'rounded_rect' ? 3 : shape === 'snip_corner_rect' ? 4 : 0,
        filled: shape === 'hazard_triangle' || shape === 'prohibition' ? false : false,
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
        headerRow: true,
        fontSizePt: 8,
        align: 'center',
        cells: [
          ['Item', 'Qty', 'Result'],
          ['SMT-PCB', '10', 'PASS'],
          ['SENSOR', '5', 'PASS'],
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
    <aside className="w-44 h-full bg-[#f8fafc] border-r border-slate-200 flex flex-col py-2.5 px-2 select-none shrink-0 z-20 overflow-y-auto">
      {/* Toolbox Section Header */}
      <div className="w-full px-1 pb-2 mb-2 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🧰</span>
          <span className="text-xs font-bold text-slate-800 tracking-tight">常用工具箱</span>
        </div>
        <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
          10
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {/* 1. Text */}
        <ToolButton
          icon={<span className="text-base font-bold text-slate-800 font-serif">T</span>}
          title="文本"
          sub="Text"
          onClick={handleAddText}
        />

        {/* 2. Image */}
        <ToolButton
          icon={<span className="text-base">🖼</span>}
          title="图片"
          sub="Image"
          onClick={handleAddImage}
        />

        {/* 3. BarCode (With Symbology Selection Dropdown) */}
        <div className="relative">
          <button
            ref={barcodeBtnRef}
            onClick={(e) => {
              if (showBarcodeDropdown) {
                setShowBarcodeDropdown(false);
              } else {
                setShowQrDropdown(false);
                setShowGraphDropdown(false);
                openPopup(barcodeBtnRef.current, 360);
                setShowBarcodeDropdown(true);
              }
            }}
            className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer h-14 ${
              showBarcodeDropdown
                ? 'bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-300'
                : 'bg-white border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-xs text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="text-base font-mono font-bold tracking-tighter">|||</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-tight text-center">
              一维条码
            </span>
            <span className="text-[9px] text-slate-400 font-sans leading-none text-center">BarCode</span>
          </button>

          {/* Barcode Type Dropdown */}
          {showBarcodeDropdown && menuPos && (
            <div
              ref={barcodeMenuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 w-52 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>常用一维条码</span>
                <span className="text-slate-400 font-normal">Symbology</span>
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {[
                  { id: 'code128' as BarcodeSymbology, name: 'CODE 128', tag: '通用全能' },
                  { id: 'code39' as BarcodeSymbology, name: 'CODE 39', tag: '工业制造' },
                  { id: 'ean13' as BarcodeSymbology, name: 'EAN-13', tag: '商品零售' },
                  { id: 'ean8' as BarcodeSymbology, name: 'EAN-8', tag: '小商品码' },
                  { id: 'upca' as BarcodeSymbology, name: 'UPC-A', tag: '北美零售' },
                  { id: 'upce' as BarcodeSymbology, name: 'UPC-E', tag: '紧凑UPC' },
                  { id: 'itf14' as BarcodeSymbology, name: 'ITF-14', tag: '外箱包装' },
                  { id: 'codabar' as BarcodeSymbology, name: 'CODABAR', tag: '仓储物流' },
                  { id: 'code93' as BarcodeSymbology, name: 'CODE 93', tag: '高密度码' },
                  { id: 'gs1-128' as BarcodeSymbology, name: 'GS1-128', tag: '供应链' },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleAddBarcode(b.id)}
                    className="w-full px-3 py-1.5 text-left hover:bg-sky-50 hover:text-sky-700 flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-xs">{b.name}</span>
                    <span className="text-[10px] text-slate-400">{b.tag}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-1.5 px-1.5">
                <button
                  onClick={() => {
                    setShowBarcodeDropdown(false);
                    onOpenBarcodePicker();
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-sky-600 hover:bg-sky-50 rounded font-medium flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>🔍</span>
                  <span>浏览全部 60+ 条码类型...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. QRCode (With Dropdown Arrow) */}
        <div className="relative">
          <button
            ref={qrBtnRef}
            onClick={() => {
              if (showQrDropdown) {
                setShowQrDropdown(false);
              } else {
                setShowBarcodeDropdown(false);
                setShowGraphDropdown(false);
                openPopup(qrBtnRef.current, 280);
                setShowQrDropdown(true);
              }
            }}
            className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer h-14 ${
              showQrDropdown
                ? 'bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-300'
                : 'bg-white border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-xs text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1">
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 border border-slate-700 p-0.5 rounded-[1px]">
                <div className="bg-slate-700" />
                <div className="bg-slate-700" />
                <div className="bg-slate-700" />
                <div className="border border-slate-700" />
              </div>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-tight text-center">
              二维码
            </span>
            <span className="text-[9px] text-slate-400 font-sans leading-none text-center">QR Code</span>
          </button>

          {/* 2D Barcode dropdown menu */}
          {showQrDropdown && menuPos && (
            <div
              ref={qrMenuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 w-52 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                二维条码类型 (2D Barcodes)
              </div>
              {[
                { type: 'QR_Code' as TwoDCodeType, label: 'QR Code', desc: '标准二维码 (工业/追溯)' },
                { type: 'DATA_MATRIX' as TwoDCodeType, label: 'Data Matrix', desc: '微型紧凑 (精密元件)' },
                { type: 'PDF_417' as TwoDCodeType, label: 'PDF417', desc: '高容量层排 (登机牌/票证)' },
                { type: 'HANXIN' as TwoDCodeType, label: '汉信码', desc: '国标自主汉字码' },
                { type: 'AZTEC' as TwoDCodeType, label: 'Aztec Code', desc: '中心靶心高密度' },
                { type: 'MAXICODE' as TwoDCodeType, label: 'MaxiCode', desc: '六边形蜂窝 (UPS物流)' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddQrcode(item.type)}
                  className="w-full px-3 py-2 text-left hover:bg-sky-50 hover:text-sky-700 flex flex-col justify-center text-slate-800 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                >
                  <span className="font-semibold text-xs">{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Graph (With Expanded Shapes Grid & Categories) */}
        <div className="relative">
          <button
            ref={graphBtnRef}
            onClick={() => {
              if (showGraphDropdown) {
                setShowGraphDropdown(false);
              } else {
                setShowBarcodeDropdown(false);
                setShowQrDropdown(false);
                openPopup(graphBtnRef.current, 400);
                setShowGraphDropdown(true);
              }
            }}
            className={`w-full flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer h-14 ${
              showGraphDropdown
                ? 'bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-300'
                : 'bg-white border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-xs text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="text-base">⬜</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-tight text-center">
              几何图形
            </span>
            <span className="text-[9px] text-slate-400 font-sans leading-none text-center">Shapes</span>
          </button>

          {/* Comprehensive Shapes Palette Menu */}
          {showGraphDropdown && menuPos && (
            <div
              ref={graphMenuRef}
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl p-3 w-88 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-40px)] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="font-bold text-slate-900 text-xs">几何形状与线条库</span>
                <span className="text-[10px] text-slate-400">40+ 工业图形</span>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'basic', label: '基础几何' },
                  { id: 'lines', label: '线条箭头' },
                  { id: 'safety', label: '包装安全' },
                  { id: 'polygons', label: '多边形' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setGraphCategory(c.id as any)}
                    className={`px-2 py-0.5 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      graphCategory === c.id
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {/* 1. Basic Shapes */}
                {(graphCategory === 'all' || graphCategory === 'basic') && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                      基础形状 (Basic)
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <ShapeItem icon="▭" label="矩形 Rect" onClick={() => handleAddGraph('rectangle')} />
                      <ShapeItem icon="▢" label="圆角矩形" onClick={() => handleAddGraph('rounded_rect')} />
                      <ShapeItem icon="◯" label="圆形 Circle" onClick={() => handleAddGraph('circle')} />
                      <ShapeItem icon="⬭" label="椭圆 Ellipse" onClick={() => handleAddGraph('ellipse')} />
                      <ShapeItem icon="💊" label="胶囊 Capsule" onClick={() => handleAddGraph('capsule')} />
                      <ShapeItem icon="⎔" label="切角矩形" onClick={() => handleAddGraph('snip_corner_rect')} />
                    </div>
                  </div>
                )}

                {/* 2. Lines & Arrows */}
                {(graphCategory === 'all' || graphCategory === 'lines') && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                      线条与箭头 (Lines & Arrows)
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <ShapeItem icon="―" label="水平线" onClick={() => handleAddGraph('line')} />
                      <ShapeItem icon="|" label="垂直线" onClick={() => handleAddGraph('vertical_line')} />
                      <ShapeItem icon="↗" label="斜上线" onClick={() => handleAddGraph('diagonal_line_up')} />
                      <ShapeItem icon="↘" label="斜下线" onClick={() => handleAddGraph('diagonal_line_down')} />
                      <ShapeItem icon="➔" label="右箭头" onClick={() => handleAddGraph('arrow')} />
                      <ShapeItem icon="⬅" label="左箭头" onClick={() => handleAddGraph('arrow_left')} />
                      <ShapeItem icon="⬆" label="上箭头" onClick={() => handleAddGraph('arrow_up')} />
                      <ShapeItem icon="⬇" label="下箭头" onClick={() => handleAddGraph('arrow_down')} />
                      <ShapeItem icon="⬌" label="双向水平" onClick={() => handleAddGraph('double_arrow')} />
                      <ShapeItem icon="⬍" label="双向垂直" onClick={() => handleAddGraph('double_arrow_v')} />
                      <ShapeItem icon="[" label="左中括号" onClick={() => handleAddGraph('bracket_left')} />
                      <ShapeItem icon="]" label="右中括号" onClick={() => handleAddGraph('bracket_right')} />
                      <ShapeItem icon="{" label="左大括号" onClick={() => handleAddGraph('brace_left')} />
                      <ShapeItem icon="}" label="右大括号" onClick={() => handleAddGraph('brace_right')} />
                      <ShapeItem icon="⌐" label="拐角标尺" onClick={() => handleAddGraph('corner_bracket')} />
                      <ShapeItem icon="⟷" label="标注尺寸" onClick={() => handleAddGraph('dimension_line')} />
                    </div>
                  </div>
                )}

                {/* 3. Industrial & Safety */}
                {(graphCategory === 'all' || graphCategory === 'safety') && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                      包装与安全图标 (Industrial & Safety)
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <ShapeItem icon="⚠️" label="三角警示" onClick={() => handleAddGraph('hazard_triangle')} />
                      <ShapeItem icon="⊘" label="禁止标志" onClick={() => handleAddGraph('prohibition')} />
                      <ShapeItem icon="✚" label="医疗十字" onClick={() => handleAddGraph('cross')} />
                      <ShapeItem icon="🛡️" label="安全护盾" onClick={() => handleAddGraph('shield')} />
                      <ShapeItem icon="🏷️" label="吊牌形状" onClick={() => handleAddGraph('tag_shape')} />
                      <ShapeItem icon="💮" label="印章勋章" onClick={() => handleAddGraph('burst_seal')} />
                      <ShapeItem icon="🗨" label="对话气泡" onClick={() => handleAddGraph('speech_bubble')} />
                      <ShapeItem icon="📦" label="纸箱方块" onClick={() => handleAddGraph('cube')} />
                      <ShapeItem icon="🛢️" label="圆柱体" onClick={() => handleAddGraph('cylinder')} />
                    </div>
                  </div>
                )}

                {/* 4. Polygons & Stars */}
                {(graphCategory === 'all' || graphCategory === 'polygons') && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                      多边形与星形 (Polygons & Stars)
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <ShapeItem icon="△" label="正三角形" onClick={() => handleAddGraph('triangle')} />
                      <ShapeItem icon="▽" label="倒三角形" onClick={() => handleAddGraph('triangle_down')} />
                      <ShapeItem icon="▷" label="右向三角" onClick={() => handleAddGraph('triangle_right')} />
                      <ShapeItem icon="◇" label="菱形" onClick={() => handleAddGraph('diamond')} />
                      <ShapeItem icon="▱" label="平行四边形" onClick={() => handleAddGraph('parallelogram')} />
                      <ShapeItem icon="⏢" label="等腰梯形" onClick={() => handleAddGraph('trapezoid')} />
                      <ShapeItem icon="⬠" label="正五边形" onClick={() => handleAddGraph('pentagon')} />
                      <ShapeItem icon="⬡" label="正六边形" onClick={() => handleAddGraph('hexagon')} />
                      <ShapeItem icon="🛑" label="正八边形" onClick={() => handleAddGraph('octagon')} />
                      <ShapeItem icon="☆" label="五角星" onClick={() => handleAddGraph('star')} />
                      <ShapeItem icon="✦" label="四角星" onClick={() => handleAddGraph('star_4')} />
                      <ShapeItem icon="✡" label="六角星" onClick={() => handleAddGraph('star_6')} />
                      <ShapeItem icon="✷" label="八角星" onClick={() => handleAddGraph('star_8')} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6. Icon */}
        <ToolButton
          icon={<span className="text-base font-semibold">标</span>}
          title="工业图标"
          sub="Icon"
          onClick={onOpenIconPicker}
        />

        {/* 7. Table */}
        <ToolButton
          icon={<span className="text-base">田</span>}
          title="数据表格"
          sub="Table"
          onClick={handleAddTable}
        />

        {/* 8. Excel */}
        <ToolButton
          icon={<span className="text-base">📗</span>}
          title="数据源"
          sub="Excel / DB"
          onClick={onOpenDatabaseManager}
        />

        {/* 9. Recognize */}
        <ToolButton
          icon={<span className="text-base">🔍</span>}
          title="文字识别"
          sub="OCR"
          onClick={onOpenOcrModal}
        />

        {/* 10. Reverse */}
        <ToolButton
          icon={<span className="text-base">🌓</span>}
          title="区域反白"
          sub="Reverse"
          onClick={handleAddReverse}
        />
      </div>
    </aside>
  );
};

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
      onClick={onClick}
      className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white border border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-xs text-slate-700 transition-all cursor-pointer h-14 group"
    >
      <div className="group-hover:scale-110 transition-transform h-5 flex items-center justify-center">{icon}</div>
      <span className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-tight text-center">
        {title}
      </span>
      <span className="text-[9px] text-slate-400 font-sans leading-none text-center">
        {sub}
      </span>
    </button>
  );
}

function ShapeItem({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 flex flex-col items-center justify-center rounded-md border border-slate-100 hover:border-sky-300 hover:bg-sky-50/60 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer text-center"
    >
      <span className="text-sm font-bold">{icon}</span>
      <span className="text-[10px] mt-0.5 font-medium leading-tight text-slate-600">{label}</span>
    </button>
  );
}
