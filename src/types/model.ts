export type PaperShape = 'sharp' | 'rounded' | 'ellipse';

export interface PaperSetup {
  widthMm: number;
  heightMm: number;
  columns: number;
  gapMm: number;
  offsetLeftRightMm: number;
  offsetUpDownMm: number;
  shape: PaperShape;
  backgroundHex: string;
  rotationDeg: 0 | 90 | 180 | 270;
}

export type CounterDirection = 'incremental' | 'reduction';

export type DataSegment =
  | {
      type: 'constant';
      text: string;
    }
  | {
      type: 'database';
      sourceName: string;
      headerField: string;
      showHeaderPrefix: boolean;
      dataType: 'Text' | 'Number' | 'Date';
    }
  | {
      type: 'serial';
      startValue: number;
      direction: CounterDirection;
      repeat: number;
      interval: number;
      memory: boolean;
      paddingWidth: number;
    }
  | {
      type: 'date';
      realTime: boolean;
      format: string; // e.g. "yyyy年MM月dd日(数字)" | "yyyy-MM-dd" | "yyyy/MM/dd"
      yearOffset: number;
      monthOffset: number;
      dayOffset: number;
    }
  | {
      type: 'time';
      realTime: boolean;
      format: string; // e.g. "HH:mm:ss"
      minuteOffset: number;
    };

export type TextDirection = 'horizontal' | 'vertical' | 'arc';
export type TextAlign = 'left' | 'center' | 'right' | 'justify' | 'distribute';

export interface FontStyle {
  family: string;
  sizePt: number;
  direction: TextDirection;
  align: TextAlign;
  wordSpacePt: number;
  scalePercent: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  mirrorHorizontal: boolean;
  reverseVideo: boolean; // White text on black background
  color: string;
}

export interface PromptConfig {
  sharedFieldName?: string;
  printTimeInput: boolean;
  promptHint: string;
}

export type BarcodeSymbology =
  | 'code128'
  | 'code128a'
  | 'code128b'
  | 'code128c'
  | 'codabar'
  | 'code39'
  | 'code39ext'
  | 'code93'
  | 'code16k'
  | 'code49'
  | 'ean13'
  | 'ean8'
  | 'upca'
  | 'upce'
  | 'itf14'
  | 'itf'
  | 'gs1-128'
  | 'pharmacode';

export type TwoDCodeType =
  | 'QR_Code'
  | 'PDF_417'
  | 'HANXIN'
  | 'DATA_MATRIX'
  | 'AZTEC'
  | 'MAXICODE';

export type ShapeCategory = 'basic' | 'lines_arrows' | 'industrial_safety' | 'polygons_stars';

export type ShapeKind =
  // Basic Shapes
  | 'rectangle'
  | 'rounded_rect'
  | 'circle'
  | 'ellipse'
  | 'capsule'
  | 'snip_corner_rect'
  // Lines & Arrows
  | 'line'
  | 'vertical_line'
  | 'diagonal_line_up'
  | 'diagonal_line_down'
  | 'arrow'
  | 'arrow_left'
  | 'arrow_up'
  | 'arrow_down'
  | 'double_arrow'
  | 'double_arrow_v'
  | 'bracket_left'
  | 'bracket_right'
  | 'brace_left'
  | 'brace_right'
  | 'corner_bracket'
  | 'dimension_line'
  // Industrial, Safety & Packaging
  | 'hazard_triangle'
  | 'prohibition'
  | 'cross'
  | 'shield'
  | 'tag_shape'
  | 'burst_seal'
  | 'speech_bubble'
  | 'cylinder'
  | 'cube'
  // Polygons & Stars
  | 'triangle'
  | 'triangle_down'
  | 'triangle_right'
  | 'diamond'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'star_4'
  | 'star_6'
  | 'star_8';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export type ElementKind =
  | {
      type: 'text';
      segments: DataSegment[];
      activeSegmentIdx: number;
      font: FontStyle;
      prompt: PromptConfig;
    }
  | {
      type: 'barcode';
      symbology: BarcodeSymbology;
      segments: DataSegment[];
      activeSegmentIdx: number;
      showHumanReadable: boolean;
      font: FontStyle;
      prompt: PromptConfig;
    }
  | {
      type: 'qrcode';
      codeType: TwoDCodeType;
      segments: DataSegment[];
      activeSegmentIdx: number;
      errorCorrection: 'L' | 'M' | 'Q' | 'H';
      cellWidthDots?: number; // TSPL module scale: 1 to 10 dots (小比例 / 码点放大倍数)
      scalePercent?: number; // Internal scale ratio: 30% - 150% (default 100%)
      marginModules?: number; // Quiet zone margin in modules (0, 1, 2, 4, default 1)
      lockAspectRatio?: boolean; // Keep 1:1 square ratio
      autoFitBox?: boolean; // Auto-fit to outer bounding box (default true)
      prompt: PromptConfig;
    }
  | {
      type: 'graph';
      shape: ShapeKind;
      lineThicknessMm: number;
      lineStyle?: LineStyle;
      cornerRadiusMm?: number;
      filled: boolean;
      strokeColor: string;
      fillColor: string;
    }
  | {
      type: 'table';
      rows: number;
      cols: number;
      lineThicknessMm: number;
      cells: string[][];
      headerRow?: boolean;
      fontSizePt?: number;
      align?: 'left' | 'center' | 'right';
      borderColor?: string;
      headerBgColor?: string;
    }
  | {
      type: 'reverse'; // Reverse video area
    }
  | {
      type: 'image';
      src: string;
      aspectRatioLock: boolean;
    }
  | {
      type: 'icon';
      iconName: string;
      color: string;
    };

export interface LabelElement {
  id: string;
  name: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  locked: boolean;
  kind: ElementKind;
}

export interface DataTable {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface LabelProject {
  id: string;
  name: string;
  paper: PaperSetup;
  elements: LabelElement[];
  database?: DataTable;
  currentRecordIndex: number;
  sharedFields: Record<string, string>;
}

export const DEFAULT_PAPER: PaperSetup = {
  widthMm: 70.0,
  heightMm: 50.0,
  columns: 1,
  gapMm: 2.0,
  offsetLeftRightMm: 0.0,
  offsetUpDownMm: 0.0,
  shape: 'rounded',
  backgroundHex: '#ffffff',
  rotationDeg: 0,
};

export const DEFAULT_FONT: FontStyle = {
  family: 'Microsoft YaHei',
  sizePt: 9.0,
  direction: 'horizontal',
  align: 'distribute',
  wordSpacePt: 0.0,
  scalePercent: 100.0,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  mirrorHorizontal: false,
  reverseVideo: false,
  color: '#000000',
};

export const DEFAULT_PROMPT: PromptConfig = {
  sharedFieldName: undefined,
  printTimeInput: false,
  promptHint: '',
};
