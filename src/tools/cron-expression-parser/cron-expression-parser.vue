<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { AlarmClockCheck, ListTree } from 'lucide-vue-next';
import { computed } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { cn } from '@/lib/utils';
import { tableCellClasses, tableContainerClasses, tableHeadClasses, tableHeaderClasses } from '@/utils/table';
import { withDefaultOnError } from '@/utils/defaults';
import { isCronExpressionValid, parseCronExpression } from './cron-expression-parser.service';

const { t, locale } = useToolI18n()

const expression = useStorage('cron-expression-parser:expression', '0 */15 * * * *')

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
</script>

<template>
  <div class="flex flex-col gap-6">
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
