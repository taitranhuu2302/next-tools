import Ajv from 'ajv'

interface ValidationError {
  path: string
  message: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

const JSON_SCHEMA_META = 'https://json-schema.org/draft/2020-12/schema'

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false })

function parseJson(value: string): unknown {
  return JSON.parse(value)
}

function getJsonType(value: unknown): string | null {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return 'array'
  }

  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return Number.isInteger(value) ? 'integer' : 'number'
    case 'boolean':
      return 'boolean'
    case 'object':
      return 'object'
    default:
      return null
  }
}

function buildSchema(value: unknown, strictMode = true): Record<string, unknown> {
  const jsonType = getJsonType(value)

  if (jsonType === 'object' && value && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    const properties: Record<string, unknown> = {}

    for (const [key, childValue] of entries) {
      properties[key] = buildSchema(childValue, strictMode)
    }

    return {
      type: 'object',
      properties,
      required: entries.map(([key]) => key),
      additionalProperties: !strictMode,
    }
  }

  if (jsonType === 'array' && Array.isArray(value)) {
    if (value.length === 0) {
      return {
        type: 'array',
        items: {},
      }
    }

    const uniqueItemSchemas = new Map<string, Record<string, unknown>>()

    for (const item of value) {
      const itemSchema = buildSchema(item, strictMode)
      uniqueItemSchemas.set(JSON.stringify(itemSchema), itemSchema)
    }

    const itemSchemas = Array.from(uniqueItemSchemas.values())

    return {
      type: 'array',
      items: itemSchemas.length === 1 ? itemSchemas[0] : { anyOf: itemSchemas },
    }
  }

  if (jsonType === 'string') {
    return { type: 'string' }
  }

  if (jsonType === 'integer') {
    return { type: 'integer' }
  }

  if (jsonType === 'number') {
    return { type: 'number' }
  }

  if (jsonType === 'boolean') {
    return { type: 'boolean' }
  }

  if (jsonType === 'null') {
    return { type: 'null' }
  }

  return {}
}

function generateJsonSchemaFromSample(sampleJson: string, strictMode = true): string {
  const parsed = parseJson(sampleJson)
  const schema = buildSchema(parsed, strictMode)

  return JSON.stringify({
    $schema: JSON_SCHEMA_META,
    ...schema,
  }, null, 2)
}

function validateJsonSchema({ sampleJson, schemaJson }: { sampleJson: string, schemaJson: string }): ValidationResult {
  const parsedSample = parseJson(sampleJson)
  const parsedSchema = parseJson(schemaJson) as Record<string, unknown>

  const validate = ajv.compile(parsedSchema)
  const valid = validate(parsedSample) === true

  return {
    valid,
    errors: (validate.errors ?? []).map(error => ({
      path: error.instancePath || '/',
      message: error.message || 'Invalid value',
    })),
  }
}

export { buildSchema, generateJsonSchemaFromSample, validateJsonSchema }
export type { ValidationError, ValidationResult }
