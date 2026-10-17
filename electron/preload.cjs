const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('openLabel', {
  isDesktop: true,
  listPrinters: () => ipcRenderer.invoke('printers:list'),
  printRaw: (options) => ipcRenderer.invoke('printers:print-raw', options),
  openPrinterSettings: () => ipcRenderer.invoke('printers:open-settings'),
});
