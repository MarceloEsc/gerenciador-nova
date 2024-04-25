import { app, shell, BrowserWindow, ipcMain, Notification, nativeTheme } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/favicon.ico?asset'
const windowStateKeeper = require('electron-window-state');

const { PdfReader } = require('pdfreader');
const { writeFile, readFile } = require('fs');
import { faturaLog, consultaPDF, consultaTag, saveData, removeData } from "./backend.js";

function createWindow() {
  let windowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 900,
  });

  const mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    show: false,
    icon: icon,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  windowState.manage(mainWindow);

  nativeTheme.themeSource = windowState.theme.themeSource

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  //handle _blank links
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark'
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {    
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const toggleTheme = () => {
  let theme = nativeTheme.themeSource
  if(theme == 'light' || theme == 'system') {
    nativeTheme.themeSource = 'dark'
    return
  }
  nativeTheme.themeSource = 'light'
}

ipcMain.on('toggleTheme', (event) => toggleTheme());
ipcMain.on('init:GetTheme', (event) => {
  event.reply('init:RecieveTheme', nativeTheme.themeSource)
});

ipcMain.on('requestData:all', (event) => {
  //TO-DO RETORNAR 2 DADOS SEPARADAMENTE PARA CADA LUGAR
  /* consultaPDF().then(result => {
    event.reply('requestData:res', result)
  }) */
  /* consultaGeral().then(result => {
    event.reply('requestData:res', result)
  })   */
})

ipcMain.on('requestData:Combustivel', (event) => {
    consultaTag('combustivel').then(result => event.reply('requestData:res', result, 'combustivel'))
  }
);
ipcMain.on('requestData:Manutencao', (event) => {
    consultaTag('manutencao').then(result => {
      event.reply('requestData:res', result, 'manutencao')
    })
  }
);

const callParse = new PdfReader();

ipcMain.on('sendData:converter-pdf', (event, fullpath) => {
  console.log('converter ' + fullpath);  
  callParse.parseFileItems(fullpath, faturaLog)

  setTimeout(() => {
    consultaPDF().then(result => {
      //console.log(result)
      event.reply('retrieveData:converter-pdf', result)})
  }, 700);
})

ipcMain.on('requestSave', (event, data, type) => {saveData(JSON.parse(data), type)/*  console.log(JSON.parse(data), type); */});

ipcMain.on('requestRemove', (event, doc) => {
  console.log(JSON.parse(doc));
  removeData(JSON.parse(doc))
});
