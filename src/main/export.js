const { jsPDF } = require("jspdf");
const { readFileSync } = require('fs');
const { join } = require('path')

/**
 * @param {string} type
 * @param {{date: string, state: boolean}} hasDate
 * @param {{vtr: string, state: boolean}} hasVTR
 * @param {Array} data
 */
export function montarPDF(type, hasDate, hasVTR, data) {
      console.log(hasDate)
      console.log(hasVTR)
      let doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
      const logo = readFileSync(join(__dirname, '../../resources/logo.png'), 'base64');

      doc.addImage(logo, 'PNG', pageWidth / 2 - 18.8, 0, 37.6, 25.8)
      doc.setFontSize(15);

      if (type == 'combustivel') {
            const mes = new Date(hasDate.date).toLocaleString('pt-BR', { month: 'long' }).toLocaleUpperCase()
            const ano = new Date(hasDate.date).toLocaleString('pt-BR', { year: 'numeric' })
            let i = 1
            let total = 0
            let page = 1
            let altura = 55
            let limite = 25

            let fillColor = ['#fff', '#d2deff']
            let colorN = 1

            if (hasDate.state && hasVTR.state) {
                  doc.text("Histórico Mensal de Transações de Combustível", pageWidth / 2, 33, { align: 'center' });

                  doc.setFontSize(12);
                  doc.text(`GASTOS GERAIS DE ${mes}/${ano} - ${data[0].vtr}`, pageWidth / 2, 38, { align: 'center' });

                  doc.setFontSize(10);
                  doc.text("Data", pageWidth / 2 - 30, 55, { align: 'left' });
                  doc.text("VALOR", pageWidth / 2 + 15, 55, { align: 'left' });
                  doc.line(0, 58, 250, 58, 'S')

                  doc.setFontSize(9);
                  data.forEach(fatura => {
                        if (i >= limite - 1 && page <= page + 1) {
                              doc.addPage()
                              page++
                              i = 1
                              altura = 10
                              limite = 45
                        }

                        doc.setFillColor(fillColor[colorN])
                        doc.rect(0, altura + (i * 10) - 6.7, 220, 10, 'F')
                        if (colorN == 1) colorN = 0
                        else colorN = 1

                        doc.text(`${fatura.date}`, pageWidth / 2 - 30, altura + (i * 10), { align: 'left' });
                        doc.text(`${fatura.cost.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, pageWidth / 2 + 15, altura + (i * 10), { align: 'left' });

                        total += fatura.cost
                        i++
                  });
            }
            else if (hasDate.state && !hasVTR.state) {
                  data = somarValorVtr(data)
                  doc.text("Histórico Mensal de Transações de Combustível", pageWidth / 2, 33, { align: 'center' });

                  doc.setFontSize(12);
                  doc.text(`GASTOS GERAIS DE ${mes}/${ano}`, pageWidth / 2, 38, { align: 'center' });

                  doc.setFontSize(10);
                  doc.text("VTR", pageWidth / 2 - 30, 55, { align: 'left' });
                  doc.text("VALOR", pageWidth / 2 + 15, 55, { align: 'left' });
                  doc.line(0, 58, 250, 58, 'S')

                  doc.setFontSize(9);

                  data.sort((a, b) => { return a.vtr.localeCompare(b.vtr) })
                  data.forEach(fatura => {
                        if (i >= limite - 1 && page <= page + 1) {
                              doc.addPage()
                              page++
                              i = 1
                              altura = 10
                              limite = 45
                        }

                        doc.setFillColor(fillColor[colorN])
                        doc.rect(0, altura + (i * 10) - 6.7, 220, 10, 'F')
                        if (colorN == 1) colorN = 0
                        else colorN = 1

                        doc.text(`${fatura.vtr}`, pageWidth / 2 - 30, altura + (i * 10), { align: 'left' });
                        doc.text(`${fatura.cost.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, pageWidth / 2 + 15, altura + (i * 10), { align: 'left' });

                        total += fatura.cost
                        i++
                  });
            }
            else {
                  doc.text("Histórico de Transações de Combustível", pageWidth / 2, 33, { align: 'center' });

                  doc.setFontSize(12);
                  doc.text(`GASTOS GERAIS DE ${data[0].vtr}`, pageWidth / 2, 38, { align: 'center' });

                  doc.setFontSize(10);
                  doc.text("Data", pageWidth / 2 - 30, 55, { align: 'left' });
                  doc.text("VALOR", pageWidth / 2 + 15, 55, { align: 'left' });
                  doc.line(0, 58, 250, 58, 'S')

                  doc.setFontSize(9);
                  data.forEach(fatura => {
                        if (i >= limite - 1 && page <= page + 1) {
                              doc.addPage()
                              page++
                              i = 1
                              altura = 10
                              limite = 45
                        }

                        doc.setFillColor(fillColor[colorN])
                        doc.rect(0, altura + (i * 10) - 6.7, 220, 10, 'F')
                        if (colorN == 1) colorN = 0
                        else colorN = 1

                        doc.text(`${fatura.date}`, pageWidth / 2 - 30, altura + (i * 10), { align: 'left' });
                        doc.text(`${fatura.cost.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, pageWidth / 2 + 15, altura + (i * 10), { align: 'left' });

                        total += fatura.cost
                        i++
                  });
            }
            doc.movePage(1, doc.getNumberOfPages());
            doc.setFontSize(12);
            doc.text(`TOTAL: ${total.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 160, 48);
            doc.movePage(doc.getNumberOfPages(), 1);
            return doc
      }

      ///////MANUTENÇÃO//////////////////////////////////
      doc.text("Histórico de Manutenção", pageWidth / 2, 33, { align: 'center' });

      let i = 1
      let total = 0
      let page = 1
      let altura = 55.8
      let limite = 34
      const fillColor = ['#fff', '#d2deff']

      //VTR E MES
      if (hasVTR.state && hasDate) {
            doc.text(`GASTOS GERAIS DE ${data[0].vtr}-${hasDate}`, pageWidth / 2, 38.5, { align: 'center' });
            doc.setFontSize(10);
            doc.text("ITENS", 10, 55);
            doc.text("VTR", 100, 55);
            doc.text("DATA", 120, 55);
            doc.text("VALOR", 165, 55);
            doc.line(0, 58, 250, 58, 'S')
            doc.setFontSize(8);
            data.forEach(manut => {
                  let i2 = i

                  doc.setFillColor(fillColor[1])
                  doc.rect(0, altura + (i2 * 7) - 4.5, 220, 7, 'F')

                  doc.line(0, altura - 4.67 + (i * 7), 220, altura - 4.67 + (i * 7), 'S')

                  doc.text(`${manut.vtr}`, 100, altura + (i2 * 7));
                  doc.text(`${manut.date}`, 120, altura + (i2 * 7));
                  doc.text(`Valor Total: ${manut.totalCost.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 165, altura + (i2 * 7));

                  manut.items.forEach(item => {
                        if (i >= limite - 1 && page <= page + 1) {
                              doc.addPage()
                              page++
                              i = 1
                              altura = 10
                              limite = 40
                        }
                        doc.text(`${item.name} ${item.price.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 10, altura + (i * 7))
                        i++
                  })

                  total += manut.totalCost
                  doc.line(0, altura - 4.45 + (i * 7), 220, altura - 4.45 + (i * 7), 'S')
            })
      }
      //SÓ MES
      else if (!hasVTR.state && hasDate) {
            doc.text(`GASTOS GERAIS DE ${hasDate}`, pageWidth / 2, 38.5, { align: 'center' });
            doc.setFontSize(10);
            doc.text("ITENS", 10, 55);
            doc.text("VTR", 120, 55);
            doc.text("VALOR", 165, 55);
            doc.line(0, 58, 250, 58, 'S')
            doc.setFontSize(8);
            data.forEach(manut => {
                  let i2 = i

                  doc.setFillColor(fillColor[1])
                  doc.rect(0, altura + (i2 * 7) - 4.5, 220, 7, 'F')

                  doc.line(0, altura - 4.67 + (i * 7), 220, altura - 4.67 + (i * 7), 'S')

                  doc.text(`${manut.vtr}`, 120, altura + (i2 * 7));
                  doc.text(`Valor Total: ${manut.totalCost.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 165, altura + (i2 * 7));

                  manut.items.forEach(item => {
                        if (i >= limite - 1 && page <= page + 1) {
                              doc.addPage()
                              page++
                              i = 1
                              altura = 10
                              limite = 40
                        }
                        doc.text(`${item.name} ${item.price.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 10, altura + (i * 7))
                        i++
                  })

                  total += manut.totalCost
                  doc.line(0, altura - 4.45 + (i * 7), 220, altura - 4.45 + (i * 7), 'S')
            })
      }
      //GERAL VTR
      else if (hasVTR.state && !hasDate) {
            doc.text(`GASTOS GERAIS DE ${hasVTR.vtr}`, pageWidth / 2, 38.5, { align: 'center' });
            doc.setFontSize(10);
            doc.text("ITENS", 10, 55);
            doc.text("DATA", 120, 55);
            doc.text("VALOR", 165, 55);
            doc.line(0, 58, 250, 58, 'S')
            doc.setFontSize(8);
            data.forEach(manut => {
                  let i2 = i

                  doc.setFillColor(fillColor[1])
                  doc.rect(0, altura + (i2 * 7) - 4.5, 220, 7, 'F')

                  doc.line(0, altura - 4.67 + (i * 7), 220, altura - 4.67 + (i * 7), 'S')

                  doc.text(`${manut.date}`, 120, altura + (i2 * 7));
                  doc.text(`Valor Total: ${manut.totalCost.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 165, altura + (i2 * 7));

                  manut.items.forEach(item => {
                        if (i >= limite - 1 && page <= page + 1) {
                              doc.addPage()
                              page++
                              i = 1
                              altura = 10
                              limite = 40
                        }
                        doc.text(`${item.name} ${item.price.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 10, altura + (i * 7))
                        i++
                  })

                  total += manut.totalCost
                  doc.line(0, altura - 4.45 + (i * 7), 220, altura - 4.45 + (i * 7), 'S')
            })
      }

      doc.movePage(1, doc.getNumberOfPages());
      doc.setFontSize(12);
      doc.text(`TOTAL: ${total.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}`, 160, 45);
      doc.movePage(doc.getNumberOfPages(), 1);
      return doc
}

function somarValorVtr(data) {
      let temp = {};
      for (let i = 0; i < data.length; i++) {
            let obj = data[i]
            if (!temp[obj.vtr]) temp[obj.vtr] = obj;
            else temp[obj.vtr].cost += obj.cost;
      };
      let result = [];
      for (let prop in temp) result.push(temp[prop]);

      return result
}