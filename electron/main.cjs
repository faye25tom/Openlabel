const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const APP_TITLE = 'OpenLabel Studio';
const isSmokeTest = process.argv.includes('--smoke-test');

if (!isSmokeTest && !app.requestSingleInstanceLock()) {
  app.quit();
}

function openExternalUrl(url) {
  if (/^https?:\/\//i.test(url)) {
    shell.openExternal(url);
  }
}

const POWERSHELL = path.join(
  process.env.SystemRoot || 'C:\\Windows',
  'System32',
  'WindowsPowerShell',
  'v1.0',
  'powershell.exe',
);

const LIST_PRINTERS_SCRIPT = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$items = @(Get-CimInstance -ClassName Win32_Printer | ForEach-Object {
  [pscustomobject]@{
    name = $_.Name
    driverName = $_.DriverName
    portName = $_.PortName
    isDefault = [bool]$_.Default
    workOffline = [bool]$_.WorkOffline
    statusCode = [int]$_.PrinterStatus
  }
})
ConvertTo-Json -InputObject $items -Compress -Depth 3
`;

const RAW_PRINT_SCRIPT = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
trap {
    $exception = $_.Exception
    while ($exception.InnerException) { $exception = $exception.InnerException }
    Write-Output ("ERROR=" + $exception.Message)
    exit 1
}
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class OpenLabelRawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFO
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool OpenPrinter(string printerName, out IntPtr printerHandle, IntPtr defaults);

    [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr printerHandle);

    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern int StartDocPrinter(IntPtr printerHandle, int level, [In] DOCINFO docInfo);

    [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr printerHandle);

    [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr printerHandle);

    [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr printerHandle);

    [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr printerHandle, IntPtr bytes, int count, out int written);

    public static int Send(string printerName, byte[] data)
    {
        IntPtr printerHandle;
        if (!OpenPrinter(printerName, out printerHandle, IntPtr.Zero))
        {
            throw new ApplicationException("OpenPrinter failed. Win32 error: " + Marshal.GetLastWin32Error());
        }

        bool documentStarted = false;
        bool pageStarted = false;
        int jobId = 0;

        try
        {
            DOCINFO docInfo = new DOCINFO();
            docInfo.pDocName = "OpenLabel Studio";
            docInfo.pDataType = "RAW";

            jobId = StartDocPrinter(printerHandle, 1, docInfo);
            if (jobId == 0)
            {
                throw new ApplicationException("StartDocPrinter failed. Win32 error: " + Marshal.GetLastWin32Error());
            }
            documentStarted = true;

            if (!StartPagePrinter(printerHandle))
            {
                throw new ApplicationException("StartPagePrinter failed. Win32 error: " + Marshal.GetLastWin32Error());
            }
            pageStarted = true;

            IntPtr buffer = Marshal.AllocHGlobal(data.Length);
            try
            {
                Marshal.Copy(data, 0, buffer, data.Length);
                int written;
                if (!WritePrinter(printerHandle, buffer, data.Length, out written))
                {
                    throw new ApplicationException("WritePrinter failed. Win32 error: " + Marshal.GetLastWin32Error());
                }
                if (written != data.Length)
                {
                    throw new InvalidOperationException("Only " + written + " of " + data.Length + " bytes were written.");
                }
            }
            finally
            {
                Marshal.FreeHGlobal(buffer);
            }
        }
        finally
        {
            if (pageStarted) EndPagePrinter(printerHandle);
            if (documentStarted) EndDocPrinter(printerHandle);
            ClosePrinter(printerHandle);
        }

        return jobId;
    }
}
'@

$text = [System.IO.File]::ReadAllText($env:OPENLABEL_RAW_FILE, [System.Text.UTF8Encoding]::new($false))
$encoding = [System.Text.Encoding]::GetEncoding([int]$env:OPENLABEL_CODEPAGE)
$bytes = $encoding.GetBytes($text)
$jobId = [OpenLabelRawPrinter]::Send($env:OPENLABEL_PRINTER_NAME, $bytes)
Write-Output ("JOB=" + $jobId)
`;

function runPowerShell(script, extraEnvironment = {}, timeoutMs = 30000) {
  const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');

  return new Promise((resolve, reject) => {
    const child = spawn(
      POWERSHELL,
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encodedCommand],
      {
        windowsHide: true,
        env: { ...process.env, ...extraEnvironment },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`PowerShell timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.replace(/^\uFEFF/, '').trim());
      } else {
        const output = (stdout || stderr || '').trim();
        const errorLine = output
          .split(/\r?\n/)
          .find((line) => line.startsWith('ERROR='));
        const readableMessage = errorLine
          ? errorLine.slice('ERROR='.length).trim()
          : output
              .replace(/<[^>]+>/g, ' ')
              .replace(/_x000D_/g, '')
              .replace(/_x000A_/g, '\n')
              .replace(/\s+/g, ' ')
              .trim();
        reject(new Error(readableMessage || `PowerShell exited with code ${code}`));
      }
    });
  });
}

function normalizePrinterStatus(statusCode, workOffline) {
  if (workOffline) return 'offline';
  switch (statusCode) {
    case 3:
      return 'ready';
    case 4:
      return 'printing';
    case 5:
      return 'warmup';
    case 6:
      return 'stopped';
    case 7:
      return 'offline';
    default:
      return 'unknown';
  }
}

async function listInstalledPrinters(event) {
  const merged = new Map();

  try {
    const output = await runPowerShell(LIST_PRINTERS_SCRIPT, {}, 20000);
    const parsed = output ? JSON.parse(output) : [];
    const printers = Array.isArray(parsed) ? parsed : [parsed];
    for (const printer of printers) {
      if (!printer?.name) continue;
      merged.set(printer.name, {
        name: printer.name,
        displayName: printer.name,
        driverName: printer.driverName || '',
        portName: printer.portName || '',
        status: normalizePrinterStatus(printer.statusCode, printer.workOffline),
        isDefault: Boolean(printer.isDefault),
        source: 'windows',
      });
    }
  } catch (error) {
    console.warn('Unable to enumerate printers through Win32_Printer:', error);
  }

  try {
    const chromiumPrinters = await event.sender.getPrintersAsync();
    for (const printer of chromiumPrinters) {
      if (!printer?.name) continue;
      const existing = merged.get(printer.name);
      if (existing) {
        existing.isDefault = existing.isDefault || Boolean(printer.isDefault);
        existing.displayName = printer.displayName || existing.displayName;
      } else {
        merged.set(printer.name, {
          name: printer.name,
          displayName: printer.displayName || printer.name,
          driverName: '',
          portName: '',
          status: 'unknown',
          isDefault: Boolean(printer.isDefault),
          source: 'chromium',
        });
      }
    }
  } catch (error) {
    console.warn('Unable to enumerate printers through Chromium:', error);
  }

  return Array.from(merged.values()).sort((left, right) => {
    if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
    return left.name.localeCompare(right.name, 'zh-CN');
  });
}

async function printRawToWindowsPrinter(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('Invalid print request.');
  }

  const printerName = String(options.printerName || '').trim();
  const data = String(options.data || '');
  const encoding = options.encoding === 'utf8' ? 65001 : 936;

  if (!printerName || printerName.length > 512) {
    throw new Error('Please select a valid Windows printer.');
  }
  if (!data) {
    throw new Error('The print payload is empty.');
  }
  if (Buffer.byteLength(data, 'utf8') > 25 * 1024 * 1024) {
    throw new Error('The print payload is too large.');
  }

  const tempFile = path.join(
    os.tmpdir(),
    `openlabel-raw-${process.pid}-${Date.now()}-${crypto.randomUUID()}.prn`,
  );
  await fs.writeFile(tempFile, data, 'utf8');

  try {
    const output = await runPowerShell(
      RAW_PRINT_SCRIPT,
      {
        OPENLABEL_PRINTER_NAME: printerName,
        OPENLABEL_RAW_FILE: tempFile,
        OPENLABEL_CODEPAGE: String(encoding),
      },
      45000,
    );
    const jobMatch = /JOB=(\d+)/.exec(output);
    return {
      ok: true,
      jobId: jobMatch ? Number(jobMatch[1]) : null,
      message: output,
    };
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

function registerPrinterHandlers() {
  ipcMain.handle('printers:list', (event) => listInstalledPrinters(event));
  ipcMain.handle('printers:print-raw', (_event, options) => printRawToWindowsPrinter(options));
  ipcMain.handle('printers:open-settings', async () => {
    if (process.platform === 'win32') {
      await shell.openExternal('ms-settings:printers');
      return true;
    }
    return false;
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: APP_TITLE,
    backgroundColor: '#111827',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      openExternalUrl(url);
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  if (isSmokeTest) {
    mainWindow.webContents.once('did-finish-load', async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const result = await mainWindow.webContents.executeJavaScript(`(async () => {
          let rawPrinterGuard = '';
          if (window.openLabel) {
            try {
              await window.openLabel.printRaw({
                printerName: '__OpenLabel_Printer_Not_Found__',
                data: 'SMOKE TEST\\r\\n',
                encoding: 'utf8'
              });
              rawPrinterGuard = 'unexpected-success';
            } catch (error) {
              rawPrinterGuard = String(error?.message || error);
            }
          }
          const printButton = Array.from(document.querySelectorAll('button'))
            .find((button) => button.textContent?.trim().includes('Print'));
          printButton?.click();
          await new Promise((resolve) => setTimeout(resolve, 1800));
          const printerSelect = document.getElementById('windows-printer-select');
          return {
            title: document.title,
            rootChildren: document.getElementById('root')?.children.length ?? 0,
            bridge: Boolean(window.openLabel),
            printers: window.openLabel
              ? (await window.openLabel.listPrinters()).map((printer) => printer.name)
              : [],
            rawPrinterGuard,
            printDialogOpened: document.body.innerText.includes('Windows 已安装打印机'),
            printerOptionCount: printerSelect?.options.length ?? 0,
            text: document.body.innerText.slice(0, 160)
          };
        })()`);
        if (process.env.OPENLABEL_SMOKE_SCREENSHOT) {
          const screenshot = await mainWindow.webContents.capturePage();
          await fs.writeFile(process.env.OPENLABEL_SMOKE_SCREENSHOT, screenshot.toPNG());
        }
        console.log(JSON.stringify({ smokeTest: true, ...result }));
        app.exit(
          result.rootChildren > 0 &&
            result.title.includes('OpenLabel') &&
            Array.isArray(result.printers) &&
            result.rawPrinterGuard.length > 0 &&
            result.rawPrinterGuard !== 'unexpected-success' &&
            result.printDialogOpened &&
            result.printerOptionCount > 0
            ? 0
            : 1,
        );
      } catch (error) {
        console.error(error);
        app.exit(1);
      }
    });

    mainWindow.webContents.once('did-fail-load', (_event, code, description) => {
      console.error(JSON.stringify({ smokeTest: false, code, description }));
      app.exit(1);
    });
  }

  return mainWindow;
}

app.whenReady().then(() => {
  registerPrinterHandlers();
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  const [mainWindow] = BrowserWindow.getAllWindows();
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
