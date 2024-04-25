const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));
let db = new PouchDB('DB')
db.info().then(function (info) { console.log(info) })
/* db.destroy(); */
/* db.allDocs({
      include_docs: true
    }).then(function (result) {
      console.log(result.rows)
    }).catch(function (err) {
      console.log(err);
    }); */
/* db.find({
      selector: {vtr: 'VTR 30'},
    }).then(function (result) {
      console.log(result.docs)
    }).catch(function (err) {
      console.log(err);
    }); */


/* console.log(new Date().toISOString());
console.log(new Date());
console.log(Date.parse(new Date()));
console.log(convertMilToDate(Date.parse(new Date()))); */

function convertMilToDate(date) {
      date = new Date(date)

      date = [date.getDate(), date.getMonth() + 1, date.getFullYear()]

      if (date[0].toString().length === 1) date[0] = '0' + date[0]
      if (date[1].toString().length === 1) date[1] = '0' + date[1]

      //'DD-MM-YYYY'
      date = date[0] + '/' + date[1] + '/' + date[2]
      //console.log(date)

      return date
}
/* date = '20/12/2024'
date = date.split('/')
date = date[2]+'-'+date[1]+'-'+date[0]
console.log(date);
console.log(new Date(date)); */
console.log(convertMilToDate(new Date()));function convertVTR(vtr) {
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

/* console.log(convertVTR('FTL9G53')); */

