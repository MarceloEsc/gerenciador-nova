import { convert } from '../renderer/src/scripts/convert';
import db from './db'
import { convertVTR } from './vtr-handler';

function fazerListaFatura(page) {
      const parseObj = {
            searchValue: [/Data utilização/gi, /Cidade/i],
            fields: {
                  date: 0,
                  doc: 1,
                  base: 2,
                  cnpj: 3,
                  driver: 4,
                  tipo: 5,
                  vtr: 6,
                  produto: 7,
                  lt: 8,
                  price: 9,
                  status: 10,
                  estabelecimento: 11,
                  city: 12
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
                        if (page[row].includes('Custo') || page[row].includes('Estabelecimento')) {
                              continue
                        }

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
      let finalList = []
      for (let i = 0; i < list.length; i += 2) {
            if (i + 1 > list.length) break
            //console.log(list[i]);

            list[i].cnpj = list[i].cnpj + " " + list[i + 1].doc
            list[i].driver = list[i].driver + " " + list[i + 1].base
            list[i].estabelecimento = list[i].estabelecimento + " " + list[i + 1].driver
            list[i].price = list[i].price.slice(3)
            finalList.push(list[i])
      }
      return finalList;
}

let rows = [];
let resultado = [];
export function faturaLog(err, item) {
      if (err) console.error(err);
      else if (!item) {
            // end of file, or page
            let page = fazerListaFatura(rows);
            page.forEach(item => {
                  resultado.push(item)
            })

            handlePDFData(page)
            rows = []; // clear rows for next page
            return
      }
      else if (item.text) {
            if (item.text.includes('Página') || item.text.includes('Total Geral do Contrato:')) {
                  item = null
                  faturaLog(err, item)
                  return
            }
            (rows[item.y] = rows[item.y] || []).push(item.text);
      }
}

//RECEBER OS DADOSC DO PDF E SALVAR NO DB
function handlePDFData(dados) {
      if (dados.length < 1) return
      let data = []
      console.log(dados);

      dados.forEach(item => {

            /* item.date = convert.convertDateToMilliseconds(item.date.slice(0, 10)) */
            item.date = convert.convertDateToMilliseconds(item.date)

            if (convertVTR(item.vtr) != undefined) {
                  item.vtr = convertVTR(item.vtr)
            }

            /* if (item.lt !== undefined) {
                  item.lt = parseFloat(item.lt.replace(/,/g, '.'))
            }
            else if (item.lt === undefined) item.lt = null; */
            if (item.lt === undefined) item.lt = null;

            if (item.odometer === undefined) item.odometer = null;
            /* else item.odometer = parseFloat(item.odometer) */


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