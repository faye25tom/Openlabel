import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: string;
  showText?: boolean;
  width?: number; // element width in px
  height?: number; // element height in px
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  showText = true,
  width = 200,
  height = 60,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      const cleanVal = (value || 'SAMPLE-0001').replace(/[\r\n\t]/g, '');
      JsBarcode(svgRef.current, cleanVal, {
        format: format.toUpperCase(),
        displayValue: showText,
        fontSize: 12,
        margin: 2,
        height: Math.max(15, height - (showText ? 20 : 6)),
        background: 'transparent',
        lineColor: '#000000',
      });
    } catch {
      // Fallback if value invalid for barcode format
      if (svgRef.current) {
        svgRef.current.innerHTML = `
          <rect width="100%" height="100%" fill="#f1f5f9" />
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="#64748b">
            ||| Invalid Barcode Data
          </text>
        `;
      }
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
