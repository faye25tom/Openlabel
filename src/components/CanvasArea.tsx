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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
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
        onUpdateElementBounds(el.id, Math.max(0, nx), Math.max(0, ny), el.widthMm, el.heightMm);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, project.elements, onDeleteElement, onUpdateElementBounds]);

  // Center paper in viewport
  const paperWidthPx = paper.widthMm * pxPerMm;
  const paperHeightPx = paper.heightMm * pxPerMm;

  const rulerThickness = 20;
  const usableWidth = Math.max(100, containerSize.width - rulerThickness);
  const usableHeight = Math.max(100, containerSize.height - rulerThickness);

  const paperOriginX = Math.max(20, Math.round((usableWidth - paperWidthPx) / 2));
  const paperOriginY = Math.max(20, Math.round((usableHeight - paperHeightPx) / 2));

  // Mouse move handler for tracking cursor in mm
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rulerThickness;
    const mouseY = e.clientY - rect.top - rulerThickness;

    const xMm = (mouseX - paperOriginX) / pxPerMm;
    const yMm = (mouseY - paperOriginY) / pxPerMm;
    onCursorMove(Number(xMm.toFixed(2)), Number(yMm.toFixed(2)));

    // Drag move / resize active
    if (dragState) {
      const deltaX = (e.clientX - dragState.startX) / pxPerMm;
      const deltaY = (e.clientY - dragState.startY) / pxPerMm;

      if (dragState.type === 'move') {
        const newX = Math.max(0, Number((dragState.origX + deltaX).toFixed(1)));
        const newY = Math.max(0, Number((dragState.origY + deltaY).toFixed(1)));
        onUpdateElementBounds(dragState.elId, newX, newY, dragState.origW, dragState.origH);
      } else if (dragState.type === 'resize' && dragState.handle) {
        let newX = dragState.origX;
        let newY = dragState.origY;
        let newW = dragState.origW;
        let newH = dragState.origH;

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
        onUpdateElementBounds(
          dragState.elId,
          Number(newX.toFixed(1)),
          Number(newY.toFixed(1)),
          Number(newW.toFixed(1)),
          Number(newH.toFixed(1))
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState) {
      setDragState(null);
    }
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
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-board') {
          onSelectElement(null);
        }
      }}
    >
      {/* Top Ruler */}
      <div
        className="absolute top-0 left-5 right-0 z-20 overflow-hidden"
        style={{ height: rulerThickness }}
      >
        <Ruler
          orientation="horizontal"
          lengthPx={usableWidth}
          offsetPx={paperOriginX}
          pxPerMm={pxPerMm}
        />
      </div>

      {/* Left Ruler */}
      <div
        className="absolute top-5 left-0 bottom-0 z-20 overflow-hidden"
        style={{ width: rulerThickness }}
      >
        <Ruler
          orientation="vertical"
          lengthPx={usableHeight}
          offsetPx={paperOriginY}
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

      {/* Main Board Viewport */}
      <div
        id="canvas-board"
        className="absolute inset-0 pt-5 pl-5 overflow-auto flex items-start justify-start"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Label Paper Wrapper */}
        <div
          className="relative transition-shadow duration-150"
          style={{
            transform: `translate(${paperOriginX}px, ${paperOriginY}px) rotate(${paper.rotationDeg}deg)`,
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
                    {renderElementContent(el, evalCtx, pxPerMm)}
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

function renderElementContent(el: LabelElement, ctx: EvalContext, pxPerMm: number) {
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
            format={el.kind.symbology.toUpperCase()}
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
        <div className="w-full h-full p-0.5">
          <QrCodeRenderer value={content} errorCorrection={el.kind.errorCorrection} />
        </div>
      );
    }

    case 'graph': {
      const strokeW = Math.max(1, el.kind.lineThicknessMm * pxPerMm);
      if (el.kind.shape === 'line') {
        return (
          <div
            className="w-full"
            style={{
              height: `${strokeW}px`,
              backgroundColor: el.kind.strokeColor || '#000000',
            }}
          />
        );
      }
      if (el.kind.shape === 'circle') {
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              border: `${strokeW}px solid ${el.kind.strokeColor || '#000000'}`,
              backgroundColor: el.kind.filled ? el.kind.fillColor : 'transparent',
            }}
          />
        );
      }
      return (
        <div
          className="w-full h-full"
          style={{
            border: `${strokeW}px solid ${el.kind.strokeColor || '#000000'}`,
            backgroundColor: el.kind.filled ? el.kind.fillColor : 'transparent',
          }}
        />
      );
    }

    case 'table': {
      const rows = el.kind.rows || 3;
      const cols = el.kind.cols || 2;
      return (
        <table className="w-full h-full border-collapse border border-black text-[10px]">
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-black last:border-b-0">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="border-r border-black last:border-r-0 p-0.5 text-center text-slate-800">
                    {el.kind.type === 'table' && el.kind.cells?.[r]?.[c] ? el.kind.cells[r][c] : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
