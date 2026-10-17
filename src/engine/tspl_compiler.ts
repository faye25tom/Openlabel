import { LabelProject } from '../types/model';
import { EvalContext, evaluateSegments } from './evaluator';

export type Dpi = 203 | 300;

export function mmToPrinterDots(mm: number, dpi: Dpi): number {
  return Math.round((mm * dpi) / 25.4);
}

/**
 * Pure Clean-room TSPL2 instruction compiler for TSC / Gainscha / Deli thermal barcode printers.
 */
export function compileToTspl2(project: LabelProject, ctx: EvalContext, dpi: Dpi = 203): string {
  const lines: string[] = [];

  // Paper size and gap
  lines.push(`SIZE ${project.paper.widthMm.toFixed(1)} mm, ${project.paper.heightMm.toFixed(1)} mm`);
  lines.push(`GAP ${project.paper.gapMm.toFixed(1)} mm, 0 mm`);

  // Offsets
  const shiftX = mmToPrinterDots(project.paper.offsetLeftRightMm, dpi);
  const shiftY = mmToPrinterDots(project.paper.offsetUpDownMm, dpi);
  lines.push(`SHIFT ${shiftX},${shiftY}`);
  lines.push('DIRECTION 1,0');
  lines.push('CLS');

  for (const el of project.elements) {
    const x = mmToPrinterDots(el.xMm, dpi);
    const y = mmToPrinterDots(el.yMm, dpi);
    const w = Math.max(1, mmToPrinterDots(el.widthMm, dpi));
    const h = Math.max(1, mmToPrinterDots(el.heightMm, dpi));

    switch (el.kind.type) {
      case 'text': {
        const text = evaluateSegments(el.kind.segments, ctx).replace(/"/g, '\\"');
        const scale = Math.max(1, Math.min(4, Math.round(el.kind.font.scalePercent / 100)));
        lines.push(`TEXT ${x},${y},"TSS24.BF2",0,${scale},${scale},"${text}"`);
        if (el.kind.font.reverseVideo) {
          lines.push(`REVERSE ${x},${y},${w},${h}`);
        }
        break;
      }

      case 'barcode': {
        const code = evaluateSegments(el.kind.segments, ctx).replace(/"/g, '');
        const readable = el.kind.showHumanReadable ? 1 : 0;
        let tsplCode = '128';
        const s = el.kind.symbology.toLowerCase();
        if (s.includes('39')) tsplCode = '39';
        else if (s === 'ean13') tsplCode = 'EAN13';
        else if (s === 'ean8') tsplCode = 'EAN8';
        else if (s === 'upca') tsplCode = 'UPCA';
        else if (s === 'upce') tsplCode = 'UPCE';
        else if (s.includes('itf')) tsplCode = 'ITF14';
        else if (s.includes('codabar')) tsplCode = 'CODABAR';
        else if (s.includes('93')) tsplCode = '93';
        lines.push(`BARCODE ${x},${y},"${tsplCode}",${h},${readable},0,2,2,"${code}"`);
        break;
      }

      case 'qrcode': {
        const content = evaluateSegments(el.kind.segments, ctx).replace(/"/g, '\\"');
        const codeType = el.kind.codeType || 'QR_Code';
        if (codeType === 'DATA_MATRIX') {
          lines.push(`DMATRIX ${x},${y},${w},${h},"${content}"`);
        } else if (codeType === 'PDF_417') {
          lines.push(`PDF417 ${x},${y},${w},${h},0,0,"${content}"`);
        } else {
          const ecc = el.kind.errorCorrection || 'M';
          const cellWidth =
            el.kind.cellWidthDots ||
            (el.kind.scalePercent ? Math.max(1, Math.min(10, Math.round((el.kind.scalePercent / 100) * 4))) : 4);
          lines.push(`QRCODE ${x},${y},${ecc},${cellWidth},A,0,"${content}"`);
        }
        break;
      }

      case 'graph': {
        const strokeDots = Math.max(1, mmToPrinterDots(el.kind.lineThicknessMm, dpi));
        if (el.kind.shape === 'line') {
          lines.push(`BAR ${x},${y},${w},${strokeDots}`);
        } else if (el.kind.shape === 'vertical_line') {
          lines.push(`BAR ${x},${y},${strokeDots},${h}`);
        } else if (el.kind.shape === 'circle') {
          lines.push(`CIRCLE ${x},${y},${w},${strokeDots}`);
        } else {
          // Box for rectangle, rounded_rect, triangle, diamond, hexagon, etc.
          lines.push(`BOX ${x},${y},${x + w},${y + h},${strokeDots}`);
        }
        break;
      }

      case 'reverse': {
        lines.push(`REVERSE ${x},${y},${w},${h}`);
        break;
      }

      case 'table': {
        lines.push(`BOX ${x},${y},${x + w},${y + h},2`);
        const rows = Math.max(1, el.kind.rows);
        const cols = Math.max(1, el.kind.cols);
        for (let r = 1; r < rows; r++) {
          const ry = y + Math.round((h * r) / rows);
          lines.push(`BAR ${x},${ry},${w},1`);
        }
        for (let c = 1; c < cols; c++) {
          const cx = x + Math.round((w * c) / cols);
          lines.push(`BAR ${cx},${y},1,${h}`);
        }
        break;
      }
    }
  }

  lines.push('PRINT 1,1');
  return lines.join('\r\n');
}

/**
 * Pure Clean-room ZPL II instruction compiler for Zebra barcode printers.
 */
export function compileToZpl2(project: LabelProject, ctx: EvalContext, dpi: Dpi = 203): string {
  const lines: string[] = [];
  lines.push('^XA');
  lines.push(`^PW${mmToPrinterDots(project.paper.widthMm, dpi)}`);
  lines.push(`^LL${mmToPrinterDots(project.paper.heightMm, dpi)}`);
  lines.push('^LH0,0');

  for (const el of project.elements) {
    const x = mmToPrinterDots(el.xMm, dpi);
    const y = mmToPrinterDots(el.yMm, dpi);
    const h = Math.max(1, mmToPrinterDots(el.heightMm, dpi));

    switch (el.kind.type) {
      case 'text': {
        const text = evaluateSegments(el.kind.segments, ctx);
        const fontH = Math.round(el.kind.font.sizePt * 3.5);
        lines.push(`^FO${x},${y}^A0N,${fontH},${fontH}^FD${text}^FS`);
        break;
      }
      case 'barcode': {
        const code = evaluateSegments(el.kind.segments, ctx);
        lines.push(`^FO${x},${y}^BCN,${h},${el.kind.showHumanReadable ? 'Y' : 'N'},N,N^FD${code}^FS`);
        break;
      }
      case 'qrcode': {
        const content = evaluateSegments(el.kind.segments, ctx);
        lines.push(`^FO${x},${y}^BQN,2,4^FDQA,${content}^FS`);
        break;
      }
      case 'graph': {
        const w = mmToPrinterDots(el.widthMm, dpi);
        const th = Math.max(1, mmToPrinterDots(el.kind.lineThicknessMm, dpi));
        lines.push(`^FO${x},${y}^GB${w},${h},${th}^FS`);
        break;
      }
    }
  }

  lines.push('^XZ');
  return lines.join('\r\n');
}
