import { convert } from '../renderer/src/scripts/convert';
import db from './db'
import { convertVTR } from './vtr-handler';

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
export function faturaLog(err, item) {
      if (err) console.error(err);
      else if (!item) {
            // end of file, or page
            let resultado = fazerListaFatura(rows);
            handlePDFData(resultado)
            rows = []; // clear rows for next page
      }
      else if (item.text) {
            (rows[item.y] = rows[item.y] || []).push(item.text);
      }
}

//RECEBER OS DADOSC DO PDF E SALVAR NO DB
function handlePDFData(dados) {
      let data = []
      dados.forEach(item => {

            item.date = convert.convertDateToMilliseconds(item.date.slice(0, 10))

            item.vtr = convertVTR(item.vtr)

            if (item.lt !== undefined) {
                  item.lt = parseFloat(item.lt.replace(/,/g, '.'))
            }
            else if (item.lt === undefined) item.lt = null;

            if (item.odometer === undefined) item.odometer = null;
            else item.odometer = parseFloat(item.odometer)


            if (item.price === undefined) item.price = null;
            else item.price = parseFloat(item.price.replace(/,/g, '.'))

            data.push({
                  timestamp: item.date,
                  vtr: item.vtr,
                  lt: item.lt,
                  odometer: item.odometer,
                  price: item.price
            })
      });
      db.insertFaturasTemp(data)
}