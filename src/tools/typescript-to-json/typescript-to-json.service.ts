import JSON5 from 'json5'

function extractFirstLiteralBlock(input: string): string {
  const source = input.trim()
  if (!source) {
    return ''
  }

  const firstObjectIndex = source.indexOf('{')
  const firstArrayIndex = source.indexOf('[')
  const firstBraceIndex =
    firstObjectIndex === -1
      ? firstArrayIndex
      : firstArrayIndex === -1
          ? firstObjectIndex
          : Math.min(firstObjectIndex, firstArrayIndex)
  if (firstBraceIndex < 0) {
    return source
  }

  const opening = source[firstBraceIndex]
  const closing = opening === '{' ? '}' : ']'

  let depth = 0
  let inString: 'single' | 'double' | 'template' | null = null
  let escaped = false

  for (let i = firstBraceIndex; i < source.length; i++) {
    const char = source[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (
        (inString === 'single' && char === '\'')
        || (inString === 'double' && char === '"')
        || (inString === 'template' && char === '`')
      ) {
        inString = null
      }

      continue
    }

    if (char === '\'') {
      inString = 'single'
      continue
    }

    if (char === '"') {
      inString = 'double'
      continue
    }

    if (char === '`') {
      inString = 'template'
      continue
    }

    if (char === opening) {
      depth += 1
      continue
    }

    if (char === closing) {
      depth -= 1
      if (depth === 0) {
        return source.slice(firstBraceIndex, i + 1)
      }
    }
  }

  throw new Error('Unable to find a complete object or array literal')
}

function convertTypeScriptToJson(input: string, pretty = true): string {
  const literal = extractFirstLiteralBlock(input)

  if (!literal) {
    return ''
  }

  const parsed = JSON5.parse(literal)
  return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed)
}

export { convertTypeScriptToJson, extractFirstLiteralBlock }
