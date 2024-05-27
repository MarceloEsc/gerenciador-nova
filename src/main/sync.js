import axios from "axios";
import 'dotenv/config'
import db from "./db";
import { BrowserWindow, dialog } from "electron";



async function auth() {
      let date = db.getDBDate();
      let request = getRequestOptions('auth', process.env.CLOUDFLARE_API_KEY, date);
      let result;
      await axios.request(request)
            .then(async response => result = response.data)
            .catch(error => {
                  console.error(error);
                  console.log('line 16');
                  result = null;
            });
      return result
}

async function checkSyncState() {
      let authRes = await auth();
      if (authRes.status == 'synced') return 'synced';

      if (authRes.auth == 'autenticado' && authRes.status == 'behind') {
            let result;
            await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                  type: 'question',
                  buttons: ['Atualizar', 'Cancelar'],
                  noLink: true,
                  title: 'Aviso',
                  cancelId: 99,
                  message: 'Seu banco de dados está desatualizado!'
            }).then(async (boxRes) => {
                  if (boxRes.response === 0) {
                        result = await syncRecieveRemoteDB(authRes.key, authRes.date);
                  }
                  else result = null;
            })
            return result
      }
      else if (authRes.auth == 'autenticado' && authRes.status == 'ahead') {
            return await syncSendLocalDB(authRes.key);
      }
      return 'error'
}

async function syncSendLocalDB(key) {
      let request = getRequestOptions('putDB', key);
      await axios.request(request)
            .then(response => console.log(response.status))
            .catch(error => { console.error(error); console.log('line 53'); });
      return 'sent'
}

async function syncRecieveRemoteDB(key, date) {
      let request = getRequestOptions('getDB', key, date);
      await axios.request(request)
            .then(response => {
                  db.deleteDBTable('Faturas');
                  let { faturas, vtr } = proccessData(response.data)
                  db.insertFaturas(faturas);
                  db.insertVTR(vtr, true);
            })
            .catch(error => { console.error(error); console.log('line 65'); });
      return 'reload'
}

function proccessData(data) {
      let object = { faturas: [], vtr: [] }
      object.faturas = data.faturas
      object.vtr = data.vtr
      return object
}

/**
 * 
 * @param {string} type
 * @param {number} key
 * @param {number} date
 * @returns {object} request object
 */
function getRequestOptions(type, key, date) {
      switch (type) {
            case 'auth':
                  let auth = {
                        method: 'GET',
                        url: 'https://nova-db-sync-service.marceloescobarjunior.workers.dev/auth',
                        headers: { 'Content-Type': 'application/json' },
                        data: {
                              key: key,
                              date: date
                        }
                  };
                  return auth
            case 'getDB':
                  let getDB = {
                        method: 'GET',
                        url: 'https://nova-db-sync-service.marceloescobarjunior.workers.dev/db',
                        headers: { 'Content-Type': 'application/json' },
                        data: {
                              key: key
                        }
                  };
                  return getDB
            case 'putDB':
                  let data = { faturas: [], vtr: [] }
                  data.faturas = db.getCombustivel()
                  data.vtr = db.getVTR()

                  let putDB = {
                        method: 'PUT',
                        url: 'https://nova-db-sync-service.marceloescobarjunior.workers.dev/db',
                        headers: { 'Content-Type': 'application/json' },
                        data: {
                              key: key,
                              date: date,
                              data: data
                        }
                  };
                  return putDB
      }
}

function test() {
      return true
}

export default { checkSyncState, test }