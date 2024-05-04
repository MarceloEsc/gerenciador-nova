import { app, shell, BrowserWindow, ipcMain, Notification, nativeTheme, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/favicon.ico?asset'
const windowStateKeeper = require('electron-window-state')

const { PdfReader } = require('pdfreader')
const { writeFileSync, readFile } = require('fs')
import { faturaLog, consultaPDF, consultaTag, saveData, removeData } from './backend.js'
import { montarPDF } from './export.js'
import { getMetaData, importExcel } from './import.js'

//autoUpdater.forceDevUpdateConfig = true
autoUpdater.autoDownload = false
//console.log(autoUpdater);

function createWindow() {
  let windowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 900,
    theme: { "themeSource": "light" }
  })

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

  windowState.manage(mainWindow)

  nativeTheme.themeSource = windowState.theme.themeSource

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  //handle _blank links
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark'
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 2000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
autoUpdater.on('update-available', async (info) => {
  await dialog
    .showMessageBox(BrowserWindow.getFocusedWindow(), {
      type: 'question',
      buttons: ['Atualizar', 'Cancelar'],
      noLink: true,
      title: 'Aviso',
      cancelId: 99,
      message: 'Atualização disponível, atualizar agora?'
    })
    .then((response) => {
      if (response.response === 0) autoUpdater.downloadUpdate()
    })
})
autoUpdater.on('error', (err) => {
  dialog.showErrorBox('Erro', err)
})
autoUpdater.on('download-progress', (progressObj) => {
  //console.log(progressObj);
})
autoUpdater.on('update-downloaded', (info) => {
  console.log(info)
  //REMEMBER YOU IDIIIIIIIIIIIOT
  //autoUpdater.quitAndInstall();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const toggleTheme = () => {
  let theme = nativeTheme.themeSource
  if (theme == 'light' || theme == 'system') {
    nativeTheme.themeSource = 'dark'
    return
  }
  nativeTheme.themeSource = 'light'
}

ipcMain.on('toggleTheme', (event) => toggleTheme())
ipcMain.on('init:GetTheme', (event) => {
  event.reply('init:RecieveTheme', nativeTheme.themeSource)
})

//TO-DO montar um arquivo de backup e salvar
ipcMain.on('requestData:all', (event) => { })

ipcMain.on('requestData:Combustivel', (event) => {
  consultaTag('combustivel').then((result) => event.reply('requestData:res', result, 'combustivel'))
})
ipcMain.on('requestData:Manutencao', (event) => {
  consultaTag('manutencao').then((result) => event.reply('requestData:res', result, 'manutencao'))
})

const callParse = new PdfReader()

ipcMain.on('sendData:converter-pdf', (event, fullpath) => {
  console.log('converter ' + fullpath)
  callParse.parseFileItems(fullpath, faturaLog)

  setTimeout(() => {
    consultaPDF().then((result) => {
      //console.log(result)
      event.reply('retrieveData:converter-pdf', result)
    })
  }, 700)
})

ipcMain.on('requestSave', (event, data, type) => {
  saveData(JSON.parse(data), type) /*  console.log(JSON.parse(data), type); */
})

ipcMain.on('requestRemove', (event, doc) => {
  console.log(JSON.parse(doc))
  removeData(JSON.parse(doc))
})

ipcMain.on('export:PDF', async (event, type, hasDate, hasVTR, data) => {
  let fileName = ''
  /* if (type == 'combustivel') fileName = 'Relatório-de-Transações-de-Combustível ' + month
  if (type == 'manutencao' && month != '' && vtrMonth == false) fileName = 'Relatório-de-Manutenções ' + month
  if (type == 'manutencao' && month == '') fileName = 'Relatório-de-Manutenções - ' + data[0].VTR
  if (type == 'manutencao' && month != '' && vtrMonth == true) fileName = 'Relatório-de-Manutenções - ' + data[0].VTR + ' - ' + month
  fileName = fileName + '.pdf' */

  let result

  if (type == 'combustivel') {
    result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
      defaultPath: fileName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
  }
  else {
    result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
      defaultPath: fileName,
      filters: [{ name: 'PDF', extensions: ['PDF'] }]
    })
  }
  if (result.canceled) return null
  else {
    const dir = result.filePath
    const doc = montarPDF(type, JSON.parse(hasDate), JSON.parse(hasVTR), JSON.parse(data))

    writeFileSync(dir, doc.output(), 'ascii')
    return dir
  }
})

ipcMain.on('import:Excel', async (event, fullpath, type, workSheet) => {
  if (type == 'load') {
    getMetaData(fullpath).then(value => {
      event.reply('importRes:Excel', value, type)
    })
    return
  }
  console.log(fullpath);
  importExcel(fullpath, workSheet).then(value => {
    console.log(value);
    event.reply('importRes:Excel', value, type)
  })
})