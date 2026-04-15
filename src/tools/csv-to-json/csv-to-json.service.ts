interface CsvToJsonOptions {
  delimiter: string
  hasHeader: boolean
  inferTypes: boolean
  skipEmptyLines: boolean
}

const DEFAULT_OPTIONS: CsvToJsonOptions = {
  delimiter: ',',
  hasHeader: true,
  inferTypes: true,
  skipEmptyLines: true,
}

function detectDelimiter(input: string): string {
  const firstLine = input
    .split(/\r?\n/)
    .find(line => line.trim().length > 0) ?? ''

  const candidates = [',', ';', '\t', '|']
  const best = candidates
    .map(delimiter => ({ delimiter, count: firstLine.split(delimiter).length - 1 }))
    .sort((a, b) => b.count - a.count)[0]

  return best.count > 0 ? best.delimiter : ','
}

function parseCsvRows(input: string, delimiter: string): string[][] {
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

function normalizeHeaders(rawHeaders: string[]): string[] {
  const counters = new Map<string, number>()

  return rawHeaders.map((header, index) => {
    const baseHeader = header.trim() || `column_${index + 1}`
    const count = counters.get(baseHeader) ?? 0
    counters.set(baseHeader, count + 1)

    if (count === 0) {
      return baseHeader
    }

    return `${baseHeader}_${count + 1}`
  })
}

function inferValue(value: string): unknown {
  const trimmed = value.trim()

  if (trimmed === '') {
    return ''
  }

  if (/^(?:true|false)$/i.test(trimmed)) {
    return /^true$/i.test(trimmed)
  }

  if (/^null$/i.test(trimmed)) {
    return null
  }

  if (/^-?\d+$/.test(trimmed)) {
    const asNumber = Number(trimmed)
    if (Number.isSafeInteger(asNumber)) {
      return asNumber
    }

    return trimmed
  }

  if (/^-?(?:\d+\.\d+|\d+\.|\.\d+|\d+e[+-]?\d+|\d+\.\d+e[+-]?\d+|\d+\.e[+-]?\d+|\.\d+e[+-]?\d+)$/i.test(trimmed)) {
    const asNumber = Number(trimmed)
    if (Number.isFinite(asNumber)) {
      return asNumber
    }
  }

  return value
}

function convertCsvToJson(input: string, options: Partial<CsvToJsonOptions> = {}): unknown[] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  const delimiter = mergedOptions.delimiter || detectDelimiter(input)
  const parsedRows = parseCsvRows(input, delimiter)

  const rows = mergedOptions.skipEmptyLines
    ? parsedRows.filter(row => row.some(cell => cell.trim() !== ''))
    : parsedRows

  if (rows.length === 0) {
    return []
  }

  if (!mergedOptions.hasHeader) {
    return rows.map(row => row.map(cell => mergedOptions.inferTypes ? inferValue(cell) : cell))
  }

  const [headerRow, ...dataRows] = rows
  const headers = normalizeHeaders(headerRow)

  return dataRows.map((row) => {
    const record: Record<string, unknown> = {}
    headers.forEach((header, index) => {
      const cell = row[index] ?? ''
      record[header] = mergedOptions.inferTypes ? inferValue(cell) : cell
    })

    return record
  })
}

export { convertCsvToJson, detectDelimiter }
export type { CsvToJsonOptions }
