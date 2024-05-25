const Excel = require('exceljs');
const { v4: uuidv4 } = require("uuid");

export async function getMetaData(fileName) {
      const wb = new Excel.Workbook();
      await wb.xlsx.readFile(fileName);
      let sheets = []
      wb.worksheets.forEach(sheet => {
            sheets.push({ label: sheet.name })
      })
      return sheets
}
export async function importExcel(fileName, workSheet) {
      const wb = new Excel.Workbook();
      await wb.xlsx.readFile(fileName);
      const columns = [0, 10, 20]
      const sheet = wb.getWorksheet(workSheet)

      let items = []
      for (let i = 0; i < columns.length; i++) {
            //console.log('coluna: ' + i);
            if (sheet.columns[columns[i]] == undefined) return
            let vtrArr = []
            sheet.columns[columns[i]].eachCell((cell, rowNumber) => {
                  if (typeof cell.value == 'number') vtrArr.push(rowNumber)
            })
            //console.log(vtrArr);
            let lastRow = 0
            let emptyRows = []
            sheet.columns[columns[i] + 1].eachCell((cell, rowNumber) => {
                  if (!cell.isMerged) emptyRows.push(rowNumber)
                  else if (lastRow != rowNumber - 1) emptyRows.push(rowNumber - 1)
                  lastRow = rowNumber
            })
            emptyRows.push(lastRow + 1)
            //console.log(emptyRows);

            for (let b = 0; b < vtrArr.length; b++) {
                  let cellPrice, cellItem, cellVTR
                  cellVTR = sheet.getCell(vtrArr[b], columns[i] + 1).value
                  for (let r = vtrArr[b]; r < emptyRows[b]; r++) {
                        cellItem = sheet.getCell(r, columns[i] + 2).value
                        cellPrice = sheet.getCell(r, columns[i] + 9).value

                        if (cellItem) {
                              let item = {
                                    vtr: 'VTR ' + cellVTR,
                                    name: cellItem,
                                    price: cellPrice,
                                    date: sheet.name
                              }
                              //console.log(item);
                              items.push(item)
                        }
                  }
            }
      }

      items = unirItems(items)
      items.forEach(item => {
            item._id = uuidv4()
      })
      return items
}

export async function importExcelAll(fileName) {
      let sheetsToParse
      let allItems = []
      await getMetaData(fileName).then(sheets => { sheetsToParse = sheets })
      for (let i = 0; i < sheetsToParse.length; i++) {
            await importExcel(fileName, sheetsToParse[i].label)
                  .then(items => {
                        if (items != undefined) {
                              items.forEach(item => {
                                    allItems.push(item);
                              })
                        }
                  })
                  .catch(err => { console.log(err); })
      }
      console.log(allItems);

      return allItems
}

function unirItems(data) {
      let temp = {};
      for (let i = 0; i < data.length; i++) {
            let obj = data[i]
            if (!temp[obj.vtr]) {
                  temp[obj.vtr] = obj;
                  temp[obj.vtr].totalCost = obj.price;
                  temp[obj.vtr].items = temp[obj.vtr].items ? temp[obj.vtr].items : [];
                  temp[obj.vtr].items.push({ name: obj.name, price: obj.price })
            }
            else {
                  temp[obj.vtr].totalCost += obj.price;
                  temp[obj.vtr].items = temp[obj.vtr].items ? temp[obj.vtr].items : [];
                  temp[obj.vtr].items.push({ name: obj.name, price: obj.price })
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