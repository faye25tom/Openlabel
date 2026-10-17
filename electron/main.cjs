const { app, BrowserWindow, Menu, shell } = require('electron');
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
        const result = await mainWindow.webContents.executeJavaScript(`({
          title: document.title,
          rootChildren: document.getElementById('root')?.children.length ?? 0,
          text: document.body.innerText.slice(0, 160)
        })`);
        console.log(JSON.stringify({ smokeTest: true, ...result }));
        app.exit(result.rootChildren > 0 && result.title.includes('OpenLabel') ? 0 : 1);
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
