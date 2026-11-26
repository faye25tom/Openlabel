import React from 'react';
import { LabelElement } from '../../types/model';
import { EvalContext, evaluateSegments } from '../../engine/evaluator';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QrCodeRenderer } from './QrCodeRenderer';
import { GraphShapeSvg, IndustrialIconSvg } from '../ui/ShapePreviewSvg';

export interface ElementRendererProps {
  element: LabelElement;
  ctx: EvalContext;
  pxPerMm: number;
  interactive?: boolean;
  isSelected?: boolean;
  editingCell?: { elId: string; r: number; c: number } | null;
  setEditingCell?: React.Dispatch<
    React.SetStateAction<{ elId: string; r: number; c: number } | null>
  >;
  onUpdateTableCell?: (elId: string, r: number, c: number, text: string) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element: el,
  ctx,
  pxPerMm,
  interactive = true,
  isSelected = false,
  editingCell,
  setEditingCell,
  onUpdateTableCell,
}) => {
  switch (el.kind.type) {
    case 'text': {
      const text = evaluateSegments(el.kind.segments, ctx);
      const font = el.kind.font;
      const fontPx = ((font.sizePt * 25.4) / 72) * pxPerMm;

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
            color: font.reverseVideo ? '#ffffff' : font.color || '#000000',
            textDecoration:
              `${font.underline ? 'underline' : ''} ${
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
              <path id={`path-${el.id}-${interactive ? 'c' : 'p'}`} d="M 5,35 Q 50,5 95,35" fill="none" />
              <text
                fontSize="12"
                fill={font.reverseVideo ? '#fff' : font.color || '#000'}
                textAnchor="middle"
              >
                <textPath href={`#path-${el.id}-${interactive ? 'c' : 'p'}`} startOffset="50%">
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
            width={Math.max(40, el.widthMm * pxPerMm)}
            height={Math.max(20, el.heightMm * pxPerMm)}
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
        <GraphShapeSvg
          shape={el.kind.shape}
          strokeWidth={strokeW}
          strokeColor={strokeColor}
          fillColor={fillColor}
          dashArray={dashArray}
          cornerRadiusMm={el.kind.cornerRadiusMm}
        />
      );
    }

    case 'table': {
      const rows = el.kind.rows || 3;
      const cols = el.kind.cols || 2;
      const fontPx = (((el.kind.fontSizePt || 8) * 25.4) / 72) * pxPerMm;
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
                const isHeader =
                  r === 0 && el.kind.type === 'table' && Boolean(el.kind.headerRow);
                return (
                  <tr
                    key={r}
                    style={{ borderBottom: `${strokeW}px solid ${bColor}` }}
                    className={isHeader ? 'bg-slate-100/90 font-bold' : ''}
                  >
                    {Array.from({ length: cols }).map((_, c) => {
                      const cellVal =
                        el.kind.type === 'table' && el.kind.cells?.[r]?.[c]
                          ? el.kind.cells[r][c]
                          : '';
                      const isCellEditing =
                        interactive &&
                        editingCell?.elId === el.id &&
                        editingCell?.r === r &&
                        editingCell?.c === c;

                      return (
                        <td
                          key={c}
                          style={{
                            borderRight: `${strokeW}px solid ${bColor}`,
                            textAlign: align,
                          }}
                          onMouseDown={(e) => {
                            if (interactive && isSelected) {
                              e.stopPropagation();
                            }
                          }}
                          onDoubleClick={(e) => {
                            if (!interactive) return;
                            e.stopPropagation();
                            setEditingCell?.({ elId: el.id, r, c });
                          }}
                          onClick={(e) => {
                            if (interactive && isSelected) {
                              e.stopPropagation();
                              setEditingCell?.({ elId: el.id, r, c });
                            }
                          }}
                          className={`p-0.5 text-slate-800 transition-colors ${
                            interactive && isSelected
                              ? 'hover:bg-blue-50/80 cursor-text select-text'
                              : ''
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
                                  onUpdateTableCell?.(
                                    el.id,
                                    r,
                                    c,
                                    (e.target as HTMLInputElement).value,
                                  );
                                  setEditingCell?.(null);
                                }
                              }}
                              className="w-full h-full px-1 py-0.5 bg-white border border-[#0066FF] rounded outline-none text-slate-900 shadow-xs"
                            />
                          ) : (
                            <span className="truncate block w-full">
                              {cellVal ||
                                (interactive && isSelected ? (
                                  <span className="text-slate-300">...</span>
                                ) : (
                                  ''
                                ))}
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
          {interactive && isSelected && (
            <div className="absolute -bottom-5 left-0 text-[10px] text-[#0066FF] bg-white/95 px-1.5 py-0.5 rounded shadow-xs border border-blue-200 pointer-events-none whitespace-nowrap z-40">
              双击单元格编辑文字
            </div>
          )}
        </div>
      );
    }

    case 'reverse':
      return (
        <div className="w-full h-full bg-black/90 flex items-center justify-center text-white text-[10px] font-mono tracking-wider select-none">
          {interactive ? 'REVERSE' : ''}
        </div>
      );

    case 'icon':
      return (
        <div className="w-full h-full flex items-center justify-center p-1 text-slate-900">
          <IndustrialIconSvg name={el.kind.iconName} color={el.kind.color} />
        </div>
      );

    case 'image':
      return (
        <img
          src={el.kind.src}
          alt={el.name}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      );

    default:
      return <div className="text-xs text-slate-400">Element</div>;
  }
};
