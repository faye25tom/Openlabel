export {};

declare global {
  interface OpenLabelPrinterInfo {
    name: string;
    displayName?: string;
    driverName?: string;
    portName?: string;
    status: 'ready' | 'printing' | 'warmup' | 'stopped' | 'offline' | 'unknown';
    isDefault: boolean;
    source?: 'windows' | 'chromium';
  }

  interface OpenLabelPrintResult {
    ok: boolean;
    jobId: number | null;
    message?: string;
  }

  interface OpenLabelBridge {
    isDesktop: true;
    listPrinters(): Promise<OpenLabelPrinterInfo[]>;
    printRaw(options: {
      printerName: string;
      data: string;
      encoding: 'gbk' | 'utf8';
    }): Promise<OpenLabelPrintResult>;
    openPrinterSettings(): Promise<boolean>;
  }

  interface Window {
    openLabel?: OpenLabelBridge;
  }
}
