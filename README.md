# OpenLabel Studio 🏷️

> **工业级云端条码标签设计器与热敏打印工作站**  
> High-Precision Industrial Barcode & Label Designer with Clean-Room TSPL2 / ZPL II Hardware Compiler.

![OpenLabel Studio](https://img.shields.io/badge/OpenLabel-v1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📖 项目简介 (Overview)

**OpenLabel Studio** 是一款面向智能制造、仓储物流、医疗医药、电子元件及零售供应链的高精度纯前端工业标签设计软件。系统深度还原了专业工业打印软件（如 BarTender / NiceLabel）的核心交互模式，并搭载了自主研发的 **TSPL2 / ZPL II 纯净指令硬件编译器**，无需安装庞大的打印机驱动或专有中间件即可直接生成并输出面向主流工业打印机（TSC、斑马 Zebra、佳博 Gainscha、得力 Deli、博思得 Postek、科诚 Godex 等）的底层指令流。

---

## ✨ 核心特性 (Key Features)

### 1. 📐 毫米级物理交互画板 (Millimeter-Accurate Canvas)
- **真实毫米物理标尺**：顶部与左侧动态毫米标尺，随视口滚动和缩放无缝同步；状态栏实时显示当前鼠标的物理毫米坐标。
- **取消负数限制 / 无限工作台暂存区**：突破传统画板只能在 `(0, 0)` 内放置内容的限制，画布外圈拥有动态自适应的暂存区（Pasteboard），允许将图元任意放置在负数坐标区域或标签纸外部，便于暂存设计素材或制作拼版出血位。
- **负数坐标输入体验**：右侧属性栏与顶部快捷栏的 X/Y 坐标输入框原生支持输入负数（如 `-5.5mm`）及方向键微调，不会发生归零或字符被吞的问题。
- **等比例尺寸锁定**：二维码及指定图形支持一键 1:1 等比例锁定，在拖拽四个角落控制手柄或修改输入框时自动保持正方形比例。
- **多列与异形标签**：支持单排、双排、三排等多列标签设置，支持直角矩形、圆角矩形、椭圆圆形等异形切模预览，可调节纸张底色与 90° 步进旋转。

### 2. 🔲 工业条码与二维码全体系引擎 (Industrial 1D & 2D Barcode Engine)
- **60+ 一维条形码**：涵盖 CODE 128 (A/B/C)、CODE 39、EAN-13、EAN-8、UPC-A、UPC-E、ITF-14、Codabar、CODE 93、GS1-128 等主流标准，支持供人识读字符（Human Readable Text）开关及字体对齐。
- **6 大主流二维条码**：
  - **QR Code**：国际标准快速响应矩阵码。
  - **Data Matrix (ECC 200)**：精密电子元器件超小尺寸高密度码。
  - **PDF417**：高容量层排式堆叠条码（票证/物流专用）。
  - **汉信码 (HanXin Code)**：我国自主知识产权国标二维码，特别适合高密度汉字编码。
  - **Aztec Code**：中心靶心高容错率二维码（交通票证通用）。
  - **MaxiCode**：六边形蜂窝网状物流码（UPS 物流高速分拣专用）。
- **数学级精准视口缩放与防裁剪**：彻底解决小比例缩放时二维码边缘模块被裁切或模糊失真的问题，采用基于 SVG ViewBox Offset 的精准矢量居中渲染，并提供几何精度抗锯齿控制。
- **TSPL 码点比例控制 (Module Scale Dots)**：针对热敏打印机特性，提供 **自适应外框** 与 **1点 ~ 8点 (0.125mm ~ 1.0mm)** 物理点阵码点比例调节，配有「一键自动适配外框到码点尺寸」功能。

### 3. ⚙️ 硬件级 TSPL2 / ZPL II 指令编译器 (Hardware Clean-Room Compiler)
- **指令直接生成**：内置硬件编译器，将画板工程一键转译为原生热敏打印机机器指令：
  - `SIZE`、`GAP`、`SHIFT`、`DIRECTION`、`CLS`
  - `TEXT`（调用打印机内置点阵及矢量中英文字库）
  - `BARCODE`（调用打印机内置一维条码发生器）
  - `QRCODE` / `DMATRIX` / `PDF417`（硬件级二维码生成指令）
  - `BOX` / `BAR` / `REVERSE`（边框、线条与区域反白）
  - `PRINT`（份数与序列打印）
- **打印机直连指令工作站**：提供打印弹窗，支持一键复制代码、下载 `.prn` / `.tspl` 指令文件，或通过 WebSerial / USB API 发送到本地热敏打印设备。

### 4. 🔗 动态数据段多源拼接引擎 (Dynamic Data Segments)
每个文本、条码或二维码均可由多个数据段混合拼接（Concatenation）：
- **常量文本 (Constant)**：固定字符、前缀、标点或 URL。
- **动态序列号 (Serial)**：支持递增（Incremental）/ 递减（Decremental），自定义起始值、步长、每份重复次数与高位自动补零（Padding Width）。
- **日期与时间变量 (Date & Time)**：支持基于打印时间的当前日期，并可配置天数、月数或年份偏移（如 `生产日期 + 365天 = 保质期至`），提供多种格式化选项（`YYYY-MM-DD`、`YYYYMMDD`、`YYMM` 等）。
- **数据库/Excel 字段绑定 (Database Column)**：支持绑定导入的数据源字段，切换记录即时预览全局联动。
- **打印时即时输入 (Print-time Input)**：可在生产现场由作业员在打印前扫码或键盘输入（如操作员工号、批次号）。

### 5. 📊 丰富的版面与工业图元库 (Layout & Industrial Elements)
- **40+ 工业几何图形**：
  - 基础几何：矩形、圆角矩形、切角矩形、圆形、椭圆形、胶囊形。
  - 线条与尺寸箭头：水平线、垂直线、斜线、单向箭头、双向箭头、左右中括号、尺寸标注线。
  - 包装与安全图标：三角警示（Hazard Triangle）、禁止标志（Prohibition）、医疗十字、安全护盾、纸箱方块、圆柱体、吊牌勋章等。
  - 多边形与星形：三角形、菱形、平行四边形、梯形、正五边形、正六边形、八边形、各种芒星。
- **可编辑数据表格 (Editable Table)**：自由设定行数、列数、线宽、表头行，支持在画板上双击单元格直接编辑文字。
- **图片与 OCR 智能识别**：支持导入本地图片（JPG/PNG/SVG/WebP），并搭载 OCR 识别弹窗，提取已有标签上的图文信息快速生成元素。
- **行业图标库 (Icon Picker)**：内置 100+ 工业制造、物流防潮、向上倾倒、环保回收、电气安全等常用符号。
- **区域反白 (Reverse Video)**：工业标签经典黑底白字反白框。

### 6. 🗂️ 多标签页与工程管理 (Tabs & Project Management)
- **多标签页并行编辑**：支持新建、关闭、切换多个标签工程（`New Label1`, `New Label2`...）。
- **撤销 / 重做历史栈 (Undo/Redo)**：全操作支持 `Ctrl+Z` / `Ctrl+Y`，历史栈最高保存 30 步状态。
- **模板导入导出**：工程保存为开放的 `.olabel` JSON 格式文件，自带电子元器件、服装吊牌、化学试剂、物流箱唛等典型预置模板。

---

## 🏗️ 目录结构 (Directory Structure)

```text
openlabel-studio/
├── .env.example              # 环境变量配置示例
├── index.html                # 入口 HTML，含防御性全局配置与安全注入防护
├── metadata.json             # 平台元数据与应用配置
├── package.json              # 依赖管理与执行脚本
├── tsconfig.json             # TypeScript 编译器配置
├── vite.config.ts            # Vite 构建配置（Tailwind v4 插件）
└── src/
    ├── App.tsx               # 应用主容器、三栏工作区架构与工程状态机
    ├── index.css             # Tailwind CSS 全局样式
    ├── main.tsx              # React 根节点挂载入口
    ├── components/           # UI 组件库
    │   ├── BarcodePickerModal.tsx   # 60+ 条码全量选择弹窗
    │   ├── BarcodeRenderer.tsx      # 一维条码矢量渲染器
    │   ├── CanvasArea.tsx           # 毫米级高精度交互画板（标尺、缩放、暂存区）
    │   ├── DatabaseManagerModal.tsx # Excel / CSV 数据库表格管理弹窗
    │   ├── IconPickerModal.tsx      # 工业图标选择器
    │   ├── LeftToolbox.tsx          # 左侧双列工业工具箱（10大常用工具）
    │   ├── NewLabelModal.tsx        # 新建标签与纸张规格配置弹窗
    │   ├── OcrModal.tsx             # OCR 文字识别弹窗
    │   ├── PrintDialog.tsx          # 打印工作站与 TSPL/ZPL 指令输出弹窗
    │   ├── QrCodeRenderer.tsx       # 高精度二维条码矢量渲染器（防裁剪视口计算）
    │   ├── RightInspector.tsx       # 右侧属性上下文检查器（支持负数坐标与码点比例）
    │   ├── Ruler.tsx                # 物理毫米刻度标尺（正负数刻度自适应）
    │   ├── RustArchitectureModal.tsx# 纯安全 Rust / TSPL 编译器技术架构规范
    │   └── TopToolbar.tsx           # 顶部工具栏、标签页管理与快速定位
    ├── data/
    │   └── sampleTemplates.ts       # 工业预置模板库（汽车零部件、医疗耗材、物流箱唛等）
    ├── engine/
    │   ├── evaluator.ts             # 数据段多源拼接、流水号运算与日期格式化求值器
    │   └── tspl_compiler.ts         # TSPL2 底层热敏指令转译编译器
    └── types/
        └── model.ts                 # 完整的标签工程、图元、字体、条码数据类型定义
```

---

## 🚀 快速上手 (Getting Started)

### 前置环境 (Prerequisites)
- [Node.js](https://nodejs.org/) (推荐 v18.0.0 及以上版本)
- npm / yarn / pnpm / bun

### 安装与运行 (Installation & Development)

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-username/openlabel-studio.git
cd openlabel-studio

# 2. 安装项目依赖
npm install

# 3. 启动本地开发服务器
npm run dev
```

启动后在浏览器中打开 `http://localhost:3000` 即可开始设计标签。

### 项目构建与打包 (Build for Production)

```bash
# 构建生产环境代码
npm run build

# 预览生产构建结果
npm run preview
```

构建产物将输出在 `dist/` 目录中，可直接部署至任何静态 Web 托管服务（Vercel、Cloudflare Pages、GitHub Pages、Nginx、Docker 等）。

---

## 🛠️ 典型使用工作流 (Workflow Guide)

### 1. 配置标签规格与纸张
点击顶部工具栏的 **「标签设置」** 或在无图元选中时查看右侧属性栏：
- 输入标签纸的物理 **宽度 (Width)** 和 **高度 (Height)**（单位：mm）。
- 设定标签间隙（Gap，如 2mm 或 3mm）与排数（如单排、三排）。
- 选择标签外形（直角矩形、圆角矩形、圆形椭圆）。

### 2. 插入并微调二维码
1. 从左侧工具箱点击 **「二维码 (QR Code)」** 下拉菜单，选择所需的二维条码种类（QR Code、Data Matrix、PDF417 等）。
2. 在画板上选中二维码，右侧属性栏将展开专用配置面板：
   - **码点小比例 (Module Scale)**：选择「自适应外框」或固定码点大小（如 `3点 (0.375mm)`）。
   - **一键匹配尺寸**：点击「调整外框匹配码点」，画板外框将自动精准对齐二维码的物理点阵尺寸。
   - **等比锁定**：确保 `1:1 等比锁定` 开启，拖拽角落把手保持规整正方形。
   - **内容段拼接**：在数据源段中点击「+ 添加数据段」，可自由混合常量、自增流水号、生产日期等。

### 3. 使用无限暂存区与负数坐标
- 可直接将任一元素拖出标签纸白色区域，放置在周围灰色的工作台暂存区中。
- 顶部工具栏和右侧面板均支持在 X/Y 坐标中直接输入负数（如 `-15mm`）。
- 顶部与左侧标尺的零点始终紧贴标签纸边缘，负数区域标尺将清晰展示 `-10`、`-20` 等对应刻度。

### 4. 生成 TSPL2 / ZPL 打印指令
1. 标签设计完成后，点击顶部工具栏右侧的 **「打印 (Print)」** 按钮。
2. 在弹出的 **硬件打印工作站** 对话框中：
   - 切换 **TSPL2 (TSC/佳博/得力)** 或 **ZPL II (斑马)** 编译器。
   - 选择打印机分辨率（203 DPI 或 300 DPI）。
   - 设置打印份数（Copies）与序列起始记录。
3. 可即时在右侧代码区查看生成的指令，支持「复制指令」、「下载 .prn 文件」或通过本地打印代理直接发送。

---

## 💻 技术栈与工程实现 (Tech Stack)

| 领域 | 技术方案 | 作用说明 |
| :--- | :--- | :--- |
| **框架** | React 19 + TypeScript | 函数式组件、强类型工业数据模型 |
| **构建工具** | Vite 8 + @tailwindcss/vite | 极速冷启动与微秒级热重载 |
| **样式体系** | Tailwind CSS v4 | 纯原子类设计，无额外冗余 CSS |
| **矢量与条码** | JsBarcode + QRCode | 纯前端动态 SVG 矢量条码绘制 |
| **动画效果** | Motion | 丝滑弹窗动画与状态过渡 |
| **图元计算** | Clean-Room TSPL2 Engine | 毫米至打印机点阵转换、TSPL2 纯净机器码输出 |

---

## 🤝 贡献指南 (Contributing)

欢迎提交 Issue 和 Pull Request 来完善 OpenLabel Studio！
1. Fork 本仓库并新建分支：`git checkout -b feature/amazing-feature`
2. 提交你的修改：`git commit -m 'feat: add some amazing feature'`
3. 推送至远程分支：`git push origin feature/amazing-feature`
4. 提交 Pull Request。

---

## 📄 开源许可证 (License)

本项目基于 [MIT 许可证](LICENSE) 开源。
可免费用于商业产品、工业标签生产线及私有化部署。
