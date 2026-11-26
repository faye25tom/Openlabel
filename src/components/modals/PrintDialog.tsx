import React, { useEffect, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Globe,
  Monitor,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Usb,
  Zap,
} from 'lucide-react';
import { LabelProject } from '../../types/model';
import { compileToTspl2, compileToZpl2, Dpi } from '../../engine/tspl_compiler';
import { EvalContext } from '../../engine/evaluator';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { NumberInput } from '../ui/NumberInput';
import { ModalShell } from '../ui/ModalShell';

interface PrintDialogProps {
  isOpen: boolean;
  project: LabelProject;
  onClose: () => void;
}

type ConnectMode = 'windows' | 'preset' | 'serial' | 'network' | 'agent';

export const PrintDialog: React.FC<PrintDialogProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const isDesktopBridgeAvailable =
    typeof window !== 'undefined' && Boolean(window.openLabel?.isDesktop);
  const [connectMode, setConnectMode] = useState<ConnectMode>(
    isDesktopBridgeAvailable ? 'windows' : 'preset',
  );
  const [printer, setPrinter] = useState<string>('tspl-203');
  const [dpiSetting, setDpiSetting] = useState<Dpi>(203);
  const [quantity, setQuantity] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showRawCode, setShowRawCode] = useState<boolean>(false);
  const [rawCodeType, setRawCodeType] = useState<'tspl' | 'zpl'>('tspl');
  const [copied, setCopied] = useState<boolean>(false);

  // WebSerial Hardware State
  const [serialPort, setSerialPort] = useState<any>(null);
  const [serialInfo, setSerialInfo] = useState<string>('');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [isSendingSerial, setIsSendingSerial] = useState<boolean>(false);
  const [serialStatus, setSerialStatus] = useState<string>('');

  // LAN / Network Printer State
  const [netHost, setNetHost] = useState<string>('192.168.1.188');
  const [netPort, setNetPort] = useState<number>(9100);
  const [pingStatus, setPingStatus] = useState<string>('');
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Local Agent Prober State
  const [agentStatus, setAgentStatus] = useState<string>('');
  const [isProbingAgent, setIsProbingAgent] = useState<boolean>(false);

  // Windows installed-printer state
  const [windowsPrinters, setWindowsPrinters] = useState<OpenLabelPrinterInfo[]>([]);
  const [selectedWindowsPrinter, setSelectedWindowsPrinter] = useState<string>('');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState<boolean>(false);
  const [isRawPrinting, setIsRawPrinting] = useState<boolean>(false);
  const [windowsPrintStatus, setWindowsPrintStatus] = useState<string>('');
  const [printEncoding, setPrintEncoding] = useState<'gbk' | 'utf8'>('gbk');

  const printQuantity = Math.max(1, Math.min(500, Math.floor(Number(quantity) || 1)));
  const safePage = Math.max(0, Math.min(currentPage, printQuantity - 1));

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const refreshWindowsPrinters = async () => {
    if (!window.openLabel) {
      setWindowsPrintStatus(
        '当前是浏览器模式，无法读取 Windows 打印队列。请使用已安装的 OpenLabel Studio 桌面版。',
      );
      return;
    }

    setIsLoadingPrinters(true);
    try {
      const printers = await window.openLabel.listPrinters();
      setWindowsPrinters(printers);
      setSelectedWindowsPrinter((current) => {
        if (current && printers.some((item) => item.name === current)) return current;
        return printers.find((item) => item.isDefault)?.name || printers[0]?.name || '';
      });
      setWindowsPrintStatus(
        printers.length > 0
          ? `已检测到 ${printers.length} 台 Windows 打印机。请选择与系统“打印机和扫描仪”中名称一致的设备。`
          : '未检测到 Windows 打印机。请先安装驱动，并在系统“打印机和扫描仪”中确认设备在线。',
      );
    } catch (error: any) {
      setWindowsPrintStatus(`读取打印机列表失败：${friendlyErrorMessage(error)}`);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  useEffect(() => {
    if (isOpen && connectMode === 'windows' && window.openLabel) {
      void refreshWindowsPrinters();
    }
  }, [isOpen, connectMode]);

  const printTimeElements = project.elements.filter((el) => {
    if ('prompt' in el.kind) {
      return el.kind.prompt.printTimeInput;
    }
    return false;
  });

  const [printTimeValues, setPrintTimeValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const el of project.elements) {
      if ('prompt' in el.kind && el.kind.prompt.printTimeInput) {
        initial[el.id] = el.kind.prompt.promptHint || 'INSPECTOR-01';
      }
    }
    return initial;
  });

  const dbRows = project.database?.rows || [];
  const dbIndex =
    dbRows.length > 0 ? (project.currentRecordIndex + safePage) % dbRows.length : 0;

  const currentEvalCtx: EvalContext = {
    labelSequenceIndex: safePage,
    dbRowIndex: dbIndex,
    table: project.database,
    fixedNow: new Date(),
    sharedOverrides: project.sharedFields,
    printTimeInputs: printTimeValues,
  };

  const selectedWindowsPrinterInfo =
    windowsPrinters.find((item) => item.name === selectedWindowsPrinter) || null;

  const dpi: Dpi = dpiSetting;
  const compiledTspl = compileToTspl2(project, currentEvalCtx, dpi);
  const compiledZpl = compileToZpl2(project, currentEvalCtx, dpi);
  const activeRawCode = rawCodeType === 'tspl' ? compiledTspl : compiledZpl;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPrn = () => {
    const blob = new Blob([activeRawCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_${rawCodeType.toUpperCase()}.prn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  // WebSerial Hardware Detection & Connection
  const handleConnectSerial = async () => {
    if (!('serial' in navigator)) {
      setSerialStatus(
        '当前浏览器不支持 WebSerial API，请使用最新版 Google Chrome 或 Microsoft Edge 浏览器。',
      );
      return;
    }
    try {
      setSerialStatus('请在弹出的系统选择框中选择已连接的 USB / 串口热敏打印机...');
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      setSerialPort(port);
      const info = port.getInfo ? port.getInfo() : {};
      const devName = info.usbVendorId
        ? `USB热敏设备 (VID: 0x${info.usbVendorId.toString(16)}, PID: 0x${(
            info.usbProductId || 0
          ).toString(16)})`
        : `COM串口打印机 (@ ${baudRate} bps)`;
      setSerialInfo(devName);
      setSerialStatus(`成功连接设备: ${devName}`);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setSerialStatus(`连接失败: ${err.message || err}`);
      } else {
        setSerialStatus('已取消选择端口。');
      }
    }
  };

  const handleDisconnectSerial = async () => {
    if (serialPort) {
      try {
        await serialPort.close();
      } catch {
        // ignore close error
      }
      setSerialPort(null);
      setSerialInfo('');
      setSerialStatus('已断开本地设备连接。');
    }
  };

  const handleSendSerial = async () => {
    if (!serialPort) {
      setSerialStatus('未连接本地打印机，请先点击「检测并连接设备」。');
      return;
    }
    setIsSendingSerial(true);
    setSerialStatus('正在向打印机写入硬件指令流 (Raw Byte Stream)...');
    try {
      const writer = serialPort.writable.getWriter();
      const encoder = new TextEncoder();
      const data = encoder.encode(activeRawCode);
      await writer.write(data);
      writer.releaseLock();
      setSerialStatus('指令发送完成，已触发热敏打印机出纸。');
    } catch (err: any) {
      setSerialStatus(`发送指令失败: ${err.message || err}`);
    } finally {
      setIsSendingSerial(false);
    }
  };

  // LAN Network IP Test
  const handleTestNetwork = async () => {
    setIsPinging(true);
    setPingStatus(`正在向 ${netHost}:${netPort} 发起连通性探测...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      try {
        await fetch(`http://${netHost}:${netPort}/`, {
          mode: 'no-cors',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setPingStatus(
          `主机 ${netHost} 网络连通正常，打印机可通过 TCP 9100 RAW 端口接收标签数据。`,
        );
      } catch (e: any) {
        if (e.name === 'AbortError') {
          setPingStatus(
            `探测超时: 未收到 ${netHost}:${netPort} 响应，请确认打印机已开机并接入同局域网。`,
          );
        } else {
          setPingStatus(
            `已探测局域网节点 ${netHost}。受浏览器安全策略限制，直接发送 RAW TCP 流建议使用本地代理或终端脚本。`,
          );
        }
      }
    } catch (err: any) {
      setPingStatus(`探测出错: ${err.message || err}`);
    } finally {
      setIsPinging(false);
    }
  };

  // Local Print Agent Probing
  const handleProbeAgent = async () => {
    setIsProbingAgent(true);
    setAgentStatus('正在扫描本机 127.0.0.1 打印助手服务 (18528, 8182, 8000)...');
    let found = false;
    const candidates = [
      {
        name: '菜鸟/电商标准打印中间件 (Cainiao Print Agent)',
        url: 'http://127.0.0.1:18528',
      },
      { name: 'QZ Tray 工业跨平台打印服务', url: 'http://127.0.0.1:8182' },
      { name: 'OpenLabel 本地打印代理服务', url: 'http://127.0.0.1:8000/printers' },
    ];
    for (const c of candidates) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 1200);
        await fetch(c.url, { mode: 'no-cors', signal: ctrl.signal });
        clearTimeout(tid);
        setAgentStatus(
          `成功发现正在运行的【${c.name}】，支持枚举系统中已安装的物理打印机。`,
        );
        found = true;
        break;
      } catch {
        // continue scanning
      }
    }
    if (!found) {
      setAgentStatus(
        '未检测到本机通用打印中间件（如菜鸟打印服务或 QZ Tray）。可使用「Windows 打印机」、「WebSerial 直连」或「系统打印」。',
      );
    }
    setIsProbingAgent(false);
  };

  const buildBatchRawCode = (type: 'tspl' | 'zpl', targetDpi: Dpi) => {
    const fixedNow = new Date();
    const labels: string[] = [];

    for (let page = 0; page < printQuantity; page++) {
      const dbRowIndex =
        dbRows.length > 0 ? (project.currentRecordIndex + page) % dbRows.length : 0;
      const context: EvalContext = {
        labelSequenceIndex: page,
        dbRowIndex,
        table: project.database,
        fixedNow,
        sharedOverrides: project.sharedFields,
        printTimeInputs: printTimeValues,
      };
      labels.push(
        type === 'tspl'
          ? compileToTspl2(project, context, targetDpi)
          : compileToZpl2(project, context, targetDpi),
      );
    }

    return `${labels.join('\r\n')}\r\n`;
  };

  const sendWindowsRawJob = async (data: string, description: string) => {
    if (!window.openLabel) {
      setWindowsPrintStatus(
        '无法使用 Windows 直连打印：当前不是桌面版。请安装 OpenLabel Studio Windows 安装包。',
      );
      return;
    }
    if (!selectedWindowsPrinter) {
      setWindowsPrintStatus('请先选择一台 Windows 已安装打印机。');
      return;
    }

    setIsRawPrinting(true);
    setWindowsPrintStatus(`正在向“${selectedWindowsPrinter}”提交${description}...`);
    try {
      const result = await window.openLabel.printRaw({
        printerName: selectedWindowsPrinter,
        data,
        encoding: printEncoding,
      });
      const jobText = result.jobId ? `，作业号 #${result.jobId}` : '';
      setWindowsPrintStatus(
        `${description}已提交到 Windows 打印队列${jobText}。若未出纸，请检查打印机电源、USB 连接与指令协议。`,
      );
    } catch (error: any) {
      setWindowsPrintStatus(
        `打印失败：${friendlyErrorMessage(error)}。请确认打印机未离线，且 TSPL2/ZPL II 协议与设备匹配。`,
      );
    } finally {
      setIsRawPrinting(false);
    }
  };

  const handleWindowsRawPrint = async () => {
    await sendWindowsRawJob(
      buildBatchRawCode(rawCodeType, dpiSetting),
      `${printQuantity} 张标签`,
    );
  };

  const handleWindowsTestPrint = async () => {
    const testData =
      rawCodeType === 'tspl'
        ? [
            'SIZE 50 mm, 30 mm',
            'GAP 2 mm, 0 mm',
            'DIRECTION 1,0',
            'CLS',
            'TEXT 20,20,"TSS24.BF2",0,1,1,"OpenLabel OK"',
            'PRINT 1,1',
          ].join('\r\n')
        : [
            '^XA',
            '^PW400',
            '^LL240',
            '^FO20,20^A0N,30,30^FDOpenLabel OK^FS',
            '^XZ',
          ].join('\r\n');

    await sendWindowsRawJob(`${testData}\r\n`, '1 张测试标签');
  };

  const handleOpenPrinterSettings = async () => {
    try {
      await window.openLabel?.openPrinterSettings();
    } catch (error: any) {
      setWindowsPrintStatus(`无法打开系统打印机设置：${friendlyErrorMessage(error)}`);
    }
  };

  const paper = project.paper;

  const tabs: { id: ConnectMode; label: string; icon: React.ReactNode }[] = [
    { id: 'windows', label: 'Windows 打印机', icon: <Printer className="w-3.5 h-3.5" /> },
    { id: 'preset', label: '驱动仿真与系统打印', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'serial', label: '本地 USB/串口直连', icon: <Usb className="w-3.5 h-3.5" /> },
    { id: 'network', label: '局域网网络打印机', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'agent', label: '本地打印助手服务', icon: <Bot className="w-3.5 h-3.5" /> },
  ];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="打印工作站与硬件输出 (Print Workstation)"
      subtitle="Windows RAW Spooler · WebSerial · TCP 9100 · TSPL2 / ZPL II 编译器"
      icon={<Printer className="w-4 h-4" />}
      badge={
        <span className="text-[11px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
          {paper.widthMm}×{paper.heightMm}mm
        </span>
      }
      maxWidthClass="max-w-[920px] w-full"
      maxHeightClass="max-h-[92vh]"
      bodyClassName="flex flex-col overflow-hidden"
    >
      {/* Mode Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-100/75 px-5 pt-2 gap-1 text-xs overflow-x-auto shrink-0">
        {tabs.map((tab) => {
          const active = connectMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setConnectMode(tab.id)}
              className={`px-3 py-2 rounded-t-lg font-medium transition-colors border-t border-x flex items-center gap-1.5 whitespace-nowrap ${
                active
                  ? 'bg-white border-slate-200 text-[#0066FF] font-semibold -mb-[1px] pb-2.5'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Body Split */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1">
        {/* Left: Connection & Print Parameters */}
        <div className="space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-4">
            {connectMode === 'windows' && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">
                      Windows 已安装打印机（USB / 网络）
                    </label>
                    <button
                      type="button"
                      onClick={() => void refreshWindowsPrinters()}
                      disabled={isLoadingPrinters}
                      className="text-[11px] text-[#0066FF] hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isLoadingPrinters ? 'animate-spin' : ''}`}
                      />
                      <span>{isLoadingPrinters ? '检测中...' : '刷新列表'}</span>
                    </button>
                  </div>

                  <select
                    id="windows-printer-select"
                    value={selectedWindowsPrinter}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const selectedInfo = windowsPrinters.find(
                        (item) => item.name === selectedName,
                      );
                      const fingerprint = `${selectedName} ${
                        selectedInfo?.driverName || ''
                      }`.toLowerCase();
                      setSelectedWindowsPrinter(selectedName);
                      if (fingerprint.includes('zpl') || fingerprint.includes('zebra')) {
                        setRawCodeType('zpl');
                      } else if (
                        fingerprint.includes('tspl') ||
                        fingerprint.includes('gprinter') ||
                        fingerprint.includes('gainscha') ||
                        fingerprint.includes('deli') ||
                        fingerprint.includes('tsc')
                      ) {
                        setRawCodeType('tspl');
                      }
                      if (/\b300\b/.test(fingerprint)) {
                        setDpiSetting(300);
                      } else if (/\b203\b/.test(fingerprint)) {
                        setDpiSetting(203);
                      }
                      setWindowsPrintStatus('');
                    }}
                    disabled={isLoadingPrinters || windowsPrinters.length === 0}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-slate-800 text-xs bg-white outline-none focus:border-[#0066FF] font-medium disabled:bg-slate-100"
                  >
                    {isLoadingPrinters && <option value="">正在读取 Windows 打印队列...</option>}
                    {!isLoadingPrinters && windowsPrinters.length === 0 && (
                      <option value="">未检测到打印机</option>
                    )}
                    {windowsPrinters.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.displayName || item.name}
                        {item.isDefault ? '（系统默认）' : ''}
                        {item.portName ? ` · ${item.portName}` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedWindowsPrinterInfo && (
                    <div className="mt-1.5 grid grid-cols-2 gap-1 p-2 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-500 font-mono">
                      <span className="truncate">
                        驱动：{selectedWindowsPrinterInfo.driverName || '未知'}
                      </span>
                      <span className="truncate">
                        端口：{selectedWindowsPrinterInfo.portName || '未知'}
                      </span>
                      <span>状态：{printerStatusText(selectedWindowsPrinterInfo.status)}</span>
                      <span>
                        {selectedWindowsPrinterInfo.isDefault ? '系统默认打印机' : '已安装'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      指令协议
                    </label>
                    <select
                      value={rawCodeType}
                      onChange={(e) => setRawCodeType(e.target.value as 'tspl' | 'zpl')}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                    >
                      <option value="tspl">TSPL2（佳博 / 得力）</option>
                      <option value="zpl">ZPL II（斑马）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      打印分辨率
                    </label>
                    <select
                      value={dpiSetting}
                      onChange={(e) => setDpiSetting(Number(e.target.value) as Dpi)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                    >
                      <option value="203">203 DPI</option>
                      <option value="300">300 DPI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    中文编码
                  </label>
                  <select
                    value={printEncoding}
                    onChange={(e) => setPrintEncoding(e.target.value as 'gbk' | 'utf8')}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                  >
                    <option value="gbk">GBK / GB18030（中文标签推荐）</option>
                    <option value="utf8">UTF-8</option>
                  </select>
                </div>

                {windowsPrintStatus && (
                  <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-[11px] leading-relaxed break-words">
                    {windowsPrintStatus}
                  </div>
                )}

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-slate-700 text-[10px] leading-relaxed space-y-1">
                  <div className="font-semibold text-slate-900">使用前检查</div>
                  <div>1. 打印机已开机，并通过 USB 连接到此电脑。</div>
                  <div>2. Windows“设置 → 打印机和扫描仪”中能看到该设备。</div>
                  <div>3. 佳博 / 得力常用 TSPL2；斑马使用 ZPL II。</div>
                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => void handleWindowsTestPrint()}
                      disabled={isRawPrinting || !selectedWindowsPrinter}
                      className="px-2.5 py-1 bg-white border border-blue-300 hover:bg-blue-100 text-[#0066FF] rounded font-medium disabled:opacity-50"
                    >
                      打印测试页
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleOpenPrinterSettings()}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-medium flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      <span>系统打印机设置</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {connectMode === 'preset' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    目标打印协议与仿真配置 (Target Driver Profile)
                  </label>
                  <select
                    value={printer}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPrinter(value);
                      setDpiSetting(value.includes('300') ? 300 : 203);
                      setRawCodeType(value.includes('zpl') ? 'zpl' : 'tspl');
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-slate-800 text-xs bg-white outline-none focus:border-[#0066FF] font-medium"
                  >
                    <option value="tspl-203">
                      TSC / Gainscha佳博 / Deli得力 (TSPL2 @ 203 DPI)
                    </option>
                    <option value="tspl-300">
                      TSC 高精度工业机 (TSPL2 @ 300 DPI)
                    </option>
                    <option value="zpl-203">Zebra斑马条码机 (ZPL II @ 203 DPI)</option>
                    <option value="zpl-300">Zebra斑马高密度机 (ZPL II @ 300 DPI)</option>
                    <option value="pdf">
                      Windows / macOS 系统打印驱动 (Native Vector Print)
                    </option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-slate-700 text-[11px] leading-relaxed">
                  <strong>提示：</strong>点击底部<strong>「系统打印 / PDF」</strong>将调起操作系统原生打印面板，支持输出到所有本地 USB、网络共享或虚拟 PDF 打印机。
                </div>
              </div>
            )}

            {connectMode === 'serial' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    本地 USB / 串口免驱动直连 (WebSerial API)
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">当前设备状态:</span>
                      <span
                        className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                          serialPort
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {serialPort ? '已连接设备' : '未连接'}
                      </span>
                    </div>

                    {serialInfo && (
                      <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        {serialInfo}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-600">波特率:</span>
                      <select
                        value={baudRate}
                        onChange={(e) => setBaudRate(Number(e.target.value))}
                        disabled={!!serialPort}
                        className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px]"
                      >
                        <option value="9600">9600 (TSC / 佳博默认)</option>
                        <option value="19200">19200</option>
                        <option value="38400">38400</option>
                        <option value="115200">115200 (高波特率)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {!serialPort ? (
                        <button
                          type="button"
                          onClick={handleConnectSerial}
                          className="flex-1 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium rounded-md text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>检测并连接本地打印机 (USB/COM)</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleSendSerial}
                            disabled={isSendingSerial}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>
                              {isSendingSerial ? '正在写入...' : '直接出纸 (发送原生指令)'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDisconnectSerial}
                            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs"
                          >
                            断开
                          </button>
                        </>
                      )}
                    </div>

                    {serialStatus && (
                      <div className="text-[11px] text-slate-600 pt-1 leading-snug border-t border-slate-200">
                        {serialStatus}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 leading-normal">
                  支持具备 USB 虚拟串口或 RS232 串口的热敏打印机，向打印机硬件直写原始指令流。
                </div>
              </div>
            )}

            {connectMode === 'network' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    局域网网络打印机直连 (RAW TCP / Port 9100)
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[11px] text-slate-500 mb-0.5">
                          打印机局域网 IP 地址
                        </label>
                        <input
                          type="text"
                          value={netHost}
                          onChange={(e) => setNetHost(e.target.value)}
                          placeholder="如 192.168.1.188"
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">
                          端口 (RAW)
                        </label>
                        <NumberInput
                          min={1}
                          max={65535}
                          integer
                          value={netPort}
                          onChange={setNetPort}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestNetwork}
                      disabled={isPinging}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{isPinging ? '正在探测...' : '探测局域网打印机连通性'}</span>
                    </button>

                    {pingStatus && (
                      <div className="p-2 bg-white rounded border border-slate-200 text-[11px] leading-relaxed">
                        {pingStatus}
                      </div>
                    )}

                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[10px] space-y-1">
                      <div className="font-semibold">局域网推送说明</div>
                      <div>
                        工业热敏打印机标准 RAW 端口为 <code>9100</code>。可在终端执行以下命令投递 PRN：
                      </div>
                      <div className="font-mono bg-amber-100/80 p-1 rounded select-all text-[10px]">
                        nc {netHost} {netPort} &lt;{' '}
                        {project.name.replace(/\s+/g, '_')}_TSPL.prn
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {connectMode === 'agent' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    宿主机打印服务中间件检测 (Local Print Agent)
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                      扫描本机运行的常见打印代理服务（如菜鸟打印组件、QZ Tray、OpenLabel Agent），用于在纯浏览器环境下扩展硬件打印能力。
                    </div>

                    <button
                      type="button"
                      onClick={handleProbeAgent}
                      disabled={isProbingAgent}
                      className="w-full py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>
                        {isProbingAgent
                          ? '正在扫描本机端口...'
                          : '扫描本机打印助手 (菜鸟组件 / QZ Tray)'}
                      </span>
                    </button>

                    {agentStatus && (
                      <div className="p-2.5 bg-white rounded border border-slate-200 text-[11px] leading-relaxed">
                        {agentStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Print Quantity */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-slate-700 font-semibold mb-1">
                打印批次份数 (Quantity)
              </label>
              <div className="flex items-center gap-2">
                <NumberInput
                  min={1}
                  max={500}
                  integer
                  value={quantity}
                  onChange={setQuantity}
                  className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono font-semibold tabular-nums"
                />
                <span className="text-slate-500 text-xs">
                  张标签 (流水号与数据库行自动步进)
                </span>
              </div>
            </div>

            {/* Print-Time Input Prompts */}
            {printTimeElements.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="font-bold text-amber-800 text-[11px]">
                  打印时作业员输入 (Print-Time Input)
                </div>
                {printTimeElements.map((el) => {
                  const prompt = 'prompt' in el.kind ? el.kind.prompt : null;
                  return (
                    <div key={el.id} className="space-y-1">
                      <label className="block text-amber-900 text-[11px] font-medium">
                        {prompt?.promptHint || `${el.name} Value`}:
                      </label>
                      <input
                        type="text"
                        value={printTimeValues[el.id] || ''}
                        onChange={(e) =>
                          setPrintTimeValues({
                            ...printTimeValues,
                            [el.id]: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs text-slate-800"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hardware Raw Code Drawer */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRawCode(!showRawCode)}
                className="text-[#0066FF] hover:underline font-medium text-xs flex items-center gap-1"
              >
                <span>{showRawCode ? '收起' : '查看'} 硬件原生指令流 (TSPL2 / ZPL II)</span>
                {showRawCode ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showRawCode && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[11px]">
                      <button
                        type="button"
                        onClick={() => setRawCodeType('tspl')}
                        className={`px-2 py-0.5 rounded ${
                          rawCodeType === 'tspl'
                            ? 'bg-white shadow-xs font-semibold text-slate-900'
                            : 'text-slate-600'
                        }`}
                      >
                        TSPL2
                      </button>
                      <button
                        type="button"
                        onClick={() => setRawCodeType('zpl')}
                        className={`px-2 py-0.5 rounded ${
                          rawCodeType === 'zpl'
                            ? 'bg-white shadow-xs font-semibold text-slate-900'
                            : 'text-slate-600'
                        }`}
                      >
                        ZPL II
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="text-xs text-[#0066FF] hover:underline flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>复制指令</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPrn}
                        className="text-xs text-slate-600 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>下载 .prn</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    readOnly
                    rows={6}
                    value={activeRawCode}
                    className="w-full p-2.5 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-md leading-tight select-all outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
            {connectMode === 'windows' ? (
              <button
                type="button"
                onClick={() => void handleWindowsRawPrint()}
                disabled={isRawPrinting || !selectedWindowsPrinter}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {isRawPrinting
                    ? '正在提交 Windows 打印队列...'
                    : `直接打印到 Windows 打印机（${printQuantity} 张）`}
                </span>
              </button>
            ) : connectMode === 'serial' && serialPort ? (
              <button
                type="button"
                onClick={handleSendSerial}
                disabled={isSendingSerial}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>{isSendingSerial ? '正在写入串口...' : '直发本地打印机出纸'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="flex-1 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-lg shadow-xs text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>系统打印 / PDF (所有已装设备)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPrn}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors flex items-center gap-1"
              title="保存原生热敏指令文件"
            >
              <Download className="w-3.5 h-3.5" />
              <span>保存 PRN</span>
            </button>
          </div>
        </div>

        {/* Right: Live Page-by-Page Batch Preview */}
        <div
          className="bg-[#eef2f7] rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-between"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(15,23,42,0.08) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        >
          <div className="w-full flex items-center justify-between pb-2.5 border-b border-slate-300/70 text-xs">
            <span className="font-semibold text-slate-800">
              实时批量分页预览 (Batch Preview)
            </span>
            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className="p-1 bg-white border border-slate-200 rounded disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium px-1">
                {safePage + 1} / {printQuantity}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(printQuantity - 1, safePage + 1))}
                disabled={safePage >= printQuantity - 1}
                className="p-1 bg-white border border-slate-200 rounded disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="my-auto py-5 flex items-center justify-center">
            {(() => {
              const maxW = 340;
              const maxH = 260;
              const aspect = paper.widthMm / Math.max(1, paper.heightMm);
              let w = maxW;
              let h = maxW / aspect;
              if (h > maxH) {
                h = maxH;
                w = maxH * aspect;
              }
              const pxPerMm = w / Math.max(0.1, paper.widthMm);

              return (
                <div
                  className={`bg-white shadow-xl border border-slate-300 relative overflow-hidden transition-all duration-150 ${
                    paper.shape === 'sharp'
                      ? 'rounded-none'
                      : paper.shape === 'ellipse'
                        ? 'rounded-full'
                        : 'rounded-xl'
                  }`}
                  style={{
                    width: `${w}px`,
                    height: `${h}px`,
                    backgroundColor: paper.backgroundHex || '#ffffff',
                  }}
                >
                  {project.elements.map((el) => (
                    <div
                      key={el.id}
                      className="absolute pointer-events-none select-none flex items-center overflow-hidden"
                      style={{
                        left: el.xMm * pxPerMm,
                        top: el.yMm * pxPerMm,
                        width: el.widthMm * pxPerMm,
                        height: el.heightMm * pxPerMm,
                      }}
                    >
                      <ElementRenderer
                        element={el}
                        ctx={currentEvalCtx}
                        pxPerMm={pxPerMm}
                        interactive={false}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="w-full pt-2.5 border-t border-slate-300/70 flex items-center justify-between text-[11px] text-slate-600 font-mono tabular-nums">
            <span>
              Paper: {paper.widthMm}×{paper.heightMm}mm
            </span>
            <span>
              DPI: {dpi} ({dpi === 300 ? '11.8 dot/mm' : '8 dot/mm'})
            </span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

function printerStatusText(status: OpenLabelPrinterInfo['status']) {
  switch (status) {
    case 'ready':
      return '就绪';
    case 'printing':
      return '打印中';
    case 'warmup':
      return '预热中';
    case 'stopped':
      return '已停止';
    case 'offline':
      return '离线';
    default:
      return '未知';
  }
}

function friendlyErrorMessage(error: any) {
  return String(error?.message || error || '未知错误')
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}
