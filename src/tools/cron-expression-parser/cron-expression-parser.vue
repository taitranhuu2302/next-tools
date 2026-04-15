<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { AlarmClockCheck, ListTree } from 'lucide-vue-next';
import { computed } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { cn } from '@/lib/utils';
import { tableCellClasses, tableContainerClasses, tableHeadClasses, tableHeaderClasses } from '@/utils/table';
import { withDefaultOnError } from '@/utils/defaults';
import { buildCronExpression, isCronExpressionValid, parseCronExpression } from './cron-expression-parser.service';

const { t, locale } = useToolI18n()

const expression = useStorage('cron-expression-parser:expression', '0 */15 * * * *')
const buildSecond = useStorage('cron-expression-parser:build-second', '0')
const buildMinute = useStorage('cron-expression-parser:build-minute', '*/15')
const buildHour = useStorage('cron-expression-parser:build-hour', '*')
const buildDayOfMonth = useStorage('cron-expression-parser:build-day-of-month', '*')
const buildMonth = useStorage('cron-expression-parser:build-month', '*')
const buildDayOfWeek = useStorage('cron-expression-parser:build-day-of-week', '*')
const buildIncludeYear = useStorage('cron-expression-parser:build-include-year', false)
const buildYear = useStorage('cron-expression-parser:build-year', '*')

const expressionValidation = useValidation({
  source: expression,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isCronExpressionValid(value),
      message: t('tools.cron-expression-parser.invalidExpression', 'Invalid cron expression'),
    },
  ]),
})

const parsedResult = computed(() => {
  if (!expression.value.trim() || expressionValidation.status === 'error') {
    return null
  }

  return withDefaultOnError(
    () => parseCronExpression(expression.value, locale.value?.split('-')[0] || 'en'),
    null,
  )
})

const fieldLabelMap: Record<string, string> = {
  second: 'tools.cron-expression-parser.fieldSecond',
  minute: 'tools.cron-expression-parser.fieldMinute',
  hour: 'tools.cron-expression-parser.fieldHour',
  dayOfMonth: 'tools.cron-expression-parser.fieldDayOfMonth',
  month: 'tools.cron-expression-parser.fieldMonth',
  dayOfWeek: 'tools.cron-expression-parser.fieldDayOfWeek',
  year: 'tools.cron-expression-parser.fieldYear',
}

const builtExpression = computed(() => buildCronExpression({
  second: buildSecond.value,
  minute: buildMinute.value,
  hour: buildHour.value,
  dayOfMonth: buildDayOfMonth.value,
  month: buildMonth.value,
  dayOfWeek: buildDayOfWeek.value,
  includeYear: buildIncludeYear.value,
  year: buildYear.value,
}))

const builtExpressionValidation = useValidation({
  source: builtExpression,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isCronExpressionValid(value),
      message: t('tools.cron-expression-parser.invalidBuiltExpression', 'Built cron expression is not valid.'),
    },
  ]),
})

const builtParsedResult = computed(() => {
  if (!builtExpression.value.trim() || builtExpressionValidation.status === 'error') {
    return null
  }

  return withDefaultOnError(
    () => parseCronExpression(builtExpression.value, locale.value?.split('-')[0] || 'en'),
    null,
  )
})

function useBuiltExpression() {
  expression.value = builtExpression.value
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2" data-testid="cron-builder-card">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <ListTree class="h-5 w-5 text-primary" />
            {{ t('tools.cron-expression-parser.builderCardTitle', 'Build cron expression') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.cron-expression-parser.builderCardDescription', 'Fill in each cron field and generate an expression instantly.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <FieldSet>
          <FieldGroup>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel>{{ t('tools.cron-expression-parser.fieldSecond', 'Second') }}</FieldLabel>
                <FieldContent>
                  <Input v-model="buildSecond" class="font-mono" data-testid="build-second" />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.cron-expression-parser.fieldMinute', 'Minute') }}</FieldLabel>
                <FieldContent>
                  <Input v-model="buildMinute" class="font-mono" data-testid="build-minute" />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.cron-expression-parser.fieldHour', 'Hour') }}</FieldLabel>
                <FieldContent>
                  <Input v-model="buildHour" class="font-mono" data-testid="build-hour" />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.cron-expression-parser.fieldDayOfMonth', 'Day of month') }}</FieldLabel>
                <FieldContent>
                  <Input v-model="buildDayOfMonth" class="font-mono" data-testid="build-day-of-month" />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.cron-expression-parser.fieldMonth', 'Month') }}</FieldLabel>
                <FieldContent>
                  <Input v-model="buildMonth" class="font-mono" data-testid="build-month" />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.cron-expression-parser.fieldDayOfWeek', 'Day of week') }}</FieldLabel>
                <FieldContent>
                  <Input v-model="buildDayOfWeek" class="font-mono" data-testid="build-day-of-week" />
                </FieldContent>
              </Field>
            </div>

            <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
              <div class="space-y-0.5">
                <p class="text-sm font-medium">
                  {{ t('tools.cron-expression-parser.includeYear', 'Include year field') }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ t('tools.cron-expression-parser.includeYearDescription', 'Append the optional year field as the seventh cron segment.') }}
                </p>
              </div>
              <Switch v-model="buildIncludeYear" data-testid="include-year-switch" />
            </div>

            <Field v-if="buildIncludeYear">
              <FieldLabel>{{ t('tools.cron-expression-parser.fieldYear', 'Year') }}</FieldLabel>
              <FieldContent>
                <Input v-model="buildYear" class="font-mono" data-testid="build-year" />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{{ t('tools.cron-expression-parser.builtExpressionLabel', 'Built expression') }}</FieldLabel>
              <FieldContent class="space-y-2">
                <InputCopyable :value="builtExpression" readonly class="font-mono" data-testid="built-expression" />
                <div class="flex flex-wrap gap-2">
                  <Button size="sm" @click="useBuiltExpression">
                    {{ t('tools.cron-expression-parser.useBuiltExpression', 'Use in parser') }}
                  </Button>
                </div>
                <Alert
                  v-if="builtExpressionValidation.status === 'error'"
                  variant="destructive"
                  class="border-destructive/40 bg-destructive/10"
                  data-testid="built-expression-error"
                >
                  <AlertTitle class="text-sm">
                    {{ t('tools.cron-expression-parser.invalidBuiltExpressionTitle', 'Invalid built expression') }}
                  </AlertTitle>
                  <AlertDescription class="text-xs">
                    {{ builtExpressionValidation.message }}
                  </AlertDescription>
                </Alert>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        <Card v-if="builtParsedResult" class="gap-2 border-dashed bg-muted/10">
          <CardHeader>
            <div class="space-y-1">
              <CardTitle class="flex items-center gap-2 text-base">
                <ListTree class="h-4 w-4 text-primary" />
                {{ t('tools.cron-expression-parser.builtPreviewTitle', 'Built preview') }}
              </CardTitle>
              <CardDescription>
                {{ t('tools.cron-expression-parser.builtPreviewDescription', 'Preview the generated expression before loading it into the parser.') }}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <p class="text-sm font-medium" data-testid="built-human-description">
              {{ builtParsedResult.description }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t('tools.cron-expression-parser.fieldCount', 'Field count') }}: {{ builtParsedResult.fieldCount }}
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>

    <Card class="gap-2" data-testid="cron-expression-input-card">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <AlarmClockCheck class="h-5 w-5 text-primary" />
            {{ t('tools.cron-expression-parser.cardInputTitle', 'Cron expression parser') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.cron-expression-parser.cardInputDescription', 'Validate a cron expression, read its human description, and inspect each field.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel>{{ t('tools.cron-expression-parser.inputLabel', 'Cron expression') }}</FieldLabel>
              <FieldContent class="space-y-2">
                <Input
                  v-model="expression"
                  class="font-mono"
                  data-testid="cron-expression-input"
                  :placeholder="t('tools.cron-expression-parser.inputPlaceholder', 'Example: 0 */15 * * * *')"
                  :aria-invalid="expressionValidation.status === 'error'"
                />
                <Alert
                  v-if="expressionValidation.status === 'error'"
                  variant="destructive"
                  class="border-destructive/40 bg-destructive/10"
                  data-testid="cron-expression-error"
                >
                  <AlertTitle class="text-sm">
                    {{ t('tools.cron-expression-parser.invalidExpressionTitle', 'Invalid expression') }}
                  </AlertTitle>
                  <AlertDescription class="text-xs">
                    {{ expressionValidation.message }}
                  </AlertDescription>
                </Alert>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>

    <Card v-if="parsedResult" class="gap-2" data-testid="cron-expression-output-card">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <ListTree class="h-5 w-5 text-primary" />
            {{ t('tools.cron-expression-parser.cardOutputTitle', 'Parsed result') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.cron-expression-parser.cardOutputDescription', 'Human-readable interpretation and field-by-field breakdown.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="rounded-lg border bg-muted/20 p-3">
          <p class="text-xs uppercase tracking-wide text-muted-foreground">
            {{ t('tools.cron-expression-parser.descriptionLabel', 'Description') }}
          </p>
          <p class="mt-1 text-sm font-medium" data-testid="cron-human-description">
            {{ parsedResult.description }}
          </p>
          <p class="mt-2 text-xs text-muted-foreground">
            {{ t('tools.cron-expression-parser.fieldCount', 'Field count') }}: {{ parsedResult.fieldCount }}
          </p>
        </div>

        <Table :container-class="tableContainerClasses">
          <TableHeader :class="tableHeaderClasses">
            <TableRow>
              <TableHead :class="cn(tableHeadClasses)">
                {{ t('tools.cron-expression-parser.columnField', 'Field') }}
              </TableHead>
              <TableHead :class="tableHeadClasses">
                {{ t('tools.cron-expression-parser.columnValue', 'Value') }}
              </TableHead>
              <TableHead :class="tableHeadClasses">
                {{ t('tools.cron-expression-parser.columnDetail', 'Detail') }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="part in parsedResult.fields" :key="part.key">
              <TableCell :class="tableCellClasses">
                {{ t(fieldLabelMap[part.key] || '', part.key) }}
              </TableCell>
              <TableCell :class="cn(tableCellClasses, 'font-mono text-xs')">
                {{ part.value }}
              </TableCell>
              <TableCell :class="tableCellClasses">
                {{ part.detail }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
