type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

interface GeneratorContext {
  interfaces: Map<string, string>
  usedNames: Set<string>
}

function toPascalCase(input: string): string {
  const cleaned = input.replace(/[\W_]+/g, ' ')
  const words = cleaned.split(' ').filter(Boolean)
  const base = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') || 'Type'
  return /^\d/.test(base) ? `N${base}` : base
}

function uniqueName(baseName: string, context: GeneratorContext): string {
  let name = toPascalCase(baseName)
  let index = 1

  while (context.usedNames.has(name)) {
    index += 1
    name = `${toPascalCase(baseName)}${index}`
  }

  context.usedNames.add(name)
  return name
}

function isValidIdentifier(key: string): boolean {
  return /^[$_a-z][\w$]*$/i.test(key)
}

function formatPropertyName(key: string): string {
  return isValidIdentifier(key) ? key : JSON.stringify(key)
}

function mergeUnion(types: string[]): string {
  return [...new Set(types)].sort().join(' | ')
}

function inferType(value: JsonValue, typeName: string, context: GeneratorContext): string {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'unknown[]'
    }

    const memberTypes = value.map((item, index) => inferType(item, `${typeName}Item${index + 1}`, context))
    return `(${mergeUnion(memberTypes)})[]`
  }

  if (typeof value === 'object') {
    const interfaceName = uniqueName(typeName, context)
    const entries = Object.entries(value)

    if (entries.length === 0) {
      context.interfaces.set(interfaceName, `export interface ${interfaceName} {\n  [key: string]: unknown\n}`)
      return interfaceName
    }

    const body = entries
      .map(([key, nestedValue]) => {
        const nestedType = inferType(nestedValue, `${interfaceName}${toPascalCase(key)}`, context)
        return `  ${formatPropertyName(key)}: ${nestedType}`
      })
      .join('\n')

    context.interfaces.set(interfaceName, `export interface ${interfaceName} {\n${body}\n}`)
    return interfaceName
  }

  if (typeof value === 'string') {
    return 'string'
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'number' : 'number'
  }

  return 'boolean'
}

function generateTypesFromJson(input: string, rootTypeName = 'RootObject'): string {
  const parsed = JSON.parse(input) as JsonValue
  const context: GeneratorContext = {
    interfaces: new Map<string, string>(),
    usedNames: new Set<string>(),
  }

  const rootType = inferType(parsed, rootTypeName, context)
  const interfaces = [...context.interfaces.values()]

  if (interfaces.length === 0) {
    return `export type Root = ${rootType}`
  }

  const rootAlias = `export type Root = ${rootType}`
  return `${interfaces.join('\n\n')}\n\n${rootAlias}`
}

export { generateTypesFromJson }
