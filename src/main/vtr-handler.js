import db from './db'

// fazer um arquivo json pra ser lido
// dando assim opção de poder editar o template
const VTR_STANDARD = [
      { vtr: 'VTR 25', placa: 'SWX7J40' },
      { vtr: 'VTR 26', placa: 'FUS8A67' },
      { vtr: 'VTR 27', placa: 'GIQ8F05' },
      { vtr: 'VTR 28', placa: 'GED7C04' },
      { vtr: 'VTR 29', placa: 'EZU2242' },
      { vtr: 'VTR 30', placa: 'GDN5B92' },
      { vtr: 'VTR 31', placa: 'DMC2E19' },
      { vtr: 'VTR 32', placa: 'FJN3A42' },
      { vtr: 'VTR 33', placa: 'FTL9G53' },
      { vtr: 'VTR 34', placa: 'GBK4J07' },
      { vtr: 'VTR 35', placa: 'FRR6H75' },
      { vtr: 'VTR 36', placa: 'GHX0C34' },
      { vtr: 'VTR 37', placa: 'FGJ2H91' },
      { vtr: 'VTR 38', placa: 'FVV5I21' },
      { vtr: 'VTR 39', placa: 'GBJ9J34' },
      { vtr: 'VTR 40', placa: 'CUM4C25' },
      { vtr: 'VTR 41', placa: 'GIF2G21' }
]

export function convertVTR(placa) {
      let vtrList = db.getVTR()
      if (vtrList.length == 0) {
            populateVTR()
            return convertVTR(vtr)
      }
      for (let i = 0; i < vtrList.length; i++) {
            if (placa == vtrList[i].placa) return vtrList[i].vtr
      }
      return placa
}

export function populateVTR() {
      db.insertVTR(VTR_STANDARD, true)
      return new Promise((resolve, reject) => {
            let result = db.getVTR()
            resolve(result)
      })
}