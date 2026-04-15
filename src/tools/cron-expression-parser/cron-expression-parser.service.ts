import { isValidCron } from 'cron-validator'
import cronstrue from 'cronstrue/i18n'

type CronFieldName =
  | 'second'
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek'
  | 'year'

interface CronFieldPart {
  key: CronFieldName
  value: string
  detail: string
}

interface CronParseResult {
  expression: string
  fieldCount: number
  description: string
  fields: CronFieldPart[]
}

interface CronBuildInput {
  second: string
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
  includeYear: boolean
  year?: string
}

function isCronExpressionValid(expression: string): boolean {
  const value = expression.trim()
  if (!value) {
    return false
  }

  return isValidCron(value, {
    allowBlankDay: true,
    alias: true,
    seconds: true,
  })
}

function getFieldOrder(fieldCount: number): CronFieldName[] {
  if (fieldCount === 5) {
    return ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
  }

  if (fieldCount === 6) {
    return ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
  }

  return ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek', 'year']
}

function describeFieldSyntax(value: string): string {
  if (value === '*') {
    return 'Every value'
  }

  if (value === '?') {
    return 'No specific value'
  }

  if (/^\*\/\d+$/.test(value)) {
    return `Every ${value.split('/')[1]} units`
  }

  if (/^\d+-\d+$/.test(value)) {
    return 'Range of values'
  }

  if (/^\d+(?:,\d+)+$/.test(value)) {
    return 'List of values'
  }

  if (/^\d+$/.test(value)) {
    return 'Single value'
  }

  if (/[LW#]/.test(value)) {
    return 'Advanced cron syntax'
  }

  if (/^\d+\/\d+$/.test(value)) {
    return 'Start and step interval'
  }

  return 'Custom expression segment'
}

function parseCronExpression(expression: string, locale: string): CronParseResult {
  const normalized = expression.trim().replace(/\s+/g, ' ')
  if (!isCronExpressionValid(normalized)) {
    throw new Error('Invalid cron expression')
  }

  const tokens = normalized.split(' ')
  const fieldCount = tokens.length
  const fieldOrder = getFieldOrder(fieldCount)

  const fields = fieldOrder.map((key, index) => ({
    key,
    value: tokens[index] || '',
    detail: describeFieldSyntax(tokens[index] || ''),
  }))

  const cronstrueLocale = locale === 'zh' ? 'zh_CN' : locale

  const description = cronstrue.toString(normalized, {
    throwExceptionOnParseError: true,
    verbose: true,
    dayOfWeekStartIndexZero: true,
    use24HourTimeFormat: true,
    locale: cronstrueLocale,
  })

  return {
    expression: normalized,
    fieldCount,
    description,
    fields,
  }
}

function buildCronExpression(input: CronBuildInput): string {
  const fields = [
    input.second.trim() || '*',
    input.minute.trim() || '*',
    input.hour.trim() || '*',
    input.dayOfMonth.trim() || '*',
    input.month.trim() || '*',
    input.dayOfWeek.trim() || '*',
  ]

  if (input.includeYear) {
    fields.push(input.year?.trim() || '*')
  }

  return fields.join(' ')
}

export { buildCronExpression, isCronExpressionValid, parseCronExpression }
export type { CronBuildInput, CronFieldName, CronFieldPart, CronParseResult }
