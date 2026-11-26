import React, { useState } from 'react';
import { Check, Copy, Cpu } from 'lucide-react';
import { ModalShell } from '../ui/ModalShell';

interface RustArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ARCH_FILES: Record<string, { title: string; layer: string; code: string }> = {
  'AGENTS.md': {
    title: 'AGENTS.md',
    layer: 'Constitution',
    code: `# OpenLabel 工程宪法 (AGENTS.md)

## 1. 铁律：Never Crash & Pure Safe Rust
- 全仓强制启用 \`#![forbid(unsafe_code)]\`。
- 严禁在生产路径中使用 \`.unwrap()\` 或 \`.expect()\`。所有错误必须通过 \`Result<T, OlError>\` 传播。
- 算术运算（毫米转像素、序列号步进、日期偏移）必须处理溢出边界。

## 2. 净室合规与资产溯源 (Clean-room & Attribution)
- 100% 净室工程重构，严禁反编译商业二进制代码。
- 所有实现基于公开行业标准（GS1, ISO/IEC 18004, TSPL2, ZPL II）与黑盒视觉观察。

## 3. 严格单向分层架构 (L0 -> L6)
- L0 (ol_math): 物理毫米/点/DPI与几何转换。
- L1 (ol_model): 不可变文档树、5类动态数据源与排版属性。
- L2 (ol_eval & ol_io): 序列号/日期偏移求值与 TSPL2/ZPL II 热敏指令编译器。
- L3 (ol_render): 双轨渲染（CPU 确定性 tiny-skia + GPU 视口）。
- L4 (ol_session): CoW 零锁 Undo/Redo 命令总线。
- L5 (ol_mcp): JSON-Lines 控制协议与 MCP 视觉闭环。
- L6 (ol_gui): egui/eframe 1:1 视觉还原桌面端。`,
  },
  'Cargo.toml': {
    title: 'Cargo.toml',
    layer: 'Workspace',
    code: `[workspace]
resolver = "2"
members = [
    "xtask",
    "crates/ol_math",
    "crates/ol_model",
    "crates/ol_eval",
    "crates/ol_io",
    "crates/ol_render",
    "crates/ol_session",
    "crates/ol_mcp",
    "crates/ol_gui",
]

[workspace.lints.rust]
unsafe_code = "forbid"
missing_debug_implementations = "warn"

[workspace.lints.clippy]
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"`,
  },
  'crates/ol_math/src/lib.rs': {
    title: 'crates/ol_math/src/lib.rs',
    layer: 'L0: Math & Geometry',
    code: `//! L0: 物理毫米 (Mm)、点 (Pt)、分辨率 (Dpi) 精确换算
#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize, Default)]
pub struct Mm(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Dpi(pub u32);

impl Default for Dpi {
    fn default() -> Self {
        Self(203) // 工业条码打印机标准 203 DPI (8 dots/mm)
    }
}

impl Mm {
    pub const ZERO: Self = Self(0.0);

    #[must_use]
    pub fn to_dots(self, dpi: Dpi) -> f64 {
        (self.0 * f64::from(dpi.0)) / 25.4
    }

    #[must_use]
    pub fn to_printer_dots_i32(self, dpi: Dpi) -> i32 {
        self.to_dots(dpi).round() as i32
    }
}`,
  },
  'crates/ol_eval/src/lib.rs': {
    title: 'crates/ol_eval/src/lib.rs',
    layer: 'L2: Evaluator',
    code: `//! L2: 动态数据源求值器 (Serial, Date Offsets, Database)
#![forbid(unsafe_code)]

use ol_model::CounterDirection;

#[must_use]
pub fn evaluate_serial(start: i64, dir: CounterDirection, seq: u32, repeat: u32, interval: i64, padding: usize) -> String {
    let safe_repeat = repeat.max(1);
    let steps = i64::from(seq / safe_repeat);
    let delta = steps.saturating_mul(interval);
    let val = match dir {
        CounterDirection::Incremental => start.saturating_add(delta),
        CounterDirection::Reduction => start.saturating_sub(delta),
    };
    if padding > 0 && val >= 0 {
        format!("{val:0>width$}", width = padding)
    } else {
        val.to_string()
    }
}`,
  },
  'crates/ol_io/src/lib.rs': {
    title: 'crates/ol_io/src/lib.rs',
    layer: 'L2: TSPL2/ZPL Compiler',
    code: `//! L2: 工业热敏打印机原生指令集编译器 (TSPL2 / ZPL II)
#![forbid(unsafe_code)]

use ol_math::Dpi;
use ol_model::LabelProject;

#[must_use]
pub fn compile_to_tspl2(project: &LabelProject, dpi: Dpi) -> String {
    let mut out = String::new();
    out.push_str(&format!("SIZE {:.1} mm, {:.1} mm\\r\\n", project.paper.width.0, project.paper.height.0));
    out.push_str(&format!("GAP {:.1} mm, 0 mm\\r\\n", project.paper.gap.0));
    out.push_str("DIRECTION 1,0\\r\\nCLS\\r\\n");
    out.push_str("PRINT 1,1\\r\\n");
    out
}`,
  },
};

export const RustArchitectureModal: React.FC<RustArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('AGENTS.md');
  const [copied, setCopied] = useState<boolean>(false);

  const current = ARCH_FILES[selectedFile] || ARCH_FILES['AGENTS.md'];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="OpenLabel Pure Safe Rust & MCP Clean-Room Architecture"
      subtitle="单向分层内核规范与热敏指令编译架构参考"
      icon={<Cpu className="w-4 h-4" />}
      maxWidthClass="max-w-[900px] w-full"
      maxHeightClass="h-[80vh]"
      bodyClassName="overflow-hidden flex"
    >
      <div className="flex-1 flex overflow-hidden h-full">
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto text-xs shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
            Clean-Room Crates
          </div>
          {Object.keys(ARCH_FILES).map((key) => {
            const f = ARCH_FILES[key];
            const isSel = key === selectedFile;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedFile(key)}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors flex flex-col ${
                  isSel
                    ? 'bg-blue-50 text-[#0066FF] border border-blue-200 font-semibold'
                    : 'text-slate-700 hover:bg-slate-200/60 border border-transparent'
                }`}
              >
                <span className="font-mono text-xs truncate">{f.title}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{f.layer}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/70 text-xs">
            <span className="font-mono text-slate-300">{current.title}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>
          <pre className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-200 select-text">
            <code>{current.code}</code>
          </pre>
        </div>
      </div>
    </ModalShell>
  );
};
