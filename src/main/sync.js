import axios from "axios";
import 'dotenv/config'
import db from "./db";
import { BrowserWindow, dialog } from "electron";



async function auth() {
      let date = db.getDBDate();
      let request = getRequestOptions('auth', date);
      let result;
      await axios.request(request)
            .then(async response => result = response.data)
            .catch(error => {
                  console.error(error);
                  result = null;
            });
      return result
}

async function checkSyncState() {
      let authRes = await auth();
      console.log(authRes);
      if (!authRes) return null;

      if (authRes.auth == 'autenticado' && authRes.state == 'behind') {
            return syncSendLocalDB(authRes.date);
      }
      else if (authRes.auth == 'autenticado' && authRes.state == 'ahead') {
            await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                  type: 'question',
                  buttons: ['Atualizar', 'Cancelar'],
                  noLink: true,
                  title: 'Aviso',
                  cancelId: 99,
                  message: 'Seu banco de dados está desatualizado!'
            })
                  .then((boxRes) => {
                        if (boxRes.response === 0) {
                              result = response.data;
                        }
                        else result = null;
                  })
            return syncRecieveRemoteDB();
      }
      else if (authRes.auth == 'autenticado' && authRes.state == 'behind') {
            return syncSendLocalDB(authRes.date);
      }
}

function syncSendLocalDB() {
      let request = getRequestOptions('putDB', date);
      axios.request(request)
            .then(response => console.log(response.status))
            .catch(error => console.error(error));
}

function syncRecieveRemoteDB() {
      let request = getRequestOptions('putDB');
      axios.request(request)
            .then(response => {
                  db.deleteDBTable('Faturas');
                  let { faturas, vtr } = proccessData(response.data)
                  db.insertFaturas(faturas);
                  db.insertVTR(vtr, true)
            })
            .catch(error => console.error(error));
}

function proccessData(data) {
      let object = { faturas: [], vtr: [] }
      object.faturas = response.data
      object.vtr = response.data
      return object
}

function getRequestOptions(type, date) {
      switch (type) {
            case 'auth':
                  let auth = {
                        method: 'GET',
                        url: 'https://nova-db-sync-service.marceloescobarjunior.workers.dev/auth',
                        headers: { 'Content-Type': 'application/json' },
                        data: {
                              key: process.env.CLOUDFLARE_API_KEY,
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
                              key: process.env.CLOUDFLARE_API_KEY
                        }
                  };
                  return getDB
            case 'putDB':
                  let object = { faturas: [], vtr: [] }
                  object.faturas = db.getCombustivel()
                  object.vtr = db.getVTR()
                  let putDB = {
                        method: 'PUT',
                        url: 'https://nova-db-sync-service.marceloescobarjunior.workers.dev/db',
                        headers: { 'Content-Type': 'application/json' },
                        data: {
                              key: process.env.CLOUDFLARE_API_KEY,
                              date: date,
                              data: object
                        }
                  };
                  return putDB
      }
}

function test() {
      return true
}

export default { checkSyncState, test }