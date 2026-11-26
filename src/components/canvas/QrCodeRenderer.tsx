import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import { TwoDCodeType } from '../../types/model';

interface QrCodeRendererProps {
  value: string;
  codeType?: TwoDCodeType;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  cellWidthDots?: number;
  scalePercent?: number;
  marginModules?: number;
}

export const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({
  value,
  codeType = 'QR_Code',
  errorCorrection = 'M',
  scalePercent = 100,
  marginModules = 1,
}) => {
  const cleanVal = (value || 'https://openlabel.org').trim();
  const scale = Math.max(0.25, Math.min(1.6, (scalePercent || 100) / 100));
  const margin = Math.max(0, Math.min(6, marginModules ?? 1));

  const qrSvgData = useMemo(() => {
    if (codeType !== 'QR_Code') return null;
    try {
      const qr = QRCode.create(cleanVal, {
        errorCorrectionLevel: errorCorrection,
      });
      const size = qr.modules.size;
      const totalSize = size + margin * 2;
      let path = '';

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (qr.modules.get(r, c)) {
            const x = c + margin;
            const y = r + margin;
            path += `M${x},${y}h1v1h-1z `;
          }
        }
      }

      return { totalSize, path };
    } catch {
      const size = 21;
      const totalSize = size + margin * 2;
      let path = '';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (
            (r + c) % 2 === 0 ||
            (r < 7 && c < 7) ||
            (r < 7 && c >= size - 7) ||
            (r >= size - 7 && c < 7)
          ) {
            path += `M${c + margin},${r + margin}h1v1h-1z `;
          }
        }
      }
      return { totalSize, path };
    }
  }, [cleanVal, codeType, errorCorrection, margin]);

  if (codeType === 'QR_Code' && qrSvgData) {
    const { totalSize, path } = qrSvgData;
    const vbSize = totalSize / scale;
    const vbOffset = (vbSize - totalSize) / 2;

    return (
      <svg
        viewBox={`${-vbOffset} ${-vbOffset} ${vbSize} ${vbSize}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block select-none pointer-events-none"
      >
        <rect x={-vbOffset} y={-vbOffset} width={vbSize} height={vbSize} fill="#ffffff" />
        <path d={path} fill="#000000" shapeRendering="geometricPrecision" />
      </svg>
    );
  }

  if (codeType === 'DATA_MATRIX') return renderDataMatrixSvg(cleanVal, scale, margin);
  if (codeType === 'PDF_417') return renderPdf417Svg(cleanVal, scale, margin);
  if (codeType === 'HANXIN') return renderHanxinSvg(cleanVal, scale, margin);
  if (codeType === 'AZTEC') return renderAztecSvg(cleanVal, scale, margin);
  if (codeType === 'MAXICODE') return renderMaxiCodeSvg(cleanVal, scale);

  return null;
};

function renderDataMatrixSvg(val: string, scale: number, margin: number) {
  const n = 16;
  const total = n + margin * 2;
  const vbSize = total / scale;
  const vbOffset = (vbSize - total) / 2;
  let path = '';

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const isL = c === 0 || r === n - 1;
      const isClock = (r === 0 && c % 2 === 0) || (c === n - 1 && r % 2 === 0);
      const charCode = val.charCodeAt((r * n + c) % val.length) || 65;
      const isData = ((charCode ^ (r * 17 + c * 31)) % 7) > 2;

      if (
        isL ||
        isClock ||
        (!isL && !isClock && r > 0 && r < n - 1 && c > 0 && c < n - 1 && isData)
      ) {
        path += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return (
    <svg
      viewBox={`${-vbOffset} ${-vbOffset} ${vbSize} ${vbSize}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full block select-none pointer-events-none"
    >
      <rect x={-vbOffset} y={-vbOffset} width={vbSize} height={vbSize} fill="#ffffff" />
      <path d={path} fill="#000000" shapeRendering="geometricPrecision" />
    </svg>
  );
}

function renderPdf417Svg(val: string, scale: number, margin: number) {
  const rows = 12;
  const cols = 48;
  const totalW = cols + margin * 2;
  const totalH = rows * 2 + margin * 2;
  const vbW = totalW / scale;
  const vbH = totalH / scale;
  const offX = (vbW - totalW) / 2;
  const offY = (vbH - totalH) / 2;
  let path = '';

  for (let r = 0; r < rows; r++) {
    const y = margin + r * 2;
    path += `M${margin},${y}h2v2h-2z M${margin + 3},${y}h1v2h-1z M${margin + 5},${y}h2v2h-2z `;
    path += `M${totalW - margin - 5},${y}h2v2h-2z M${totalW - margin - 2},${y}h1v2h-1z `;

    for (let c = 8; c < cols - 7; c++) {
      const charCode = val.charCodeAt((r * cols + c) % val.length) || 77;
      if ((charCode + r * 13 + c * 7) % 3 === 0) {
        path += `M${margin + c},${y}h1v2h-1z `;
      }
    }
  }

  return (
    <svg
      viewBox={`${-offX} ${-offY} ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full block select-none pointer-events-none"
    >
      <rect x={-offX} y={-offY} width={vbW} height={vbH} fill="#ffffff" />
      <path d={path} fill="#000000" shapeRendering="geometricPrecision" />
    </svg>
  );
}

function renderHanxinSvg(val: string, scale: number, margin: number) {
  const n = 23;
  const total = n + margin * 2;
  const vbSize = total / scale;
  const vbOffset = (vbSize - total) / 2;
  let path = '';

  const corners = [
    [0, 0],
    [0, n - 5],
    [n - 5, 0],
    [n - 5, n - 5],
  ];

  corners.forEach(([cr, cc]) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
          path += `M${margin + cc + c},${margin + cr + r}h1v1h-1z `;
        }
      }
    }
  });

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const isCorner =
        (r < 6 && c < 6) ||
        (r < 6 && c >= n - 6) ||
        (r >= n - 6 && c < 6) ||
        (r >= n - 6 && c >= n - 6);
      if (!isCorner) {
        const charCode = val.charCodeAt((r * n + c) % val.length) || 88;
        if (((charCode * 19 + r * 11 + c * 23) % 5) < 2) {
          path += `M${margin + c},${margin + r}h1v1h-1z `;
        }
      }
    }
  }

  return (
    <svg
      viewBox={`${-vbOffset} ${-vbOffset} ${vbSize} ${vbSize}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full block select-none pointer-events-none"
    >
      <rect x={-vbOffset} y={-vbOffset} width={vbSize} height={vbSize} fill="#ffffff" />
      <path d={path} fill="#000000" shapeRendering="geometricPrecision" />
    </svg>
  );
}

function renderAztecSvg(val: string, scale: number, margin: number) {
  const n = 27;
  const total = n + margin * 2;
  const vbSize = total / scale;
  const vbOffset = (vbSize - total) / 2;
  const mid = Math.floor(n / 2);
  let path = '';

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const dr = Math.abs(r - mid);
      const dc = Math.abs(c - mid);
      const maxD = Math.max(dr, dc);
      const isBullseye = maxD === 4 || maxD === 2 || maxD === 0;

      if (maxD <= 4) {
        if (isBullseye) {
          path += `M${margin + c},${margin + r}h1v1h-1z `;
        }
      } else {
        const charCode = val.charCodeAt((r * n + c) % val.length) || 69;
        if (((charCode * 31 + r * 17 + c * 7) % 11) < 5) {
          path += `M${margin + c},${margin + r}h1v1h-1z `;
        }
      }
    }
  }

  return (
    <svg
      viewBox={`${-vbOffset} ${-vbOffset} ${vbSize} ${vbSize}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full block select-none pointer-events-none"
    >
      <rect x={-vbOffset} y={-vbOffset} width={vbSize} height={vbSize} fill="#ffffff" />
      <path d={path} fill="#000000" shapeRendering="geometricPrecision" />
    </svg>
  );
}

function renderMaxiCodeSvg(val: string, scale: number) {
  const size = 100;
  const cx = 50;
  const cy = 50;
  const vbSize = size / scale;
  const vbOffset = (vbSize - size) / 2;

  const hexRows = 20;
  const hexCols = 20;
  const dx = size / hexCols;
  const dy = size / hexRows;
  const dots: { x: number; y: number }[] = [];

  for (let r = 1; r < hexRows - 1; r++) {
    for (let c = 1; c < hexCols - 1; c++) {
      const hx = c * dx + (r % 2 === 1 ? dx * 0.5 : 0);
      const hy = r * dy;
      const dist = Math.hypot(hx - cx, hy - cy);

      if (dist > 16 && dist < 45) {
        const charCode = val.charCodeAt((r * hexCols + c) % val.length) || 85;
        if (((charCode * 13 + r * 7 + c * 19) % 3) !== 0) {
          dots.push({ x: hx, y: hy });
        }
      }
    }
  }

  return (
    <svg
      viewBox={`${-vbOffset} ${-vbOffset} ${vbSize} ${vbSize}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full block select-none pointer-events-none"
    >
      <rect x={-vbOffset} y={-vbOffset} width={vbSize} height={vbSize} fill="#ffffff" />
      <circle cx={cx} cy={cy} r="14" fill="none" stroke="#000000" strokeWidth="2.8" />
      <circle cx={cx} cy={cy} r="8.5" fill="none" stroke="#000000" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r="3" fill="#000000" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="1.4" fill="#000000" />
      ))}
    </svg>
  );
}
