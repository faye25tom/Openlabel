import React, { useEffect, useRef, useState } from 'react';
import { Lock, Minus, Plus, RotateCcw } from 'lucide-react';
import { LabelProject } from '../../types/model';
import { EvalContext } from '../../engine/evaluator';
import { ElementRenderer } from './ElementRenderer';
import { RULER_THICKNESS, Ruler } from './Ruler';

interface CanvasAreaProps {
  project: LabelProject;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementBounds: (
    id: string,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
  ) => void;
  onUpdateElementBoundsTransient: (
    id: string,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
  ) => void;
  onPushHistorySnapshot: (snapshot: LabelProject) => void;
  onDeleteElement: (id: string) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onCursorMove: (xMm: number, yMm: number) => void;
  onUpdateTableCell?: (elId: string, r: number, c: number, text: string) => void;
}

const BASE_PPM = 4.0;

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  project,
  selectedElementId,
  onSelectElement,
  onUpdateElementBounds,
  onUpdateElementBoundsTransient,
  onPushHistorySnapshot,
  onDeleteElement,
  zoom,
  onZoomChange,
  onCursorMove,
  onUpdateTableCell,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [cursorLocalMm, setCursorLocalMm] = useState<[number, number] | null>(null);
  const [editingCell, setEditingCell] = useState<{
    elId: string;
    r: number;
    c: number;
  } | null>(null);

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
    snapshot: LabelProject;
    changed: boolean;
  } | null>(null);

  const pxPerMm = BASE_PPM * zoom;
  const paper = project.paper;

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

  // Keyboard nudge & delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const el = project.elements.find((item) => item.id === selectedElementId);
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
        onUpdateElementBounds(
          el.id,
          Number(nx.toFixed(1)),
          Number(ny.toFixed(1)),
          el.widthMm,
          el.heightMm,
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, project.elements, onDeleteElement, onUpdateElementBounds]);

  // Ctrl/Cmd + Wheel zoom
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      onZoomChange(Math.max(0.4, Math.min(3.0, Number((zoom + delta).toFixed(1)))));
    };
    board.addEventListener('wheel', handleWheel, { passive: false });
    return () => board.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange]);

  const paperWidthPx = paper.widthMm * pxPerMm;
  const paperHeightPx = paper.heightMm * pxPerMm;

  const usableWidth = Math.max(100, containerSize.width - RULER_THICKNESS);
  const usableHeight = Math.max(100, containerSize.height - RULER_THICKNESS);

  const minElementX = Math.min(0, ...project.elements.map((e) => e.xMm));
  const minElementY = Math.min(0, ...project.elements.map((e) => e.yMm));

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

  const handleBoardScroll = () => {
    if (boardRef.current) {
      setScrollPos({
        left: boardRef.current.scrollLeft,
        top: boardRef.current.scrollTop,
      });
    }
  };

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
  }, [
    paper.widthMm,
    paper.heightMm,
    paperOriginX,
    paperOriginY,
    usableWidth,
    usableHeight,
    paperWidthPx,
    paperHeightPx,
    zoom,
  ]);

  // Drag & resize with transient updates and single history commit on mouseup
  useEffect(() => {
    if (!dragState) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragState.startX) / pxPerMm;
      const deltaY = (e.clientY - dragState.startY) / pxPerMm;

      if (dragState.type === 'move') {
        const newX = Number((dragState.origX + deltaX).toFixed(1));
        const newY = Number((dragState.origY + deltaY).toFixed(1));
        if (newX !== dragState.origX || newY !== dragState.origY) {
          dragState.changed = true;
        }
        onUpdateElementBoundsTransient(
          dragState.elId,
          newX,
          newY,
          dragState.origW,
          dragState.origH,
        );
      } else if (dragState.type === 'resize' && dragState.handle) {
        let newX = dragState.origX;
        let newY = dragState.origY;
        let newW = dragState.origW;
        let newH = dragState.origH;

        const targetEl = dragState.snapshot.elements.find(
          (item) => item.id === dragState.elId,
        );
        const shouldLockRatio =
          targetEl?.kind.type === 'qrcode'
            ? targetEl.kind.codeType !== 'PDF_417' && targetEl.kind.lockAspectRatio !== false
            : targetEl?.kind.type === 'image'
              ? targetEl.kind.aspectRatioLock
              : false;

        if (shouldLockRatio && ['nw', 'ne', 'se', 'sw'].includes(dragState.handle)) {
          const ratio = dragState.origH / Math.max(0.1, dragState.origW);
          const dominantDelta =
            Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
          if (dragState.handle === 'se') {
            newW = Math.max(4, Number((dragState.origW + dominantDelta).toFixed(1)));
            newH = Number((newW * ratio).toFixed(1));
          } else if (dragState.handle === 'sw') {
            newW = Math.max(4, Number((dragState.origW - deltaX).toFixed(1)));
            newH = Number((newW * ratio).toFixed(1));
            newX = Number((dragState.origX + (dragState.origW - newW)).toFixed(1));
          } else if (dragState.handle === 'ne') {
            newW = Math.max(4, Number((dragState.origW + deltaX).toFixed(1)));
            newH = Number((newW * ratio).toFixed(1));
            newY = Number((dragState.origY + (dragState.origH - newH)).toFixed(1));
          } else if (dragState.handle === 'nw') {
            newW = Math.max(4, Number((dragState.origW - dominantDelta).toFixed(1)));
            newH = Number((newW * ratio).toFixed(1));
            newX = Number((dragState.origX + (dragState.origW - newW)).toFixed(1));
            newY = Number((dragState.origY + (dragState.origH - newH)).toFixed(1));
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

        const fx = Number(newX.toFixed(1));
        const fy = Number(newY.toFixed(1));
        const fw = Number(newW.toFixed(1));
        const fh = Number(newH.toFixed(1));
        if (
          fx !== dragState.origX ||
          fy !== dragState.origY ||
          fw !== dragState.origW ||
          fh !== dragState.origH
        ) {
          dragState.changed = true;
        }
        onUpdateElementBoundsTransient(dragState.elId, fx, fy, fw, fh);
      }
    };

    const handleWindowMouseUp = () => {
      if (dragState.changed) {
        onPushHistorySnapshot(dragState.snapshot);
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, pxPerMm, onUpdateElementBoundsTransient, onPushHistorySnapshot]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curScrollX = boardRef.current ? boardRef.current.scrollLeft : scrollPos.left;
    const curScrollY = boardRef.current ? boardRef.current.scrollTop : scrollPos.top;

    const mouseScreenX = e.clientX - rect.left - RULER_THICKNESS;
    const mouseScreenY = e.clientY - rect.top - RULER_THICKNESS;

    const mouseCanvasX = mouseScreenX + curScrollX;
    const mouseCanvasY = mouseScreenY + curScrollY;

    const xMm = Number(((mouseCanvasX - paperOriginX) / pxPerMm).toFixed(2));
    const yMm = Number(((mouseCanvasY - paperOriginY) / pxPerMm).toFixed(2));
    setCursorLocalMm([xMm, yMm]);
    onCursorMove(xMm, yMm);
  };

  const evalCtx: EvalContext = {
    labelSequenceIndex: 0,
    dbRowIndex: project.currentRecordIndex || 0,
    table: project.database,
    fixedNow: new Date(),
    sharedOverrides: project.sharedFields,
  };

  const activeDraggedEl = dragState
    ? project.elements.find((e) => e.id === dragState.elId)
    : null;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden bg-[#dfe4ec] select-none cursor-default"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCursorLocalMm(null)}
      onClick={(e) => {
        const targetId = (e.target as HTMLElement).id;
        if (
          e.target === containerRef.current ||
          targetId === 'canvas-board' ||
          targetId === 'canvas-pasteboard'
        ) {
          onSelectElement(null);
          setEditingCell(null);
        }
      }}
    >
      {/* Top Horizontal Ruler */}
      <div
        className="absolute top-0 right-0 z-20 overflow-hidden pointer-events-none"
        style={{ left: RULER_THICKNESS, height: RULER_THICKNESS }}
      >
        <Ruler
          orientation="horizontal"
          lengthPx={usableWidth}
          offsetPx={paperOriginX - scrollPos.left}
          pxPerMm={pxPerMm}
          cursorMm={cursorLocalMm?.[0]}
        />
      </div>

      {/* Left Vertical Ruler */}
      <div
        className="absolute left-0 bottom-0 z-20 overflow-hidden pointer-events-none"
        style={{ top: RULER_THICKNESS, width: RULER_THICKNESS }}
      >
        <Ruler
          orientation="vertical"
          lengthPx={usableHeight}
          offsetPx={paperOriginY - scrollPos.top}
          pxPerMm={pxPerMm}
          cursorMm={cursorLocalMm?.[1]}
        />
      </div>

      {/* Top-Left Origin Box */}
      <div
        className="absolute top-0 left-0 z-30 flex items-center justify-center bg-[#e8edf4] border-r border-b border-slate-300 text-[9px] font-mono text-slate-600 font-semibold"
        style={{ width: RULER_THICKNESS, height: RULER_THICKNESS }}
      >
        mm
      </div>

      {/* Main Scrollable Pasteboard */}
      <div
        id="canvas-board"
        ref={boardRef}
        onScroll={handleBoardScroll}
        className="absolute inset-0 overflow-auto"
        style={{
          paddingTop: RULER_THICKNESS,
          paddingLeft: RULER_THICKNESS,
          backgroundImage:
            'radial-gradient(circle, rgba(15,23,42,0.09) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        <div
          id="canvas-pasteboard"
          style={{
            width: Math.max(usableWidth, totalContentWidth),
            height: Math.max(usableHeight, totalContentHeight),
            position: 'relative',
          }}
        >
          {/* Floating Paper Size Badge above paper top-left */}
          <div
            className="absolute pointer-events-none flex items-center gap-2 text-[10px] font-mono text-slate-500"
            style={{
              left: paperOriginX,
              top: Math.max(4, paperOriginY - 20),
            }}
          >
            <span className="px-1.5 py-0.5 rounded bg-white/80 border border-slate-300/70 shadow-2xs font-medium text-slate-600">
              {paper.widthMm} × {paper.heightMm} mm
              {paper.columns > 1 ? ` · ${paper.columns}列` : ''}
            </span>
            {paper.rotationDeg !== 0 && (
              <span className="px-1.5 py-0.5 rounded bg-blue-50/90 border border-blue-200 text-[#0066FF] font-semibold">
                {paper.rotationDeg}°
              </span>
            )}
          </div>

          {/* Label Paper Surface */}
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
            <div
              className={`w-full h-full shadow-[0_8px_28px_rgba(15,23,42,0.16)] border border-slate-300/90 transition-colors ${
                paper.shape === 'sharp'
                  ? 'rounded-none'
                  : paper.shape === 'ellipse'
                    ? 'rounded-full'
                    : 'rounded-xl'
              }`}
              style={{ backgroundColor: paper.backgroundHex || '#ffffff' }}
            >
              {/* Multi-column visual guides */}
              {paper.columns > 1 && (
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: paper.columns - 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full border-r border-dashed border-blue-400/60"
                      style={{ width: `${100 / paper.columns}%` }}
                    />
                  ))}
                </div>
              )}

              {/* Elements */}
              {project.elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                const elLeftPx = el.xMm * pxPerMm;
                const elTopPx = el.yMm * pxPerMm;
                const elWidthPx = el.widthMm * pxPerMm;
                const elHeightPx = el.heightMm * pxPerMm;

                return (
                  <div
                    key={el.id}
                    className={`absolute group select-none ${
                      el.locked ? 'cursor-not-allowed' : 'cursor-move'
                    } ${isSelected ? 'z-30' : 'z-10'}`}
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
                          snapshot: project,
                          changed: false,
                        });
                      }
                    }}
                  >
                    <div className="w-full h-full relative overflow-hidden flex items-center">
                      <ElementRenderer
                        element={el}
                        ctx={evalCtx}
                        pxPerMm={pxPerMm}
                        interactive
                        isSelected={isSelected}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        onUpdateTableCell={onUpdateTableCell}
                      />
                    </div>

                    {/* Hover outline when not selected */}
                    {!isSelected && (
                      <div className="absolute inset-0 border border-transparent group-hover:border-[#0066FF]/45 pointer-events-none transition-colors" />
                    )}

                    {/* Selection Box & Resize Handles */}
                    {isSelected && (
                      <div
                        className={`absolute -inset-[1.5px] pointer-events-none ${
                          el.locked
                            ? 'border-[1.5px] border-dashed border-amber-500'
                            : 'border-[1.5px] border-[#0066FF]'
                        }`}
                      >
                        {el.locked ? (
                          <div className="absolute -top-5 right-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-semibold shadow-xs">
                            <Lock className="w-2.5 h-2.5" />
                            <span>已锁定</span>
                          </div>
                        ) : (
                          <>
                            {[
                              { pos: 'nw', class: '-top-1.5 -left-1.5 cursor-nwse-resize' },
                              {
                                pos: 'n',
                                class: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
                              },
                              { pos: 'ne', class: '-top-1.5 -right-1.5 cursor-nesw-resize' },
                              {
                                pos: 'e',
                                class: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize',
                              },
                              { pos: 'se', class: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
                              {
                                pos: 's',
                                class: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
                              },
                              { pos: 'sw', class: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
                              {
                                pos: 'w',
                                class: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize',
                              },
                            ].map((handle) => (
                              <div
                                key={handle.pos}
                                className={`absolute w-2.5 h-2.5 bg-white border-[1.5px] border-[#0066FF] pointer-events-auto rounded-[2px] shadow-xs hover:scale-110 transition-transform ${handle.class}`}
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
                                    snapshot: project,
                                    changed: false,
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

      {/* Live Drag / Resize Coordinate HUD */}
      {activeDraggedEl && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-slate-900/90 text-white text-[11px] font-mono tabular-nums rounded-full shadow-lg border border-slate-700 pointer-events-none flex items-center gap-3">
          <span>
            X: {activeDraggedEl.xMm.toFixed(1)} · Y: {activeDraggedEl.yMm.toFixed(1)} mm
          </span>
          <span className="text-slate-400">|</span>
          <span>
            {activeDraggedEl.widthMm.toFixed(1)} × {activeDraggedEl.heightMm.toFixed(1)} mm
          </span>
        </div>
      )}

      {/* Floating Zoom Capsule */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200/90 text-xs text-slate-700">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(0.4, Number((zoom - 0.1).toFixed(1))))}
          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded transition-colors"
          title="缩小 (Zoom Out)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-12 text-center font-mono font-semibold tabular-nums text-[11px]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onZoomChange(Math.min(3.0, Number((zoom + 0.1).toFixed(1))))}
          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded transition-colors"
          title="放大 (Zoom In)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
        <button
          type="button"
          onClick={() => onZoomChange(1.0)}
          className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors flex items-center gap-1"
          title="重置为 100%"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>100%</span>
        </button>
      </div>
    </div>
  );
};
