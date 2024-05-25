export const convert = {
      convertDateToFormatString: (date) => {
            date = new Date(date)
            date = [date.getDate(), date.getMonth() + 1, date.getFullYear()]

            if (date[0].toString().length === 1) date[0] = '0' + date[0]
            if (date[1].toString().length === 1) date[1] = '0' + date[1]

            //'DD-MM-YYYY'
            date = date[0] + '/' + date[1] + '/' + date[2]

            return date
      },
      convertDateToMilliseconds: (date) => {
            date = date.split('/')
            date = date[2] + '/' + date[1] + '/' + date[0]
            return Date.parse(new Date(date))
      },
      formatMonthString: (date) => {
            date = date.split('/')
            date = date[1] + '/' + date[0] + '/01'
            return date
      },

      formatCurrency: (value) => {
            return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
            }).format(value);
      },
      sortDate: (array) => {
            return array.sort((objA, objB) => {
                  return objA.timestamp - objB.timestamp
            })
      }
}