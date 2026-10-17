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

export type BarcodeSymbology = 'code128' | 'code39' | 'ean13' | 'upca';
export type ShapeKind = 'rectangle' | 'line' | 'circle';

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
      segments: DataSegment[];
      activeSegmentIdx: number;
      errorCorrection: 'L' | 'M' | 'Q' | 'H';
      prompt: PromptConfig;
    }
  | {
      type: 'graph';
      shape: ShapeKind;
      lineThicknessMm: number;
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
