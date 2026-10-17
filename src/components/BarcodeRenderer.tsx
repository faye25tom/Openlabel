import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: string;
  showText?: boolean;
  width?: number;
  height?: number;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'code128',
  showText = true,
  width = 200,
  height = 60,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const cleanVal = (value || '12345678').trim();

    // Map custom symbology key to JsBarcode compatible format
    let jsFormat = 'CODE128';
    const fmt = format.toLowerCase();

    if (fmt.includes('codabar')) {
      jsFormat = 'codabar';
    } else if (fmt === 'code39' || fmt === 'code39ext') {
      jsFormat = 'CODE39';
    } else if (fmt.includes('ean13') || fmt === 'ean-13') {
      jsFormat = 'EAN13';
    } else if (fmt.includes('ean8') || fmt === 'ean-8') {
      jsFormat = 'EAN8';
    } else if (fmt === 'upca' || fmt === 'upc-a' || fmt === 'upc') {
      jsFormat = 'UPC';
    } else if (fmt === 'upce' || fmt === 'upc-e') {
      jsFormat = 'UPC';
    } else if (fmt === 'itf14' || fmt === 'itf-14') {
      jsFormat = 'ITF14';
    } else if (fmt === 'itf') {
      jsFormat = 'ITF';
    } else if (fmt === 'pharmacode') {
      jsFormat = 'pharmacode';
    } else {
      jsFormat = 'CODE128';
    }

    try {
      JsBarcode(svgRef.current, cleanVal, {
        format: jsFormat,
        displayValue: showText,
        fontSize: 12,
        margin: 2,
        height: Math.max(15, height - (showText ? 20 : 6)),
        background: 'transparent',
        lineColor: '#000000',
      });
    } catch {
      // Deterministic SVG fallback for stacked / unsupported formats (e.g. CODE 16K, CODE 49, invalid check digit)
      renderDeterministicBarcodeSvg(svgRef.current, cleanVal, format.toUpperCase(), showText, width, height);
    }
  }, [value, format, showText, width, height]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full block select-none pointer-events-none"
      preserveAspectRatio="none"
    />
  );
};

function renderDeterministicBarcodeSvg(
  svg: SVGSVGElement,
  val: string,
  labelFormat: string,
  showText: boolean,
  w: number,
  h: number
) {
  const barH = showText ? Math.max(15, h - 18) : h - 4;
  const numBars = 50;
  let linesSvg = '';
  const barW = Math.max(1.2, (w - 16) / numBars);

  for (let i = 0; i < numBars; i++) {
    // Generate pseudo-pattern from string hash and index
    const charCode = val.charCodeAt(i % val.length) || 48;
    const isBar = (charCode + i * 7) % 2 === 0;
    const isThick = (charCode + i * 13) % 3 === 0;

    if (isBar || i < 3 || i > numBars - 4) {
      const x = 8 + i * barW;
      linesSvg += `<rect x="${x}" y="2" width="${isThick ? barW * 1.5 : barW * 0.8}" height="${barH}" fill="#000000" />`;
    }
  }

  const textSvg = showText
    ? `<text x="50%" y="${h - 2}" text-anchor="middle" font-size="11" font-family="monospace" fill="#000000">${val}</text>`
    : '';

  svg.innerHTML = `
    <rect width="100%" height="100%" fill="transparent" />
    ${linesSvg}
    ${textSvg}
  `;
}
