const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
const { v4: uuidv4 } = require("uuid");
import { convert } from '../renderer/src/scripts/convert';

let db = new PouchDB('DB', { revs_limit: 1, auto_compaction: true })
db.info().then(function (info) { console.log(info) })

let rows = [];

function fazerListaFatura(pages) {
      const page = pages;
      //console.log(page)

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
      let stageCounter = 0;

      const keys = Object.keys(parseObj.fields);

      let list = [];

      for (let row in page) {
            //console.log(page[row]);
            if (row.length > 0) {
                  if (
                        page[row].join("").search(parseObj.searchValue[stageCounter]) >= 0
                  ) {
                        stageCounter++;
                        if (stageCounter == parseObj.searchValue.length) stageCounter = 1;
                        //console.log(page[row][0]);
                  } else if (stageCounter == parseObj.searchValue.length - 1) {
                        if (keys.length == page[row].length) {
                              let data = {};

                              keys.forEach((key) => {
                                    const index = parseObj.fields[key];

                                    const val = page[row][index];
                                    //console.log(val)

                                    data[key] = val;
                              });

                              list.push(data);
                        } else if (keys.length !== page[row].length) {
                              let data2 = {};
                              keys.forEach((key) => {
                                    const index = parseObj.fields[key];

                                    const val = page[row][index];

                                    data2[key] = val;
                              });
                              //console.log(data2)
                              list.push(data2);
                        }
                  }
            }
      }

      return list;
}

export async function faturaLog(err, item) {
      if (err) console.error(err);
      else if (!item) {
            // end of file, or page
            let resultado = fazerListaFatura(rows);
            //console.log(resultado)

            await handlePDFData(resultado)
            rows = []; // clear rows for next page
      } else if (item.text) {
            (rows[item.y] = rows[item.y] || []).push(item.text); // accumulate text items into rows object, per line
      }
}

//RECEBER OS DADOSC DO PDF E SALVAR NO DB
async function handlePDFData(dadosC) {
      let db = new PouchDB('PDFDB', { revs_limit: 1, auto_compaction: true })
      dadosC.forEach(dado => {

            dado._id = uuidv4()
            dado.date = convert.convertDateToMilliseconds(dado.date.slice(0, 10))
            if (dado.driver === undefined) {
                  dado.driver = null;
            };

            if (dado.price === undefined) {
                  dado.price = null;
            } else {
                  dado.price = parseFloat(dado.price.replace(/,/g, '.'))
            };

            if (dado.doc === undefined) {
                  dado.doc = null;
            };

            if (dado.odometer === undefined) {
                  dado.odometer = null;
            } else {
                  dado.odometer = parseFloat(dado.odometer)
            };

            if (dado.produto === undefined) {
                  dado.produto = null;
            };

            if (dado.lt !== undefined) {
                  dado.lt = dado.lt.slice(0, -1)
                  dado.lt = parseFloat(dado.lt.replace(/,/g, '.'))
            } else if (dado.lt === undefined) {
                  dado.lt = null;

            };

            if (dado.cost === undefined) {
                  dado.cost = null;
            } else {
                  dado.cost = parseFloat(dado.cost.replace(/,/g, '.'))
            };

            if (dado.unit === undefined) {
                  dado.unit = null;
            };

            dado.vtr = convertVTR(dado.vtr)

            dado.tag = 'combustivel'
            
            db.put(dado)
            //console.log(dado)
      });
      db.info().then(function (info) { console.log(info) })      
}

//TO-DO - ADICIONAR UMA FORMA DE EDITAR A LISTA DE VTR
function convertVTR(vtr) {
      const vtr_list = [
            { vtr: 'VTR 25', placa: 'SWX7J40'},
            { vtr: 'VTR 26', placa: 'FUS8A67'},
            { vtr: 'VTR 27', placa: 'GIQ8F05'},
            { vtr: 'VTR 28', placa: 'GED7C04'},
            { vtr: 'VTR 29', placa: 'EZU2242'},
            { vtr: 'VTR 30', placa: 'GDN5B92'},
            { vtr: 'VTR 31', placa: 'DMC2E19'},
            { vtr: 'VTR 32', placa: 'FJN3A42'},
            { vtr: 'VTR 33', placa: 'FTL9G53'},
            { vtr: 'VTR 34', placa: 'GBK4J07'},
            { vtr: 'VTR 35', placa: 'FRR6H75'},
            { vtr: 'VTR 36', placa: 'GHX0C34'},
            { vtr: 'VTR 37', placa: 'FGJ2H91'},
            { vtr: 'VTR 38', placa: 'FVV5I21'},
            { vtr: 'VTR 39', placa: 'GBJ9J34'},
            { vtr: 'VTR 40', placa: 'CUM4C25'},
            { vtr: 'VTR 41', placa: 'GIF2G21'}
          ]
      vtr_list.forEach(veiculo => {
            if (vtr == veiculo.placa) vtr = veiculo.vtr
      })

      return vtr
}

/**
 * consultaPDF: get all pdf items parsed and stored
 **/
export async function consultaPDF() {
      let db = new PouchDB('PDFDB', { revs_limit: 1, auto_compaction: true })
      console.log(2);

      return db.allDocs({
            include_docs: true,
      }).then(function (result) {
            //console.log(result)
            //console.log(result.rows);
            db.info().then(function (info) { console.log(info) })  
            let docs = result.rows

            docs.forEach(doc => {
                  //console.log(doc.doc);
                  db.remove(doc.doc._id, doc.doc._rev)
            });
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
            selector: {tag: tag},
          }).then(function (result) {
            return result.docs
          }).catch(function (err) {
            console.log(err);
          });

      //return consultaArray
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
          .then(() => {return db.get(dado._id);})
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
