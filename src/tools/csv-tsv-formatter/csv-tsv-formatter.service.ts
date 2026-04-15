type DelimiterType = 'csv' | 'tsv'

interface CsvTsvFormatterOptions {
  inputType: DelimiterType | 'auto'
  outputType: DelimiterType
  trimCells: boolean
  skipEmptyLines: boolean
  normalizeColumns: boolean
}

interface CsvTsvFormatterResult {
  output: string
  detectedInputType: DelimiterType
  rowCount: number
  columnCount: number
}

const DELIMITER_MAP: Record<DelimiterType, string> = {
  csv: ',',
  tsv: '\t',
}

function detectDelimiterType(input: string): DelimiterType {
  const firstLine = input
    .split(/\r?\n/)
    .find(line => line.trim().length > 0) ?? ''

  const commaCount = firstLine.split(',').length - 1
  const tabCount = firstLine.split('\t').length - 1

  return tabCount > commaCount ? 'tsv' : 'csv'
}

function parseDelimitedRows(input: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const next = input[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"'
        i++
        continue
      }

      inQuotes = !inQuotes
      continue
    }

    if (!inQuotes && char === delimiter) {
      row.push(value)
      value = ''
      continue
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      row.push(value)
      rows.push(row)
      row = []
      value = ''

      if (char === '\r' && next === '\n') {
        i++
      }
      continue
    }

    value += char
  }

  if (inQuotes) {
    throw new Error('Unclosed quoted field')
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  return rows
}

function serializeDelimitedRows(rows: string[][], delimiter: string): string {
  const escapeCell = (cell: string) => {
    const requiresQuote =
      cell.includes('"')
      || cell.includes('\n')
      || cell.includes('\r')
      || cell.includes(delimiter)
      || /^\s|\s$/.test(cell)

    const escaped = cell.replaceAll('"', '""')
    return requiresQuote ? `"${escaped}"` : escaped
  }

  return rows
    .map(row => row.map(escapeCell).join(delimiter))
    .join('\n')
}

function formatCsvTsv(input: string, options: CsvTsvFormatterOptions): CsvTsvFormatterResult {
  const detectedInputType = options.inputType === 'auto'
    ? detectDelimiterType(input)
    : options.inputType

  const inputDelimiter = DELIMITER_MAP[detectedInputType]
  const outputDelimiter = DELIMITER_MAP[options.outputType]

  const parsedRows = parseDelimitedRows(input, inputDelimiter)

  let rows = options.skipEmptyLines
    ? parsedRows.filter(row => row.some(cell => cell.trim() !== ''))
    : parsedRows

  if (options.trimCells) {
    rows = rows.map(row => row.map(cell => cell.trim()))
  }

  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0)

  if (options.normalizeColumns && maxColumns > 0) {
    rows = rows.map((row) => {
      if (row.length >= maxColumns) {
        return row.slice(0, maxColumns)
      }

      return [...row, ...Array.from({ length: maxColumns - row.length }, () => '')]
    })
  }

  return {
    output: serializeDelimitedRows(rows, outputDelimiter),
    detectedInputType,
    rowCount: rows.length,
    columnCount: maxColumns,
  }
}

export { detectDelimiterType, formatCsvTsv, parseDelimitedRows }
export type { CsvTsvFormatterOptions, CsvTsvFormatterResult, DelimiterType }
