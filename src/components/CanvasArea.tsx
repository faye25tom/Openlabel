import React, { useRef, useState, useEffect } from 'react';
import { LabelElement, LabelProject, PromptConfig } from '../types/model';
import { EvalContext, evaluateSegments } from '../engine/evaluator';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QrCodeRenderer } from './QrCodeRenderer';
import { Ruler } from './Ruler';

interface CanvasAreaProps {
  project: LabelProject;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementBounds: (id: string, xMm: number, yMm: number, widthMm: number, heightMm: number) => void;
  onDeleteElement: (id: string) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onCursorMove: (xMm: number, yMm: number) => void;
  onUpdateTableCell?: (elId: string, r: number, c: number, text: string) => void;
}

const BASE_PPM = 4.0; // 4 screen pixels per mm at 1.0 zoom

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  project,
  selectedElementId,
  onSelectElement,
  onUpdateElementBounds,
  onDeleteElement,
  zoom,
  onZoomChange,
  onCursorMove,
  onUpdateTableCell,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [editingCell, setEditingCell] = useState<{ elId: string; r: number; c: number } | null>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize';
    handle?: string;
    elId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const pxPerMm = BASE_PPM * zoom;
  const paper = project.paper;

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Keyboard navigation & deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const el = project.elements.find((e) => e.id === selectedElementId);
      if (!el || el.locked) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteElement(selectedElementId);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 2.0 : 0.5;
        let nx = el.xMm;
        let ny = el.yMm;
        if (e.key === 'ArrowLeft') nx -= step;
        if (e.key === 'ArrowRight') nx += step;
        if (e.key === 'ArrowUp') ny -= step;
        if (e.key === 'ArrowDown') ny += step;
        onUpdateElementBounds(el.id, Number(nx.toFixed(1)), Number(ny.toFixed(1)), el.widthMm, el.heightMm);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, project.elements, onDeleteElement, onUpdateElementBounds]);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  // Center paper in viewport with pasteboard workspace margin
  const paperWidthPx = paper.widthMm * pxPerMm;
  const paperHeightPx = paper.heightMm * pxPerMm;

  const rulerThickness = 20;
  const usableWidth = Math.max(100, containerSize.width - rulerThickness);
  const usableHeight = Math.max(100, containerSize.height - rulerThickness);

  // Dynamic workspace pasteboard margins so negative coordinates are fully scrollable and visible
  const minElementX = Math.min(0, ...project.elements.map((e) => e.xMm));
  const minElementY = Math.min(0, ...project.elements.map((e) => e.yMm));
  const maxElementX = Math.max(paper.widthMm, ...project.elements.map((e) => e.xMm + e.widthMm));
  const maxElementY = Math.max(paper.heightMm, ...project.elements.map((e) => e.yMm + e.heightMm));

  const marginMmX = Math.max(120, Math.abs(minElementX) + 50);
  const marginMmY = Math.max(120, Math.abs(minElementY) + 50);

  const marginPxX = marginMmX * pxPerMm;
  const marginPxY = marginMmY * pxPerMm;

  const totalContentWidth = (paper.widthMm + marginMmX * 2) * pxPerMm;
  const totalContentHeight = (paper.heightMm + marginMmY * 2) * pxPerMm;

  const extraPadX = Math.max(0, (usableWidth - totalContentWidth) / 2);
  const extraPadY = Math.max(0, (usableHeight - totalContentHeight) / 2);

  const paperOriginX = extraPadX + marginPxX;
  const paperOriginY = extraPadY + marginPxY;

  // Track canvas board scroll position for ruler alignment
  const handleBoardScroll = () => {
    if (boardRef.current) {
      setScrollPos({
        left: boardRef.current.scrollLeft,
        top: boardRef.current.scrollTop,
      });
    }
  };

  // Center paper on initial load or paper dimension / zoom change
  const centeredKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${paper.widthMm}x${paper.heightMm}@${zoom}`;
    if (boardRef.current && centeredKeyRef.current !== key) {
      centeredKeyRef.current = key;
      const targetX = Math.max(0, paperOriginX - (usableWidth - paperWidthPx) / 2);
      const targetY = Math.max(0, paperOriginY - (usableHeight - paperHeightPx) / 2);
      boardRef.current.scrollLeft = targetX;
      boardRef.current.scrollTop = targetY;
      setScrollPos({ left: targetX, top: targetY });
    }
  }, [paperOriginX, paperOriginY, usableWidth, usableHeight, paperWidthPx, paperHeightPx, zoom]);

  // Window listeners for smooth unrestricted drag & resize even across rulers or negative coords
  useEffect(() => {
    if (!dragState) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragState.startX) / pxPerMm;
      const deltaY = (e.clientY - dragState.startY) / pxPerMm;

      if (dragState.type === 'move') {
        const newX = Number((dragState.origX + deltaX).toFixed(1));
        const newY = Number((dragState.origY + deltaY).toFixed(1));
        onUpdateElementBounds(dragState.elId, newX, newY, dragState.origW, dragState.origH);
      } else if (dragState.type === 'resize' && dragState.handle) {
        let newX = dragState.origX;
        let newY = dragState.origY;
        let newW = dragState.origW;
        let newH = dragState.origH;

        const targetEl = project.elements.find((e) => e.id === dragState.elId);
        const shouldLockRatio =
          targetEl?.kind.type === 'qrcode'
            ? targetEl.kind.codeType !== 'PDF_417' && targetEl.kind.lockAspectRatio !== false
            : false;

        if (shouldLockRatio && ['nw', 'ne', 'se', 'sw'].includes(dragState.handle)) {
          // Proportional 1:1 resize for square 2D barcode symbols
          const dominantDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
          if (dragState.handle === 'se') {
            const side = Math.max(4, Number((dragState.origW + dominantDelta).toFixed(1)));
            newW = side;
            newH = side;
          } else if (dragState.handle === 'sw') {
            const side = Math.max(4, Number((dragState.origW - deltaX).toFixed(1)));
            newW = side;
            newH = side;
            newX = Number((dragState.origX + (dragState.origW - side)).toFixed(1));
          } else if (dragState.handle === 'ne') {
            const side = Math.max(4, Number((dragState.origW + deltaX).toFixed(1)));
            newW = side;
            newH = side;
            newY = Number((dragState.origY + (dragState.origH - side)).toFixed(1));
          } else if (dragState.handle === 'nw') {
            const side = Math.max(4, Number((dragState.origW - dominantDelta).toFixed(1)));
            newW = side;
            newH = side;
            newX = Number((dragState.origX + (dragState.origW - side)).toFixed(1));
            newY = Number((dragState.origY + (dragState.origH - side)).toFixed(1));
          }
        } else {
          if (dragState.handle.includes('e')) {
            newW = Math.max(3, dragState.origW + deltaX);
          }
          if (dragState.handle.includes('s')) {
            newH = Math.max(3, dragState.origH + deltaY);
          }
          if (dragState.handle.includes('w')) {
            const potW = dragState.origW - deltaX;
            if (potW >= 3) {
              newW = potW;
              newX = dragState.origX + deltaX;
            }
          }
          if (dragState.handle.includes('n')) {
            const potH = dragState.origH - deltaY;
            if (potH >= 3) {
              newH = potH;
              newY = dragState.origY + deltaY;
            }
          }
        }
        onUpdateElementBounds(
          dragState.elId,
          Number(newX.toFixed(1)),
          Number(newY.toFixed(1)),
          Number(newW.toFixed(1)),
          Number(newH.toFixed(1))
        );
      }
    };

    const handleWindowMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, pxPerMm, project.elements, onUpdateElementBounds]);

  // Mouse move handler for tracking cursor in mm
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curScrollX = boardRef.current ? boardRef.current.scrollLeft : scrollPos.left;
    const curScrollY = boardRef.current ? boardRef.current.scrollTop : scrollPos.top;

    const mouseScreenX = e.clientX - rect.left - rulerThickness;
    const mouseScreenY = e.clientY - rect.top - rulerThickness;

    const mouseCanvasX = mouseScreenX + curScrollX;
    const mouseCanvasY = mouseScreenY + curScrollY;

    const xMm = (mouseCanvasX - paperOriginX) / pxPerMm;
    const yMm = (mouseCanvasY - paperOriginY) / pxPerMm;
    onCursorMove(Number(xMm.toFixed(2)), Number(yMm.toFixed(2)));
  };

  // Evaluation context for current record preview
  const evalCtx: EvalContext = {
    labelSequenceIndex: 0,
    dbRowIndex: project.currentRecordIndex || 0,
    table: project.database,
    fixedNow: new Date(),
    sharedOverrides: project.sharedFields,
  };

  const selectedElement = project.elements.find((e) => e.id === selectedElementId);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden bg-[#d5d7db] select-none cursor-default"
      onMouseMove={handleMouseMove}
      onClick={(e) => {
        if (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-board' || (e.target as HTMLElement).id === 'canvas-pasteboard') {
          onSelectElement(null);
        }
      }}
    >
      {/* Top Ruler with scroll offset tracking */}
      <div
        className="absolute top-0 left-5 right-0 z-20 overflow-hidden pointer-events-none"
        style={{ height: rulerThickness }}
      >
        <Ruler
          orientation="horizontal"
          lengthPx={usableWidth}
          offsetPx={paperOriginX - scrollPos.left}
          pxPerMm={pxPerMm}
        />
      </div>

      {/* Left Ruler with scroll offset tracking */}
      <div
        className="absolute top-5 left-0 bottom-0 z-20 overflow-hidden pointer-events-none"
        style={{ width: rulerThickness }}
      >
        <Ruler
          orientation="vertical"
          lengthPx={usableHeight}
          offsetPx={paperOriginY - scrollPos.top}
          pxPerMm={pxPerMm}
        />
      </div>

      {/* Top-Left Unit Box */}
      <div
        className="absolute top-0 left-0 z-30 flex items-center justify-center bg-[#e2e8f0] border-r border-b border-[#cbd5e1] text-[10px] font-mono text-slate-600 font-semibold"
        style={{ width: rulerThickness, height: rulerThickness }}
      >
        mm
      </div>

      {/* Main Board Viewport with Smooth Pasteboard Scrolling */}
      <div
        id="canvas-board"
        ref={boardRef}
        onScroll={handleBoardScroll}
        className="absolute inset-0 pt-5 pl-5 overflow-auto"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Pasteboard Container accommodating negative and positive space */}
        <div
          id="canvas-pasteboard"
          style={{
            width: Math.max(usableWidth, totalContentWidth),
            height: Math.max(usableHeight, totalContentHeight),
            position: 'relative',
          }}
        >
          {/* Label Paper Wrapper */}
          <div
            className="transition-shadow duration-150"
            style={{
              position: 'absolute',
              left: paperOriginX,
              top: paperOriginY,
              transform: `rotate(${paper.rotationDeg}deg)`,
              transformOrigin: 'top left',
              width: paperWidthPx,
              height: paperHeightPx,
            }}
          >
          {/* Paper Background with Shape and Shadow */}
          <div
            className={`w-full h-full shadow-[0_4px_24px_rgba(0,0,0,0.18)] border border-slate-300 transition-colors ${
              paper.shape === 'sharp'
                ? 'rounded-none'
                : paper.shape === 'ellipse'
                ? 'rounded-full'
                : 'rounded-xl'
            }`}
            style={{ backgroundColor: paper.backgroundHex || '#ffffff' }}
          >
            {/* Multi-column divider lines if columns > 1 */}
            {paper.columns > 1 && (
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: paper.columns - 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-full border-r border-dashed border-sky-300 opacity-60"
                    style={{ width: `${100 / paper.columns}%` }}
                  />
                ))}
              </div>
            )}

            {/* Elements Layer */}
            {project.elements.map((el) => {
              const isSelected = el.id === selectedElementId;
              const elLeftPx = el.xMm * pxPerMm;
              const elTopPx = el.yMm * pxPerMm;
              const elWidthPx = el.widthMm * pxPerMm;
              const elHeightPx = el.heightMm * pxPerMm;

              return (
                <div
                  key={el.id}
                  className={`absolute group cursor-move select-none ${
                    isSelected ? 'z-30' : 'z-10'
                  }`}
                  style={{
                    left: elLeftPx,
                    top: elTopPx,
                    width: elWidthPx,
                    height: elHeightPx,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelectElement(el.id);
                    if (!el.locked) {
                      setDragState({
                        type: 'move',
                        elId: el.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        origX: el.xMm,
                        origY: el.yMm,
                        origW: el.widthMm,
                        origH: el.heightMm,
                      });
                    }
                  }}
                >
                  {/* Element Visual Content */}
                  <div className="w-full h-full relative overflow-hidden flex items-center">
                    {renderElementContent(
                      el,
                      evalCtx,
                      pxPerMm,
                      isSelected,
                      editingCell,
                      setEditingCell,
                      onUpdateTableCell
                    )}
                  </div>
                  {/* Selection Border & Resize Handles */}
                  {isSelected && (
                    <div className="absolute -inset-[2px] border-2 border-sky-500 pointer-events-none">
                      {!el.locked && (
                        <>
                          {/* 8 resize handle grips */}
                          {[
                            { pos: 'nw', class: '-top-1.5 -left-1.5 cursor-nwse-resize' },
                            { pos: 'n', class: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                            { pos: 'ne', class: '-top-1.5 -right-1.5 cursor-nesw-resize' },
                            { pos: 'e', class: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize' },
                            { pos: 'se', class: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
                            { pos: 's', class: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                            { pos: 'sw', class: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
                            { pos: 'w', class: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize' },
                          ].map((handle) => (
                            <div
                              key={handle.pos}
                              className={`absolute w-2.5 h-2.5 bg-white border border-sky-600 pointer-events-auto rounded-[1px] shadow-xs ${handle.class}`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragState({
                                  type: 'resize',
                                  handle: handle.pos,
                                  elId: el.id,
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  origX: el.xMm,
                                  origY: el.yMm,
                                  origW: el.widthMm,
                                  origH: el.heightMm,
                                });
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {/* Floating Zoom Capsule */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200 text-xs text-slate-700">
        <button
          onClick={() => onZoomChange(Math.max(0.4, Number((zoom - 0.1).toFixed(1))))}
          className="w-6 h-6 flex items-center justify-center font-bold hover:bg-slate-100 rounded cursor-pointer transition-colors"
          title="Zoom Out"
        >
          -
        </button>
        <span className="w-12 text-center font-mono font-medium">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(Math.min(3.0, Number((zoom + 0.1).toFixed(1))))}
          className="w-6 h-6 flex items-center justify-center font-bold hover:bg-slate-100 rounded cursor-pointer transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => onZoomChange(1.0)}
          className="ml-1 px-1.5 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
        >
          100%
        </button>
      </div>
    </div>
  );
};

function renderElementContent(
  el: LabelElement,
  ctx: EvalContext,
  pxPerMm: number,
  isSelected?: boolean,
  editingCell?: { elId: string; r: number; c: number } | null,
  setEditingCell?: React.Dispatch<React.SetStateAction<{ elId: string; r: number; c: number } | null>>,
  onUpdateTableCell?: (elId: string, r: number, c: number, text: string) => void
) {
  switch (el.kind.type) {
    case 'text': {
      const text = evaluateSegments(el.kind.segments, ctx);
      const font = el.kind.font;
      const fontPx = Math.max(9, (font.sizePt * 25.4) / 72 * pxPerMm);

      const alignClass =
        font.align === 'center'
          ? 'text-center justify-center'
          : font.align === 'right'
          ? 'text-right justify-end'
          : font.align === 'distribute'
          ? 'text-justify justify-between'
          : 'text-left justify-start';

      return (
        <div
          className={`w-full h-full flex items-center p-0.5 leading-tight ${alignClass} ${
            font.reverseVideo ? 'bg-black text-white' : 'text-black'
          }`}
          style={{
            fontFamily: font.family,
            fontSize: `${fontPx}px`,
            fontWeight: font.bold ? 700 : 400,
            fontStyle: font.italic ? 'italic' : 'normal',
            textDecoration: `${font.underline ? 'underline' : ''} ${
              font.strikethrough ? 'line-through' : ''
            }`.trim() || undefined,
            letterSpacing: `${(font.wordSpacePt || 0) * 0.5}px`,
            transform: `${font.mirrorHorizontal ? 'scaleX(-1) ' : ''}scaleX(${
              (font.scalePercent || 100) / 100
            })`,
            writingMode: font.direction === 'vertical' ? 'vertical-rl' : undefined,
          }}
        >
          {font.direction === 'arc' ? (
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <path id={`path-${el.id}`} d="M 5,35 Q 50,5 95,35" fill="none" />
              <text fontSize="12" fill={font.reverseVideo ? '#fff' : '#000'} textAnchor="middle">
                <textPath href={`#path-${el.id}`} startOffset="50%">
                  {text}
                </textPath>
              </text>
            </svg>
          ) : font.align === 'distribute' && font.direction === 'horizontal' ? (
            <div className="w-full flex justify-between">
              {text.split('').map((char, i) => (
                <span key={i}>{char}</span>
              ))}
            </div>
          ) : (
            <span className="truncate block w-full">{text || '(Empty Text)'}</span>
          )}
        </div>
      );
    }

    case 'barcode': {
      const code = evaluateSegments(el.kind.segments, ctx);
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <BarcodeRenderer
            value={code}
            format={el.kind.symbology}
            showText={el.kind.showHumanReadable}
            width={el.widthMm * pxPerMm}
            height={el.heightMm * pxPerMm}
          />
        </div>
      );
    }

    case 'qrcode': {
      const content = evaluateSegments(el.kind.segments, ctx);
      return (
        <div className="w-full h-full flex items-center justify-center p-0.5 select-none">
          <QrCodeRenderer
            value={content}
            codeType={el.kind.codeType}
            errorCorrection={el.kind.errorCorrection}
            cellWidthDots={el.kind.cellWidthDots}
            scalePercent={el.kind.scalePercent ?? 100}
            marginModules={el.kind.marginModules ?? 1}
          />
        </div>
      );
    }

    case 'graph': {
      const strokeW = Math.max(1, el.kind.lineThicknessMm * pxPerMm);
      const strokeColor = el.kind.strokeColor || '#000000';
      const fillColor = el.kind.filled ? el.kind.fillColor || '#ffffff' : 'none';
      const dashArray =
        el.kind.lineStyle === 'dashed'
          ? '8,4'
          : el.kind.lineStyle === 'dotted'
          ? '2,3'
          : undefined;

      return (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          {renderGraphSvg(el.kind.shape, strokeW, strokeColor, fillColor, dashArray, el.kind.cornerRadiusMm)}
        </svg>
      );
    }

    case 'table': {
      const rows = el.kind.rows || 3;
      const cols = el.kind.cols || 2;
      const fontPx = Math.max(8, ((el.kind.fontSizePt || 8) * 25.4) / 72 * pxPerMm);
      const align = el.kind.align || 'center';
      const bColor = el.kind.borderColor || '#000000';
      const strokeW = Math.max(1, Math.round(el.kind.lineThicknessMm * pxPerMm));

      return (
        <div className="w-full h-full relative group/tbl">
          <table
            className="w-full h-full border-collapse"
            style={{
              fontSize: `${fontPx}px`,
              border: `${strokeW}px solid ${bColor}`,
            }}
          >
            <tbody>
              {Array.from({ length: rows }).map((_, r) => {
                const isHeader = r === 0 && (el.kind.type === 'table' && el.kind.headerRow);
                return (
                  <tr
                    key={r}
                    style={{ borderBottom: `${strokeW}px solid ${bColor}` }}
                    className={isHeader ? 'bg-slate-100/90 font-bold' : ''}
                  >
                    {Array.from({ length: cols }).map((_, c) => {
                      const cellVal =
                        el.kind.type === 'table' && el.kind.cells?.[r]?.[c] ? el.kind.cells[r][c] : '';
                      const isCellEditing =
                        editingCell?.elId === el.id && editingCell?.r === r && editingCell?.c === c;

                      return (
                        <td
                          key={c}
                          style={{
                            borderRight: `${strokeW}px solid ${bColor}`,
                            textAlign: align,
                          }}
                          onMouseDown={(e) => {
                            // Prevent dragging the whole element when clicking inside a table cell to edit
                            if (isSelected) {
                              e.stopPropagation();
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingCell?.({ elId: el.id, r, c });
                          }}
                          onClick={(e) => {
                            if (isSelected) {
                              e.stopPropagation();
                              setEditingCell?.({ elId: el.id, r, c });
                            }
                          }}
                          className={`p-1 text-slate-800 transition-colors select-text ${
                            isSelected ? 'hover:bg-sky-50/80 cursor-text' : ''
                          }`}
                        >
                          {isCellEditing ? (
                            <input
                              type="text"
                              autoFocus
                              defaultValue={cellVal}
                              onMouseDown={(e) => e.stopPropagation()}
                              onBlur={(e) => {
                                onUpdateTableCell?.(el.id, r, c, e.target.value);
                                setEditingCell?.(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onUpdateTableCell?.(el.id, r, c, (e.target as HTMLInputElement).value);
                                  setEditingCell?.(null);
                                }
                              }}
                              className="w-full h-full px-1 py-0.5 bg-white border border-sky-500 rounded outline-none text-slate-900 shadow-xs"
                            />
                          ) : (
                            <span className="truncate block w-full">
                              {cellVal || (isSelected ? <span className="text-slate-300">...</span> : '')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isSelected && (
            <div className="absolute -bottom-5 left-0 text-[10px] text-sky-700 bg-white/95 px-1.5 py-0.5 rounded shadow-xs border border-sky-200 pointer-events-none whitespace-nowrap z-40">
              ✏️ Double-click cell to edit text
            </div>
          )}
        </div>
      );
    }

    case 'reverse': {
      return (
        <div className="w-full h-full bg-black/85 flex items-center justify-center text-white text-[10px] font-mono select-none">
          REVERSE
        </div>
      );
    }

    case 'icon': {
      return (
        <div className="w-full h-full flex items-center justify-center p-1 text-slate-800">
          <IndustrialIcon name={el.kind.iconName} color={el.kind.color} />
        </div>
      );
    }

    case 'image': {
      return (
        <img
          src={el.kind.src}
          alt={el.name}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      );
    }

    default:
      return <div className="text-xs text-slate-400">Element</div>;
  }
}

function renderGraphSvg(
  shape: string,
  strokeW: number,
  strokeColor: string,
  fillColor: string,
  dashArray?: string,
  cornerRadiusMm?: number
) {
  const commonProps = {
    stroke: strokeColor,
    strokeWidth: strokeW,
    strokeDasharray: dashArray,
    fill: fillColor,
    vectorEffect: 'non-scaling-stroke' as const,
  };

  switch (shape) {
    // Basic Shapes
    case 'rectangle':
      return <rect x="2" y="2" width="96" height="96" {...commonProps} />;

    case 'rounded_rect': {
      const rx = Math.max(4, Math.min(45, (cornerRadiusMm || 3) * 4));
      return <rect x="2" y="2" width="96" height="96" rx={rx} ry={rx} {...commonProps} />;
    }

    case 'circle':
      return <ellipse cx="50" cy="50" rx="46" ry="46" {...commonProps} />;

    case 'ellipse':
      return <ellipse cx="50" cy="50" rx="47" ry="32" {...commonProps} />;

    case 'capsule':
      return (
        <rect
          x="3"
          y="15"
          width="94"
          height="70"
          rx="35"
          ry="35"
          {...commonProps}
        />
      );

    case 'snip_corner_rect': {
      const c = Math.max(6, Math.min(30, (cornerRadiusMm || 4) * 3));
      const p = `${c},2 ${100 - c},2 98,${c} 98,${100 - c} ${100 - c},98 ${c},98 2,${100 - c} 2,${c}`;
      return <polygon points={p} {...commonProps} strokeLinejoin="round" />;
    }

    // Lines & Arrows
    case 'line':
      return <line x1="0" y1="50" x2="100" y2="50" {...commonProps} strokeLinecap="round" />;

    case 'vertical_line':
      return <line x1="50" y1="0" x2="50" y2="100" {...commonProps} strokeLinecap="round" />;

    case 'diagonal_line_up':
      return <line x1="4" y1="96" x2="96" y2="4" {...commonProps} strokeLinecap="round" />;

    case 'diagonal_line_down':
      return <line x1="4" y1="4" x2="96" y2="96" {...commonProps} strokeLinecap="round" />;

    case 'arrow':
    case 'arrow_right':
      return (
        <g {...commonProps}>
          <line x1="4" y1="50" x2="82" y2="50" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="78,32 98,50 78,68" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'arrow_left':
      return (
        <g {...commonProps}>
          <polygon points="22,32 2,50 22,68" fill={strokeColor} stroke="none" />
          <line x1="18" y1="50" x2="96" y2="50" strokeWidth={strokeW} strokeLinecap="round" />
        </g>
      );

    case 'arrow_up':
      return (
        <g {...commonProps}>
          <polygon points="32,22 50,2 68,22" fill={strokeColor} stroke="none" />
          <line x1="50" y1="18" x2="50" y2="96" strokeWidth={strokeW} strokeLinecap="round" />
        </g>
      );

    case 'arrow_down':
      return (
        <g {...commonProps}>
          <line x1="50" y1="4" x2="50" y2="82" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="32,78 50,98 68,78" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'double_arrow':
      return (
        <g {...commonProps}>
          <polygon points="20,32 2,50 20,68" fill={strokeColor} stroke="none" />
          <line x1="18" y1="50" x2="82" y2="50" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="80,32 98,50 80,68" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'double_arrow_v':
      return (
        <g {...commonProps}>
          <polygon points="32,20 50,2 68,20" fill={strokeColor} stroke="none" />
          <line x1="50" y1="18" x2="50" y2="82" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="32,80 50,98 68,80" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'bracket_left':
      return <path d="M 70 6 L 30 6 L 30 94 L 70 94" {...commonProps} fill="none" strokeLinecap="square" />;

    case 'bracket_right':
      return <path d="M 30 6 L 70 6 L 70 94 L 30 94" {...commonProps} fill="none" strokeLinecap="square" />;

    case 'brace_left':
      return (
        <path
          d="M 65 6 C 45 6 45 35 30 50 C 45 65 45 94 65 94"
          {...commonProps}
          fill="none"
          strokeLinecap="round"
        />
      );

    case 'brace_right':
      return (
        <path
          d="M 35 6 C 55 6 55 35 70 50 C 55 65 55 94 35 94"
          {...commonProps}
          fill="none"
          strokeLinecap="round"
        />
      );

    case 'corner_bracket':
      return <path d="M 20 80 L 80 80 L 80 20" {...commonProps} fill="none" strokeLinecap="round" strokeLinejoin="round" />;

    case 'dimension_line':
      return (
        <g {...commonProps}>
          {/* Left stop tick */}
          <line x1="4" y1="25" x2="4" y2="75" strokeWidth={strokeW} />
          {/* Right stop tick */}
          <line x1="96" y1="25" x2="96" y2="75" strokeWidth={strokeW} />
          {/* Center line with double arrows */}
          <line x1="6" y1="50" x2="94" y2="50" strokeWidth={strokeW} />
          <polygon points="18,42 6,50 18,58" fill={strokeColor} stroke="none" />
          <polygon points="82,42 94,50 82,58" fill={strokeColor} stroke="none" />
        </g>
      );

    // Industrial, Safety & Packaging
    case 'hazard_triangle':
      return (
        <g {...commonProps}>
          <polygon points="50,6 96,94 4,94" strokeLinejoin="round" />
          <line x1="50" y1="36" x2="50" y2="66" stroke={strokeColor} strokeWidth={Math.max(2, strokeW * 1.5)} strokeLinecap="round" />
          <circle cx="50" cy="78" r={Math.max(2, strokeW)} fill={strokeColor} stroke="none" />
        </g>
      );

    case 'prohibition':
      return (
        <g {...commonProps}>
          <circle cx="50" cy="50" r="44" />
          <line x1="19" y1="19" x2="81" y2="81" strokeWidth={strokeW} />
        </g>
      );

    case 'cross':
      return (
        <polygon
          points="35,4 65,4 65,35 96,35 96,65 65,65 65,96 35,96 35,65 4,65 4,35 35,35"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'shield':
      return (
        <path
          d="M 50 6 L 94 20 C 94 62 65 88 50 94 C 35 88 6 62 6 20 Z"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'tag_shape':
      return (
        <g {...commonProps}>
          <polygon points="26,4 74,4 96,26 96,96 4,96 4,26" strokeLinejoin="round" />
          <circle cx="50" cy="20" r="6" fill="#ffffff" stroke={strokeColor} strokeWidth={strokeW} />
        </g>
      );

    case 'burst_seal': {
      // 12-point seal / badge
      const points = [];
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 12 - Math.PI / 2;
        const r = i % 2 === 0 ? 46 : 38;
        points.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
      }
      return <polygon points={points.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    case 'speech_bubble':
      return (
        <path
          d="M 12 8 L 88 8 C 94 8 96 10 96 16 L 96 68 C 96 74 94 76 88 76 L 36 76 L 16 94 L 20 76 L 12 76 C 6 76 4 74 4 68 L 4 16 C 4 10 6 8 12 8 Z"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'cylinder':
      return (
        <g {...commonProps}>
          <ellipse cx="50" cy="22" rx="42" ry="16" />
          <line x1="8" y1="22" x2="8" y2="78" strokeWidth={strokeW} />
          <line x1="92" y1="22" x2="92" y2="78" strokeWidth={strokeW} />
          <path d="M 8 78 C 8 94 92 94 92 78" fill="none" strokeWidth={strokeW} />
        </g>
      );

    case 'cube':
      return (
        <g {...commonProps}>
          {/* Top isometric face */}
          <polygon points="50,4 92,26 50,48 8,26" strokeLinejoin="round" />
          {/* Left face */}
          <polygon points="8,26 50,48 50,96 8,74" strokeLinejoin="round" />
          {/* Right face */}
          <polygon points="50,48 92,26 92,74 50,96" strokeLinejoin="round" />
        </g>
      );

    // Polygons & Stars
    case 'triangle':
      return <polygon points="50,6 96,94 4,94" {...commonProps} strokeLinejoin="round" />;

    case 'triangle_down':
      return <polygon points="4,6 96,6 50,94" {...commonProps} strokeLinejoin="round" />;

    case 'triangle_right':
      return <polygon points="6,4 6,96 94,50" {...commonProps} strokeLinejoin="round" />;

    case 'diamond':
      return <polygon points="50,4 96,50 50,96 4,50" {...commonProps} strokeLinejoin="round" />;

    case 'parallelogram':
      return <polygon points="26,6 96,6 74,94 4,94" {...commonProps} strokeLinejoin="round" />;

    case 'trapezoid':
      return <polygon points="22,6 78,6 96,94 4,94" {...commonProps} strokeLinejoin="round" />;

    case 'pentagon': {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        pts.push(`${50 + 46 * Math.cos(a)},${50 + 46 * Math.sin(a)}`);
      }
      return <polygon points={pts.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    case 'hexagon':
      return (
        <polygon
          points="25,4 75,4 97,50 75,96 25,96 3,50"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'octagon':
      return (
        <polygon
          points="28,4 72,4 96,28 96,72 72,96 28,96 4,72 4,28"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'star': {
      // 5-point star
      return (
        <polygon
          points="50,4 64,34 97,36 72,59 79,93 50,74 21,93 28,59 3,36 36,34"
          {...commonProps}
          strokeLinejoin="round"
        />
      );
    }

    case 'star_4':
      return (
        <polygon
          points="50,4 61,39 96,50 61,61 50,96 39,61 4,50 39,39"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'star_6': {
      // 6-point star (Star of David)
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6 - Math.PI / 2;
        const r = i % 2 === 0 ? 46 : 24;
        pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
      }
      return <polygon points={pts.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    case 'star_8': {
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8 - Math.PI / 2;
        const r = i % 2 === 0 ? 46 : 26;
        pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
      }
      return <polygon points={pts.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    default:
      return <rect x="2" y="2" width="96" height="96" {...commonProps} />;
  }
}

function IndustrialIcon({ name, color = '#000000' }: { name: string; color?: string }) {
  switch (name) {
    case 'fragile':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth="2">
          <path d="M12 2v6m-4-6h8M6 8l3 12h6l3-12H6z" />
          <path d="M9 11l3 3-2 3" />
        </svg>
      );
    case 'this-side-up':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth="2">
          <path d="M12 3v14m-5-9 5-5 5 5M4 21h16" />
        </svg>
      );
    case 'ce':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth="2">
          <path d="M10 6a7 7 0 1 0 0 12M21 7a6.5 6.5 0 0 0-7 5 6.5 6.5 0 0 0 7 5m-6-5h4" />
        </svg>
      );
    case 'rohs':
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-6" />
        </svg>
      );
    case 'warning':
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke={color} strokeWidth="2">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
}
