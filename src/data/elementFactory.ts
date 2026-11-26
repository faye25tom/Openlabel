import {
  BarcodeSymbology,
  DEFAULT_FONT,
  DEFAULT_PAPER,
  DEFAULT_PROMPT,
  LabelElement,
  LabelProject,
  ShapeKind,
  TwoDCodeType,
} from '../types/model';

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function createTextElement(initialText = '双击编辑文字内容'): LabelElement {
  return {
    id: nextId('el'),
    name: 'Text',
    xMm: 6,
    yMm: 6,
    widthMm: 45,
    heightMm: 8,
    locked: false,
    kind: {
      type: 'text',
      segments: [{ type: 'constant', text: initialText }],
      activeSegmentIdx: 0,
      font: { ...DEFAULT_FONT },
      prompt: { ...DEFAULT_PROMPT },
    },
  };
}

export function createBarcodeElement(symbology: BarcodeSymbology = 'code128'): LabelElement {
  return {
    id: nextId('el'),
    name: `BarCode (${symbology.toUpperCase()})`,
    xMm: 6,
    yMm: 15,
    widthMm: 50,
    heightMm: 16,
    locked: false,
    kind: {
      type: 'barcode',
      symbology,
      segments: [
        {
          type: 'serial',
          startValue: 10001,
          direction: 'incremental',
          repeat: 1,
          interval: 1,
          memory: false,
          paddingWidth: 5,
        },
      ],
      activeSegmentIdx: 0,
      showHumanReadable: true,
      font: { ...DEFAULT_FONT, sizePt: 8, align: 'center' },
      prompt: { ...DEFAULT_PROMPT },
    },
  };
}

export function createQrElement(codeType: TwoDCodeType = 'QR_Code'): LabelElement {
  return {
    id: nextId('el'),
    name: codeType,
    xMm: 10,
    yMm: 10,
    widthMm: codeType === 'PDF_417' ? 40 : 22,
    heightMm: codeType === 'PDF_417' ? 18 : 22,
    locked: false,
    kind: {
      type: 'qrcode',
      codeType,
      segments: [{ type: 'constant', text: 'https://openlabel.local/trace/001' }],
      activeSegmentIdx: 0,
      errorCorrection: 'M',
      scalePercent: 100,
      marginModules: 1,
      lockAspectRatio: codeType !== 'PDF_417',
      prompt: { ...DEFAULT_PROMPT },
    },
  };
}

export function createGraphElement(shape: ShapeKind): LabelElement {
  const isLine =
    shape === 'line' || shape === 'diagonal_line_up' || shape === 'diagonal_line_down';
  const isVertLine = shape === 'vertical_line' || shape === 'double_arrow_v';
  return {
    id: nextId('el'),
    name: shape.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    xMm: 5,
    yMm: 5,
    widthMm: isLine ? 55 : isVertLine ? 4 : 25,
    heightMm: isLine ? 4 : isVertLine ? 40 : 25,
    locked: false,
    kind: {
      type: 'graph',
      shape,
      lineThicknessMm: 0.5,
      lineStyle: 'solid',
      cornerRadiusMm: shape === 'rounded_rect' ? 3 : shape === 'snip_corner_rect' ? 4 : 0,
      filled: false,
      strokeColor: '#000000',
      fillColor: '#ffffff',
    },
  };
}

export function createTableElement(): LabelElement {
  return {
    id: nextId('el'),
    name: 'Table',
    xMm: 5,
    yMm: 5,
    widthMm: 60,
    heightMm: 25,
    locked: false,
    kind: {
      type: 'table',
      rows: 3,
      cols: 3,
      lineThicknessMm: 0.3,
      headerRow: true,
      fontSizePt: 8,
      align: 'center',
      cells: [
        ['Item', 'Qty', 'Result'],
        ['SMT-PCB', '10', 'PASS'],
        ['SENSOR', '5', 'PASS'],
      ],
    },
  };
}

export function createReverseElement(): LabelElement {
  return {
    id: nextId('el'),
    name: 'Reverse Area',
    xMm: 6,
    yMm: 6,
    widthMm: 35,
    heightMm: 12,
    locked: false,
    kind: {
      type: 'reverse',
    },
  };
}

export function createIconElement(iconName: string): LabelElement {
  return {
    id: nextId('el-icon'),
    name: 'Icon',
    xMm: 12,
    yMm: 12,
    widthMm: 14,
    heightMm: 14,
    locked: false,
    kind: {
      type: 'icon',
      iconName,
      color: '#000000',
    },
  };
}

export function createImageElement(src: string): LabelElement {
  return {
    id: nextId('el'),
    name: 'Image',
    xMm: 10,
    yMm: 10,
    widthMm: 25,
    heightMm: 25,
    locked: false,
    kind: {
      type: 'image',
      src,
      aspectRatioLock: true,
    },
  };
}

export function createBlankProject(name: string): LabelProject {
  const starter = createTextElement('Double click to input content');
  starter.xMm = 10;
  starter.yMm = 12;
  return {
    id: `proj-${Date.now()}`,
    name,
    paper: { ...DEFAULT_PAPER },
    elements: [starter],
    currentRecordIndex: 0,
    sharedFields: {},
  };
}
