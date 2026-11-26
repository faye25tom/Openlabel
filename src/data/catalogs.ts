import { BarcodeSymbology, ShapeKind, TwoDCodeType } from '../types/model';

export interface BarcodeSymbologyInfo {
  id: BarcodeSymbology;
  name: string;
  shortTag: string;
  category: 'Common' | 'Standard' | 'Postal/Pharma';
  description: string;
  quickCommon?: boolean;
}

export const BARCODE_SYMBOLOGIES: BarcodeSymbologyInfo[] = [
  {
    id: 'code128',
    name: 'CODE 128',
    shortTag: '通用全能',
    category: 'Common',
    description: 'Universal high-density alphanumeric',
    quickCommon: true,
  },
  {
    id: 'code39',
    name: 'CODE 39',
    shortTag: '工业制造',
    category: 'Common',
    description: 'Automotive and defense industrial standard',
    quickCommon: true,
  },
  {
    id: 'ean13',
    name: 'EAN-13',
    shortTag: '商品零售',
    category: 'Common',
    description: 'International retail consumer product code',
    quickCommon: true,
  },
  {
    id: 'ean8',
    name: 'EAN-8',
    shortTag: '小商品码',
    category: 'Common',
    description: 'Compact retail packages code',
    quickCommon: true,
  },
  {
    id: 'upca',
    name: 'UPC-A',
    shortTag: '北美零售',
    category: 'Common',
    description: 'North American retail barcode standard',
    quickCommon: true,
  },
  {
    id: 'upce',
    name: 'UPC-E',
    shortTag: '紧凑UPC',
    category: 'Common',
    description: 'Zero-suppressed compact UPC code',
    quickCommon: true,
  },
  {
    id: 'itf14',
    name: 'ITF-14',
    shortTag: '外箱包装',
    category: 'Standard',
    description: 'Master shipping carton 14-digit code',
    quickCommon: true,
  },
  {
    id: 'codabar',
    name: 'CODABAR',
    shortTag: '仓储物流',
    category: 'Common',
    description: 'Library, blood bank, delivery logistics',
    quickCommon: true,
  },
  {
    id: 'code93',
    name: 'CODE 93',
    shortTag: '高密度码',
    category: 'Standard',
    description: 'High density compact Code 39 successor',
    quickCommon: true,
  },
  {
    id: 'gs1-128',
    name: 'GS1-128',
    shortTag: '供应链',
    category: 'Standard',
    description: 'Global supply chain application identifiers',
    quickCommon: true,
  },
  {
    id: 'code128a',
    name: 'CODE128 A',
    shortTag: 'A字符集',
    category: 'Standard',
    description: 'Uppercase letters, numbers, control codes',
  },
  {
    id: 'code128b',
    name: 'CODE128 B',
    shortTag: 'B字符集',
    category: 'Standard',
    description: 'Upper & lowercase letters and numbers',
  },
  {
    id: 'code128c',
    name: 'CODE128 C',
    shortTag: '双密度数字',
    category: 'Standard',
    description: 'Double density numeric digits (00-99)',
  },
  {
    id: 'code16k',
    name: 'CODE 16K',
    shortTag: '多行堆叠',
    category: 'Standard',
    description: 'Multi-row stacked high-density symbology',
  },
  {
    id: 'code49',
    name: 'CODE 49',
    shortTag: '超紧凑堆叠',
    category: 'Standard',
    description: 'Ultra-compact stacked 2D barcode',
  },
  {
    id: 'code39ext',
    name: 'CODE 39 EXTENDED',
    shortTag: '全ASCII',
    category: 'Standard',
    description: 'Full 128 ASCII Code 39 extension',
  },
  {
    id: 'itf',
    name: 'INTERLEAVED 2 OF 5',
    shortTag: '交叉25码',
    category: 'Standard',
    description: 'Warehouse distribution numeric code',
  },
  {
    id: 'pharmacode',
    name: 'PHARMACODE',
    shortTag: '医药包装',
    category: 'Postal/Pharma',
    description: 'Pharmaceutical packaging control code',
  },
];

export interface TwoDCodeInfo {
  type: TwoDCodeType;
  label: string;
  shortLabel: string;
  desc: string;
}

export const TWO_D_CODE_TYPES: TwoDCodeInfo[] = [
  { type: 'QR_Code', label: 'QR Code', shortLabel: 'QR Code', desc: '标准二维码 (工业/追溯)' },
  { type: 'DATA_MATRIX', label: 'Data Matrix', shortLabel: 'DataMatrix', desc: '微型紧凑 (精密元件)' },
  { type: 'PDF_417', label: 'PDF417', shortLabel: 'PDF-417', desc: '高容量层排 (登机牌/票证)' },
  { type: 'HANXIN', label: '汉信码', shortLabel: 'Han Xin', desc: '国标自主汉字码' },
  { type: 'AZTEC', label: 'Aztec Code', shortLabel: 'Aztec', desc: '中心靶心高密度' },
  { type: 'MAXICODE', label: 'MaxiCode', shortLabel: 'MaxiCode', desc: '六边形蜂窝 (UPS物流)' },
];

export type ShapeCatalogCategory = 'basic' | 'lines' | 'safety' | 'polygons';

export interface ShapeCatalogItem {
  shape: ShapeKind;
  label: string;
  zhLabel: string;
  category: ShapeCatalogCategory;
}

export const SHAPE_CATALOG: ShapeCatalogItem[] = [
  // Basic Shapes (6)
  { shape: 'rectangle', label: 'Rect', zhLabel: '矩形', category: 'basic' },
  { shape: 'rounded_rect', label: 'Rounded', zhLabel: '圆角矩形', category: 'basic' },
  { shape: 'circle', label: 'Circle', zhLabel: '圆形', category: 'basic' },
  { shape: 'ellipse', label: 'Ellipse', zhLabel: '椭圆', category: 'basic' },
  { shape: 'capsule', label: 'Capsule', zhLabel: '胶囊', category: 'basic' },
  { shape: 'snip_corner_rect', label: 'Snip Rect', zhLabel: '切角矩形', category: 'basic' },

  // Lines & Arrows (16)
  { shape: 'line', label: 'H-Line', zhLabel: '水平线', category: 'lines' },
  { shape: 'vertical_line', label: 'V-Line', zhLabel: '垂直线', category: 'lines' },
  { shape: 'diagonal_line_up', label: 'Diag Up', zhLabel: '斜上线', category: 'lines' },
  { shape: 'diagonal_line_down', label: 'Diag Down', zhLabel: '斜下线', category: 'lines' },
  { shape: 'arrow', label: 'Arrow R', zhLabel: '右箭头', category: 'lines' },
  { shape: 'arrow_left', label: 'Arrow L', zhLabel: '左箭头', category: 'lines' },
  { shape: 'arrow_up', label: 'Arrow U', zhLabel: '上箭头', category: 'lines' },
  { shape: 'arrow_down', label: 'Arrow D', zhLabel: '下箭头', category: 'lines' },
  { shape: 'double_arrow', label: 'D-Arrow H', zhLabel: '双向水平', category: 'lines' },
  { shape: 'double_arrow_v', label: 'D-Arrow V', zhLabel: '双向垂直', category: 'lines' },
  { shape: 'bracket_left', label: 'Bracket L', zhLabel: '左中括号', category: 'lines' },
  { shape: 'bracket_right', label: 'Bracket R', zhLabel: '右中括号', category: 'lines' },
  { shape: 'brace_left', label: 'Brace L', zhLabel: '左大括号', category: 'lines' },
  { shape: 'brace_right', label: 'Brace R', zhLabel: '右大括号', category: 'lines' },
  { shape: 'corner_bracket', label: 'Corner', zhLabel: '拐角标尺', category: 'lines' },
  { shape: 'dimension_line', label: 'Dimension', zhLabel: '标注尺寸', category: 'lines' },

  // Industrial, Safety & Packaging (9)
  { shape: 'hazard_triangle', label: 'Hazard', zhLabel: '三角警示', category: 'safety' },
  { shape: 'prohibition', label: 'Prohibit', zhLabel: '禁止标志', category: 'safety' },
  { shape: 'cross', label: 'Cross', zhLabel: '医疗十字', category: 'safety' },
  { shape: 'shield', label: 'Shield', zhLabel: '安全护盾', category: 'safety' },
  { shape: 'tag_shape', label: 'Tag', zhLabel: '吊牌形状', category: 'safety' },
  { shape: 'burst_seal', label: 'Seal Badge', zhLabel: '印章勋章', category: 'safety' },
  { shape: 'speech_bubble', label: 'Callout', zhLabel: '对话气泡', category: 'safety' },
  { shape: 'cube', label: 'Carton Box', zhLabel: '纸箱方块', category: 'safety' },
  { shape: 'cylinder', label: 'Cylinder', zhLabel: '圆柱体', category: 'safety' },

  // Polygons & Stars (13)
  { shape: 'triangle', label: 'Triangle', zhLabel: '正三角形', category: 'polygons' },
  { shape: 'triangle_down', label: 'Tri Down', zhLabel: '倒三角形', category: 'polygons' },
  { shape: 'triangle_right', label: 'Tri Right', zhLabel: '右向三角', category: 'polygons' },
  { shape: 'diamond', label: 'Diamond', zhLabel: '菱形', category: 'polygons' },
  { shape: 'parallelogram', label: 'Parallelo', zhLabel: '平行四边形', category: 'polygons' },
  { shape: 'trapezoid', label: 'Trapezoid', zhLabel: '等腰梯形', category: 'polygons' },
  { shape: 'pentagon', label: 'Pentagon', zhLabel: '正五边形', category: 'polygons' },
  { shape: 'hexagon', label: 'Hexagon', zhLabel: '正六边形', category: 'polygons' },
  { shape: 'octagon', label: 'Octagon', zhLabel: '正八边形', category: 'polygons' },
  { shape: 'star', label: '5-Star', zhLabel: '五角星', category: 'polygons' },
  { shape: 'star_4', label: '4-Star', zhLabel: '四角星', category: 'polygons' },
  { shape: 'star_6', label: '6-Star', zhLabel: '六角星', category: 'polygons' },
  { shape: 'star_8', label: '8-Star', zhLabel: '八角星', category: 'polygons' },
];

export interface IndustrialIconInfo {
  id: string;
  name: string;
  zhName: string;
  standard: string;
}

export const INDUSTRIAL_ICONS: IndustrialIconInfo[] = [
  { id: 'warning', name: 'Caution / Warning', zhName: '注意 / 警告', standard: 'ISO 7010 W001' },
  { id: 'fragile', name: 'Fragile Handle With Care', zhName: '易碎物品 小心轻放', standard: 'ISO 780' },
  { id: 'this-side-up', name: 'This Side Up Arrows', zhName: '向上竖放', standard: 'ISO 780' },
  { id: 'ce', name: 'CE Conformity Mark', zhName: 'CE 欧盟认证标志', standard: 'EU Directive' },
  { id: 'rohs', name: 'RoHS Compliant', zhName: 'RoHS 环保认证', standard: '2011/65/EU' },
  { id: 'recycle', name: 'Recyclable Packaging', zhName: '可循环回收标志', standard: 'ISO 14021' },
];

export interface PaperPreset {
  label: string;
  widthMm: number;
  heightMm: number;
  columns: number;
}

export const PAPER_PRESETS: PaperPreset[] = [
  { label: '70×50mm, 1列', widthMm: 70, heightMm: 50, columns: 1 },
  { label: '50×30mm, 1列', widthMm: 50, heightMm: 30, columns: 1 },
  { label: '40×30mm, 1列', widthMm: 40, heightMm: 30, columns: 1 },
  { label: '100×150mm, 1列', widthMm: 100, heightMm: 150, columns: 1 },
];

export const FONT_FAMILIES = [
  { value: 'Microsoft YaHei', label: '微软雅黑 (Microsoft YaHei)' },
  { value: 'SimSun', label: '宋体 (SimSun)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Courier New', label: 'Courier New' },
];
