import { app, shell, BrowserWindow, ipcMain, nativeTheme, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { watch, cp } from 'fs'
import 'dotenv/config'
import icon from '../../resources/favicon.ico?asset'
const windowStateKeeper = require('electron-window-state')
const { PdfReader } = require('pdfreader')
const { writeFileSync, readFileSync } = require('fs')
import { montarPDF } from './exportPdf.js'
import { getMetaData, importExcel, importExcelAll } from './importExcel.js'
import { faturaLog } from './pdf-reader.js'
import { populateVTR } from './vtr-handler.js'
import db from './db.js'
/* import sync from './sync.js' */

//autoUpdater.forceDevUpdateConfig = true
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.autoRunAppAfterInstall = true
//console.log(autoUpdater);

/**
 * @type {BrowserWindow}
 */
let mainWindow

function createWindow() {
  let windowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 900,
    theme: { "themeSource": "system" }
  })

  mainWindow = new BrowserWindow({
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
      sandbox: false,
    }
  })

  windowState.manage(mainWindow)

  nativeTheme.themeSource = windowState.theme.themeSource

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  //DONT FORGET FOR FUCK SAKE
  /* mainWindow.webContents.on('did-finish-load', async () => await syncDB()) */

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
  electronApp.setAppUserModelId('com.gerenciador.nova')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  autoUpdater.checkForUpdatesAndNotify()
  /* setTimeout(() => {
    // FORGOT WHY I DID THIS AND I HOPE IT DOESNT BRAKE CAUSE I COMMENTED IT
    autoUpdater.checkForUpdatesAndNotify()
  }, 2000) */

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

autoUpdater.on('update-available', (info) => autoUpdater.downloadUpdate())
autoUpdater.on('error', (err) => dialog.showErrorBox('Erro', err))
autoUpdater.on('update-downloaded', async (info) => {
  console.log(info)
  await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
    type: 'question',
    buttons: ['Atualizar', 'Cancelar'],
    noLink: true,
    title: 'Aviso',
    cancelId: 99,
    message: 'Atualização disponível, instalar agora?'
  })
    .then((response) => {
      if (response.response === 0 && !is.dev) {
        autoUpdater.quitAndInstall(true, true);
      }
    })
})

/* app.on('window-all-closed', (event) => {
  event.preventDefault()
  sync.checkSyncState('close').then(() => app.quit())
}) */

ipcMain.on('toggleTheme', (event) => {
  let theme = nativeTheme.themeSource
  if (theme == 'light' || theme == 'system') {
    nativeTheme.themeSource = 'dark'
    return
  }
  nativeTheme.themeSource = 'light'
})
ipcMain.handle('init:GetTheme', (event) => nativeTheme.themeSource)

ipcMain.on('export:PDF', async (event, type, hasDate, hasVTR, data) => {
  hasDate = JSON.parse(hasDate)
  hasVTR = JSON.parse(hasVTR)
  data = JSON.parse(data)

  let fileName = ''
  //manutenção-mes-2024
  if (type == 'combustivel') {
    let date
    if (hasDate.state) {
      date = hasDate.timestamp.split('/')
      date = date[1] + '-' + date[0]
    }
    if (hasDate.state && hasVTR.state) fileName = 'Combustível-' + data[0].vtr + '-' + date
    else if (hasDate.state && !hasVTR.state) fileName = 'Combustível-' + date
    else if (!hasDate.state && hasVTR.state) fileName = 'Combustível-' + data[0].vtr
  }

  if (type == 'manutencao') {
    if (hasVTR.state && !hasDate) fileName = 'Manutenção-' + data[0].vtr
    else if (!hasVTR.state && hasDate) fileName = 'Manutenção-' + hasDate
    else if (type == 'manutencao') fileName = 'Manutenção-' + data[0].vtr + '-' + hasDate
  }
  fileName = fileName + '.pdf'

  console.log(fileName);
  let result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    defaultPath: fileName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (result.canceled) return null
  else {
    const dir = result.filePath
    const doc = montarPDF(type, hasDate, hasVTR, data)

    writeFileSync(dir, doc.output(), 'ascii')
    shell.openPath(dir)
    return dir
  }
})

let watcher = null
let excelPath, excelType, excelWorkSheet

const watcherFunc = (eventname, filename) => {
  if (eventname == 'change') {
    console.log(eventname); console.log(filename);
    if (excelType == 'load') {
      getMetaData(excelPath).then(value => {
        mainWindow.webContents.send('importRes:Excel', value, excelType)
      })
      return
    }
    else if (excelType == 'all') {
      importExcelAll(excelPath).then(items => {
        mainWindow.webContents.send('importRes:Excel', items, excelType)
      }).catch(err => {
        console.log(err);
      })
      return
    }
    importExcel(excelPath, excelWorkSheet).then(value => {
      console.log(value);
      mainWindow.webContents.send('importRes:Excel', value, excelType)
    })
  }
}

ipcMain.on('import:Excel', async (event, fullpath, type, workSheet) => {
  excelPath = fullpath
  excelType = type
  excelWorkSheet = workSheet
  if (watcher) {
    watcher.close()
    watcher = null
  }
  if (!fullpath) {
    return
  }
  console.log(fullpath);
  watcher = watch(fullpath, watcherFunc)

  if (type == 'load') {
    getMetaData(fullpath).then(value => {
      event.reply('importRes:Excel', value, type)
    })
    return
  }
  else if (type == 'all') {
    importExcelAll(fullpath).then(items => {
      event.reply('importRes:Excel', items, type)
    }).catch(err => {
      console.log(err);
    })
    return
  }
  importExcel(fullpath, workSheet).then(value => {
    console.log(value);
    event.reply('importRes:Excel', value, type)
  })
})

ipcMain.on('import:ExcelMultiple', async (event, files) => {
  files = JSON.parse(files)
  let data = []
  Promise.all(files.map(async path => {
    let items = await importExcelAll(path)
    data = data.concat(items)
  }))
    .then(() => {
      console.log('reply');
      event.reply('importRes:Excel', data, 'multiple')
    })
})

ipcMain.on('export:DB', async (event) => {
  let date = new Date().toLocaleDateString().replace(/\//g, '-')
  let result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    defaultPath: `DB-backup-${date}.db`,
    filters: [{ name: 'db', extensions: ['db'] }]
  })
  if (result.canceled) return null
  try {
    db.backupExport(result.filePath)
    event.reply('DB:result', result.filePath, 'export')
  } catch (err) {
    console.error(err);
    event.reply('DB:result', '', 'error')
  }
})

ipcMain.on('import:DB', async (event) => {
  let defaultPath = (app.getPath('userData') + `/nova.db`)
  let result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    filters: [{ name: 'db', extensions: ['db'] }]
  })
  if (result.canceled) return null
  let backup = result.filePaths[0]
  db.close()
  cp(backup, defaultPath, { force: true }, (err) => {
    if (err) {
      console.error(err);
    }
  })
  setTimeout(() => {
    db.importBackup(defaultPath)
    mainWindow.webContents.send('reloadData')
    event.reply('DB:result', backup, 'import')
  }, 1000);

})

const callParse = new PdfReader()

ipcMain.handle('sendData:converter-pdf', (event, fullpath) => {
  console.log('converter ' + fullpath)
  callParse.parseFileItems(fullpath, faturaLog)

  return new Promise((resolve) => {
    setTimeout(() => {
      const result = db.getFaturasTemp()
      resolve(result)
    }, 500);
  })
})

ipcMain.handle('populateVTR', async (event) => {
  let result = db.getVTR()
  if (result.length == 0) return populateVTR()
  else return result
});

ipcMain.handle('requestData:Combustivel', (event) => db.getCombustivel())

ipcMain.on('insertFaturas', (event, data) => db.insertFaturas(JSON.parse(data)))

ipcMain.on('insertVTR', (event, data) => db.insertVTR(JSON.parse(data)))

ipcMain.on('deleteEntry', (event, table, data) => db.deleteEntry(table, JSON.parse(data)))

ipcMain.on('updateVTR', (event, oldData, newData) => db.updateVTR(JSON.parse(oldData), JSON.parse(newData)))

ipcMain.on('updateFaturas', (event, oldData, newData, type) => db.updateFaturas(JSON.parse(oldData), JSON.parse(newData), type))

/* ipcMain.on('checkSync', () => syncDB())

setInterval(async () => syncDB(), 300000); */

/* async function syncDB() {
  let result = await sync.checkSyncState()
  if (result == 'reload') {
    mainWindow.webContents.send('reloadData')
  }
  console.log(result);
  mainWindow.webContents.send('requestStatus', result)
  return result
} */