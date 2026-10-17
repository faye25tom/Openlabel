import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeRendererProps {
  value: string;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}

export const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({
  value,
  errorCorrection = 'M',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanVal = value || 'https://openlabel.org';
    QRCode.toCanvas(
      canvasRef.current,
      cleanVal,
      {
        errorCorrectionLevel: errorCorrection,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (err) => {
        if (err) console.error('QR rendering error', err);
      }
    );
  }, [value, errorCorrection]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain block select-none pointer-events-none"
    />
  );
};
