import React from 'react';
import { ShapeKind } from '../../types/model';

interface GraphShapeSvgProps {
  shape: ShapeKind | string;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  dashArray?: string;
  cornerRadiusMm?: number;
  className?: string;
  preserveAspectRatio?: string;
}

export const GraphShapeSvg: React.FC<GraphShapeSvgProps> = ({
  shape,
  strokeWidth = 2,
  strokeColor = '#000000',
  fillColor = 'none',
  dashArray,
  cornerRadiusMm,
  className = 'w-full h-full overflow-visible',
  preserveAspectRatio = 'none',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio={preserveAspectRatio}
      className={className}
    >
      {renderGraphShapePrimitives(
        shape,
        strokeWidth,
        strokeColor,
        fillColor,
        dashArray,
        cornerRadiusMm,
      )}
    </svg>
  );
};

export function renderGraphShapePrimitives(
  shape: string,
  strokeW: number,
  strokeColor: string,
  fillColor: string,
  dashArray?: string,
  cornerRadiusMm?: number,
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
      return <rect x="4" y="4" width="92" height="92" {...commonProps} />;

    case 'rounded_rect': {
      const rx = Math.max(4, Math.min(45, (cornerRadiusMm || 3) * 4));
      return <rect x="4" y="4" width="92" height="92" rx={rx} ry={rx} {...commonProps} />;
    }

    case 'circle':
      return <ellipse cx="50" cy="50" rx="44" ry="44" {...commonProps} />;

    case 'ellipse':
      return <ellipse cx="50" cy="50" rx="46" ry="31" {...commonProps} />;

    case 'capsule':
      return (
        <rect x="4" y="18" width="92" height="64" rx="32" ry="32" {...commonProps} />
      );

    case 'snip_corner_rect': {
      const c = Math.max(8, Math.min(30, (cornerRadiusMm || 4) * 3));
      const p = `${c},4 ${100 - c},4 96,${c} 96,${100 - c} ${100 - c},96 ${c},96 4,${100 - c} 4,${c}`;
      return <polygon points={p} {...commonProps} strokeLinejoin="round" />;
    }

    // Lines & Arrows
    case 'line':
      return (
        <line x1="2" y1="50" x2="98" y2="50" {...commonProps} strokeLinecap="round" />
      );

    case 'vertical_line':
      return (
        <line x1="50" y1="2" x2="50" y2="98" {...commonProps} strokeLinecap="round" />
      );

    case 'diagonal_line_up':
      return (
        <line x1="6" y1="94" x2="94" y2="6" {...commonProps} strokeLinecap="round" />
      );

    case 'diagonal_line_down':
      return (
        <line x1="6" y1="6" x2="94" y2="94" {...commonProps} strokeLinecap="round" />
      );

    case 'arrow':
    case 'arrow_right':
      return (
        <g {...commonProps}>
          <line x1="6" y1="50" x2="78" y2="50" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="74,30 96,50 74,70" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'arrow_left':
      return (
        <g {...commonProps}>
          <polygon points="26,30 4,50 26,70" fill={strokeColor} stroke="none" />
          <line x1="22" y1="50" x2="94" y2="50" strokeWidth={strokeW} strokeLinecap="round" />
        </g>
      );

    case 'arrow_up':
      return (
        <g {...commonProps}>
          <polygon points="30,26 50,4 70,26" fill={strokeColor} stroke="none" />
          <line x1="50" y1="22" x2="50" y2="94" strokeWidth={strokeW} strokeLinecap="round" />
        </g>
      );

    case 'arrow_down':
      return (
        <g {...commonProps}>
          <line x1="50" y1="6" x2="50" y2="78" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="30,74 50,96 70,74" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'double_arrow':
      return (
        <g {...commonProps}>
          <polygon points="24,32 4,50 24,68" fill={strokeColor} stroke="none" />
          <line x1="22" y1="50" x2="78" y2="50" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="76,32 96,50 76,68" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'double_arrow_v':
      return (
        <g {...commonProps}>
          <polygon points="32,24 50,4 68,24" fill={strokeColor} stroke="none" />
          <line x1="50" y1="22" x2="50" y2="78" strokeWidth={strokeW} strokeLinecap="round" />
          <polygon points="32,76 50,96 68,76" fill={strokeColor} stroke="none" />
        </g>
      );

    case 'bracket_left':
      return (
        <path
          d="M 70 8 L 30 8 L 30 92 L 70 92"
          {...commonProps}
          fill="none"
          strokeLinecap="square"
        />
      );

    case 'bracket_right':
      return (
        <path
          d="M 30 8 L 70 8 L 70 92 L 30 92"
          {...commonProps}
          fill="none"
          strokeLinecap="square"
        />
      );

    case 'brace_left':
      return (
        <path
          d="M 65 8 C 45 8 45 35 30 50 C 45 65 45 92 65 92"
          {...commonProps}
          fill="none"
          strokeLinecap="round"
        />
      );

    case 'brace_right':
      return (
        <path
          d="M 35 8 C 55 8 55 35 70 50 C 55 65 55 92 35 92"
          {...commonProps}
          fill="none"
          strokeLinecap="round"
        />
      );

    case 'corner_bracket':
      return (
        <path
          d="M 20 80 L 80 80 L 80 20"
          {...commonProps}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'dimension_line':
      return (
        <g {...commonProps}>
          <line x1="5" y1="25" x2="5" y2="75" strokeWidth={strokeW} />
          <line x1="95" y1="25" x2="95" y2="75" strokeWidth={strokeW} />
          <line x1="8" y1="50" x2="92" y2="50" strokeWidth={strokeW} />
          <polygon points="20,40 6,50 20,60" fill={strokeColor} stroke="none" />
          <polygon points="80,40 94,50 80,60" fill={strokeColor} stroke="none" />
        </g>
      );

    // Industrial, Safety & Packaging
    case 'hazard_triangle':
      return (
        <g {...commonProps}>
          <polygon points="50,8 94,92 6,92" strokeLinejoin="round" />
          <line
            x1="50"
            y1="36"
            x2="50"
            y2="64"
            stroke={strokeColor}
            strokeWidth={Math.max(2, strokeW * 1.4)}
            strokeLinecap="round"
          />
          <circle cx="50" cy="77" r={Math.max(2.2, strokeW * 1.1)} fill={strokeColor} stroke="none" />
        </g>
      );

    case 'prohibition':
      return (
        <g {...commonProps}>
          <circle cx="50" cy="50" r="42" />
          <line x1="20" y1="20" x2="80" y2="80" strokeWidth={strokeW} />
        </g>
      );

    case 'cross':
      return (
        <polygon
          points="35,6 65,6 65,35 94,35 94,65 65,65 65,94 35,94 35,65 6,65 6,35 35,35"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'shield':
      return (
        <path
          d="M 50 6 L 92 20 C 92 62 65 88 50 94 C 35 88 8 62 8 20 Z"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'tag_shape':
      return (
        <g {...commonProps}>
          <polygon points="26,6 74,6 94,26 94,94 6,94 6,26" strokeLinejoin="round" />
          <circle cx="50" cy="22" r="6" fill="#ffffff" stroke={strokeColor} strokeWidth={strokeW} />
        </g>
      );

    case 'burst_seal': {
      const points = [];
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI) / 12 - Math.PI / 2;
        const r = i % 2 === 0 ? 44 : 36;
        points.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
      }
      return <polygon points={points.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    case 'speech_bubble':
      return (
        <path
          d="M 14 10 L 86 10 C 92 10 94 12 94 18 L 94 66 C 94 72 92 74 86 74 L 36 74 L 16 92 L 20 74 L 14 74 C 8 74 6 72 6 66 L 6 18 C 6 12 8 10 14 10 Z"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'cylinder':
      return (
        <g {...commonProps}>
          <ellipse cx="50" cy="22" rx="40" ry="15" />
          <line x1="10" y1="22" x2="10" y2="78" strokeWidth={strokeW} />
          <line x1="90" y1="22" x2="90" y2="78" strokeWidth={strokeW} />
          <path d="M 10 78 C 10 93 90 93 90 78" fill="none" strokeWidth={strokeW} />
        </g>
      );

    case 'cube':
      return (
        <g {...commonProps}>
          <polygon points="50,6 90,27 50,48 10,27" strokeLinejoin="round" />
          <polygon points="10,27 50,48 50,94 10,73" strokeLinejoin="round" />
          <polygon points="50,48 90,27 90,73 50,94" strokeLinejoin="round" />
        </g>
      );

    // Polygons & Stars
    case 'triangle':
      return <polygon points="50,8 94,92 6,92" {...commonProps} strokeLinejoin="round" />;

    case 'triangle_down':
      return <polygon points="6,8 94,8 50,92" {...commonProps} strokeLinejoin="round" />;

    case 'triangle_right':
      return <polygon points="8,6 8,94 92,50" {...commonProps} strokeLinejoin="round" />;

    case 'diamond':
      return <polygon points="50,6 94,50 50,94 6,50" {...commonProps} strokeLinejoin="round" />;

    case 'parallelogram':
      return <polygon points="26,8 94,8 74,92 6,92" {...commonProps} strokeLinejoin="round" />;

    case 'trapezoid':
      return <polygon points="22,8 78,8 94,92 6,92" {...commonProps} strokeLinejoin="round" />;

    case 'pentagon': {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        pts.push(`${50 + 44 * Math.cos(a)},${50 + 44 * Math.sin(a)}`);
      }
      return <polygon points={pts.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    case 'hexagon':
      return (
        <polygon
          points="26,6 74,6 95,50 74,94 26,94 5,50"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'octagon':
      return (
        <polygon
          points="29,6 71,6 94,29 94,71 71,94 29,94 6,71 6,29"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'star':
      return (
        <polygon
          points="50,6 63,35 95,37 71,59 78,91 50,73 22,91 29,59 5,37 37,35"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'star_4':
      return (
        <polygon
          points="50,6 61,39 94,50 61,61 50,94 39,61 6,50 39,39"
          {...commonProps}
          strokeLinejoin="round"
        />
      );

    case 'star_6': {
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6 - Math.PI / 2;
        const r = i % 2 === 0 ? 44 : 23;
        pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
      }
      return <polygon points={pts.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    case 'star_8': {
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8 - Math.PI / 2;
        const r = i % 2 === 0 ? 44 : 25;
        pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
      }
      return <polygon points={pts.join(' ')} {...commonProps} strokeLinejoin="round" />;
    }

    default:
      return <rect x="4" y="4" width="92" height="92" {...commonProps} />;
  }
}

export const IndustrialIconSvg: React.FC<{
  name: string;
  color?: string;
  className?: string;
}> = ({ name, color = '#000000', className = 'w-full h-full' }) => {
  switch (name) {
    case 'fragile':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15v6M8 21h8M6 3h12l-1.2 7.2a5 5 0 0 1-4.8 4.8 5 5 0 0 1-4.8-4.8L6 3Z" />
          <path d="M10 6.5l2.5 2.5-2 2.5" />
        </svg>
      );
    case 'this-side-up':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 17V5m0 0L5 8m3-3 3 3" />
          <path d="M16 17V5m0 0-3 3m3-3 3 3" />
          <path d="M4 21h16" />
        </svg>
      );
    case 'ce':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round">
          <path d="M10 6a6 6 0 1 0 0 12" />
          <path d="M21 6a6 6 0 1 0 0 12" />
          <path d="M15.2 12h4.3" />
        </svg>
      );
    case 'rohs':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M8 12.5l2.7 2.7 5.3-6" />
        </svg>
      );
    case 'recycle':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 19H4.8a1.5 1.5 0 0 1-1.3-2.25l2-3.5" />
          <path d="M11 19h5.2a1.5 1.5 0 0 0 1.3-2.25l-1.5-2.6" />
          <path d="M15.2 10.5l-2-3.5a1.5 1.5 0 0 0-2.6 0L8.8 10" />
          <path d="M14 17l-3 2 3 2" />
          <path d="M5.2 12l.8 3.3-3.2-.6" />
          <path d="M16.5 8.5l-.4 3.4-3-1.4" />
        </svg>
      );
    case 'warning':
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
};
