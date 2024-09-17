const Excel = require('exceljs');
const { v4: uuidv4 } = require("uuid");

async function getMetaData(fileName) {
      const wb = new Excel.Workbook();
      await wb.xlsx.readFile(fileName);
      let sheets = []
      wb.worksheets.forEach(sheet => {
            sheets.push(sheet.name)
      })
      return sheets
}

async function importExcel(fileName, workSheet) {
      const wb = new Excel.Workbook();
      await wb.xlsx.readFile(fileName);
      const sheet = wb.getWorksheet(workSheet)

      let items = []
      const columnsArr = [0, 4, 8, 12, 16, 20]
      //find years
      let yearArr = []
      let row = 1
      sheet.columns[columnsArr[0]].eachCell((cell, rowNumber) => {
            if (typeof cell.value == 'number') yearArr.push({ year: cell.value, row: rowNumber })
            row = rowNumber + 1
      })
      yearArr.push({ year: null, row: row + 20 })
      //console.log(yearArr);

      //loop per year
      for (let y = 0; y < yearArr.length; y++) {
            if (yearArr[y].year == null) break

            ////// GET MONTH TABLES ADDRESS
            let yearBruteData = []
            for (let c = 0; c < columnsArr.length; c++) {
                  let arr = []
                  sheet.columns[columnsArr[c]].eachCell((cell, rowNumber) => {
                        if (rowNumber > yearArr[y].row && rowNumber < yearArr[y + 1].row) {
                              if (typeof cell.value == 'string' && cell.value != null && cell.value.length >= 16) {
                                    arr.push({
                                          text: (cell.value).trim(),
                                          row: rowNumber,
                                          col: cell.col
                                    })
                              }
                        }
                  })
                  yearBruteData.push(arr)
            }

            //sort month table address
            let yearData = []
            for (let i = 0; i < 2; i++) {
                  for (let b = 0; b < 6; b++) yearData.push(yearBruteData[b][i])
            }
            //console.log(yearData);
            /////////////////////

            // GET TABLE ITEMS
            for (let m = 0; m < yearData.length; m++) {
                  let row = yearData[m].row + 2
                  let col = yearData[m].col + 1

                  let done = 0
                  let i = 0
                  while (done < 1) {
                        if (sheet.getCell(row + i, col).value == null) {
                              done++
                              break
                        }
                        let date = (yearData[m].text).slice(0, 7).trim()
                        items.push({
                              _id: uuidv4(),
                              vtr: sheet.name,
                              placa: (yearData[m].text).slice(-7),
                              name: sheet.getCell(row + i, col).value,
                              price: sheet.getCell(row + i, col + 1).value,
                              date: formatDate(date.slice(0, -3))
                        })
                        i++
                  }
            }
      }
      items = unirItems(items)
      //console.log(items);

      return items
}

async function importExcelAll(fileName) {
      let sheetsToParse
      let itemsArr = []
      await getMetaData(fileName).then(sheets => { sheetsToParse = sheets })
      for (let i = 0; i < sheetsToParse.length; i++) {
            await importExcel(fileName, sheetsToParse[i])
                  .then(items => {
                        if (items != undefined) {
                              items.forEach(item => {
                                    itemsArr.push(item);
                              })
                        }
                  })
                  .catch(err => { console.log(err); })
      }
      //console.log(itemsArr);

      let manVtr = [], manPlaca = []
      let vtr = 'a', placa = 'a'
      for (let i = 0; i < itemsArr.length; i++) {
            if (itemsArr[i].vtr != vtr) manVtr.push({ vtr: itemsArr[i].vtr })
            if (itemsArr[i].placa != placa) manPlaca.push({ placa: itemsArr[i].placa })
            vtr = itemsArr[i].vtr
            placa = itemsArr[i].placa
      }

      let allItems = {
            items: itemsArr,
            manVtr: manVtr,
            manPlaca: manPlaca
      }

      return allItems
}


function unirItems(data) {
      let temp = {};
      for (let i = 0; i < data.length; i++) {
            let obj = data[i]
            if (!temp[obj.date]) {
                  temp[obj.date] = obj;
                  temp[obj.date].totalCost = obj.price;
                  temp[obj.date].items = temp[obj.date].items ? temp[obj.date].items : [];
                  temp[obj.date].items.push({ name: obj.name, price: obj.price })
            }
            else {
                  temp[obj.date].totalCost += obj.price;
                  temp[obj.date].items = temp[obj.date].items ? temp[obj.date].items : [];
                  temp[obj.date].items.push({ name: obj.name, price: obj.price })
            }
      };
      let result = [];
      for (let prop in temp) result.push(temp[prop]);
      result.forEach(element => {
            delete element.name
            delete element.price
      });
      return result
}

function formatDate(date) {
      const months = [
            "JAN", "FEV", "MAR", "ABR", "MAIO", "JUN",
            "JUL", "AGO", "SET", "OUT", "NOV", "DEC"
      ]
      date = months.indexOf(date) + 1
      return date
}

let file = 'C:/marcelinho/MANUTENÇÃO-VTRS2.xlsx'
let sheet
/* getMetaData(file).then(sheets => {
      sheet = sheets[0]
      console.log(sheet);
}).then(() => {
      importExcel(file, sheet).then(items => { console.log(items) })
}) */

importExcelAll(file).then(items => {
      console.log(items.manPlaca); console.log(items.manVtr);
})