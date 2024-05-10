const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
const { v4: uuidv4 } = require("uuid");
import { app } from 'electron';
import { convert } from '../renderer/src/scripts/convert';
let db = new PouchDB((app.getPath('userData') + '/DB'), { revs_limit: 1, auto_compaction: true })
db.info().then(function (info) { console.log(info) })

function fazerListaFatura(page) {
      const parseObj = {
            searchValue: [/Data - Tn/gi, /Detalhamento da fatura/i],
            fields: {
                  date: 0,
                  vtr: 1,
                  driver: 2,
                  price: 3,
                  doc: 4,
                  odometer: 5,
                  produto: 6,
                  lt: 7,
                  cost: 8,
                  unit: 9,
            },
      };
      const keys = Object.keys(parseObj.fields);
      let stageCounter = 0;
      let list = [];

      for (let row in page) {
            if (row.length > 0) {
                  if (page[row].join("").search(parseObj.searchValue[stageCounter]) >= 0) {
                        stageCounter++;
                        if (stageCounter == parseObj.searchValue.length) stageCounter = 1;
                  }
                  else if (stageCounter == parseObj.searchValue.length - 1) {
                        if (keys.length == page[row].length) {
                              let data = {};

                              keys.forEach((key) => {
                                    const index = parseObj.fields[key];
                                    const val = page[row][index];
                                    data[key] = val;
                              });

                              list.push(data);
                        }
                        else if (keys.length !== page[row].length) {
                              let data2 = {};
                              keys.forEach((key) => {
                                    const index = parseObj.fields[key];
                                    const val = page[row][index];
                                    data2[key] = val;
                              });
                              list.push(data2);
                        }
                  }
            }
      }
      return list;
}

let rows = [];
export async function faturaLog(err, item) {
      if (err) console.error(err);
      else if (!item) {
            // end of file, or page
            let resultado = fazerListaFatura(rows);
            //console.log(resultado)
            await handlePDFData(resultado)
            rows = []; // clear rows for next page
      }
      else if (item.text) {
            (rows[item.y] = rows[item.y] || []).push(item.text);
      }
}

//RECEBER OS DADOSC DO PDF E SALVAR NO DB
async function handlePDFData(dadosC) {
      let db = new PouchDB('PDFDB', { revs_limit: 1, auto_compaction: true })
      dadosC.forEach(async dado => {

            dado._id = uuidv4()
            dado.date = convert.convertDateToMilliseconds(dado.date.slice(0, 10))
            if (dado.driver === undefined) dado.driver = null;

            if (dado.price === undefined) dado.price = null;
            else dado.price = parseFloat(dado.price.replace(/,/g, '.'))

            if (dado.doc === undefined) dado.doc = null;

            if (dado.odometer === undefined) dado.odometer = null;
            else dado.odometer = parseFloat(dado.odometer)

            if (dado.produto === undefined) dado.produto = null;

            if (dado.lt !== undefined) {
                  dado.lt = parseFloat(dado.lt.replace(/,/g, '.'))
            }
            else if (dado.lt === undefined) dado.lt = null;

            if (dado.cost === undefined) dado.cost = null;
            else dado.cost = parseFloat(dado.cost.replace(/,/g, '.'))

            if (dado.unit === undefined) dado.unit = null;

            dado.vtr = await convertVTR(dado.vtr)
            dado.tag = 'combustivel'

            db.put(dado)
            //console.log(dado)
      });
      db.info().then(function (info) { console.log(info) })
}

//TO-DO - ADICIONAR UMA FORMA DE EDITAR A LISTA DE VTR
async function convertVTR(vtr) {
      const vtr_list = await getVTRList()
      for (let i = 0; i < vtr_list.length; i++) {
            if (vtr == vtr_list[i].placa) return vtr_list[i].label
      }
      return vtr
}

/**
 * consultaPDF: get all pdf items parsed and stored
 **/
export async function consultaPDF() {
      let db = new PouchDB('PDFDB', { revs_limit: 1, auto_compaction: true })

      return db.allDocs({
            include_docs: true,
      }).then(function (result) {
            db.info().then(function (info) { console.log(info) })
            db.destroy();
            return result.rows
      }).catch(function (err) {
            console.log(err);
      });
}

/**
 * consultaTag: get all items with a specific `tag`
 **/
export async function consultaTag(tag) {
      //let consultaArray = []

      return db.find({
            selector: { tag: tag },
      }).then(function (result) {
            return result.docs
      }).catch(function (err) {
            console.log(err);
      });

      //return consultaArray
}

/**
 * consultaTudo: retorna todos os dados no banco de dados
 */
export async function consultaTudo() {

}

/**
 * saveData: put data in db or update data by specifying `type`
 **/
export function saveData(dado, type) {
      /* console.log(dado); */
      if (type === 'save') {
            dado.forEach(dado => {
                  dado.date = convert.convertDateToMilliseconds(dado.date)
                  db.put(dado)
            })
            return
      }

      //UPDATE
      db.get(dado._id).then(doc => {
            dado.date = convert.convertDateToMilliseconds(dado.date)
            dado._rev = doc._rev
            console.log(dado);
            return db.put(dado);
      })
            .then(() => { return db.get(dado._id); })
            .then(doc => console.log(doc))
            .catch(function (err) {
                  console.log(err);
                  db.info().then(function (info) { console.log(info) })
            });
}

/**
 * removeData: delete data by `doc._id`
 **/
export function removeData(dado) {
      /* console.log(dado);
      return */
      db.get(dado._id).then(function (doc) {
            return db.remove(doc);
      });
}

export async function exportDB() {
      return db.allDocs({
            include_docs: true,
      }).then(function (result) {
            let array = []

            result.rows.forEach(item => {
                  array.push(item.doc)
            })
            return array
      }).catch(function (err) {
            console.log(err);
      });
}

export async function importDB(dados) {
      await db.allDocs({
            include_docs: true,
      }).then(result => {
            result.rows.forEach(doc => {
                  db.remove(doc.doc._id, doc.doc._rev)
            });
      }).catch(err => {
            console.log(err);
      });

      dados.forEach(dado => {
            db.put(dado)
      })
      db.info().then(function (info) { console.log(info) })
}

export async function getVTRList(list) {
      let newList
      await db.find({
            selector: { tag: 'vtr' },
      }).then(async result => {
            if (result.docs.length == 0) {
                  list.forEach(item => {
                        item._id = uuidv4()
                        item.tag = 'vtr'
                        db.put(item)
                  })
                  await db.find({
                        selector: { tag: 'vtr' },
                  }).then(result => {
                        newList = result.docs
                  })
            }
            else {
                  newList = result.docs
            }
      }).catch(err => {
            console.log(err);
      });
      //console.log(newList);
      newList.sort((a, b) => { return a.label.localeCompare(b.label) })
      return newList
}

export async function useVTRList(list) {
      /* await db.find({
            selector: { tag: 'vtr' },
      }).then(result => {
            result.docs.forEach(doc => {
                  db.remove(doc)
            })
      })
      return */
      list.forEach(item => {
            if (item._id == undefined) item._id = uuidv4()
            item.tag = 'vtr'
            db.put(item)
      })
}

export async function saveVTR(data) {
      db.put(data).catch(err => {
            db.get(data._id).then(doc => {
                  data._rev = doc._rev
                  return db.put(data);
            })
      })
}

export async function changeBulkVTR(oldVTR, newVTR) {
      await db.find({
            selector: { vtr: oldVTR.label },
      }).then(function (result) {
            result.docs.forEach(doc => {
                  doc.vtr = newVTR.label
                  db.put(doc)
            })
      }).catch(function (err) {
            console.log(err);
      });
}