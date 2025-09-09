import ExcelJS from 'exceljs'

export function dataToCSV(data: any[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const csv = [headers.join(',')]
  for (const row of data) {
    const values = headers.map(h => {
      const value = row[h] ?? ''
      // Use JSON.stringify to properly escape commas and quotes
      return JSON.stringify(value)
    })
    csv.push(values.join(','))
  }
  return csv.join('\n')
}

export async function dataToExcelBuffer(data: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Data')

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }))
    data.forEach(item => {
      worksheet.addRow(item)
    })
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer
  return Buffer.from(buffer)
}
