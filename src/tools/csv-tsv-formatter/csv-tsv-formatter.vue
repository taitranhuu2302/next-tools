<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { ArrowRightLeft, FileSpreadsheet, Settings } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';
import { formatCsvTsv } from './csv-tsv-formatter.service';
import type { DelimiterType } from './csv-tsv-formatter.service';

const { t } = useToolI18n()

const inputText = ref('name,age,city\nJohn,30,Hanoi\nJane,28,Da Nang')
const inputType = useStorage<'auto' | DelimiterType>('csv-tsv-formatter:input-type', 'auto')
const outputType = useStorage<DelimiterType>('csv-tsv-formatter:output-type', 'tsv')
const trimCells = useStorage('csv-tsv-formatter:trim-cells', true)
const skipEmptyLines = useStorage('csv-tsv-formatter:skip-empty-lines', true)
const normalizeColumns = useStorage('csv-tsv-formatter:normalize-columns', true)

const options = computed(() => ({
  inputType: inputType.value,
  outputType: outputType.value,
  trimCells: trimCells.value,
  skipEmptyLines: skipEmptyLines.value,
  normalizeColumns: normalizeColumns.value,
}))

const inputValidation = useValidation({
  source: inputText,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => formatCsvTsv(value, options.value)),
      message: t('tools.csv-tsv-formatter.invalidInput', 'Invalid delimited text format'),
    },
  ]),
})

const formatResult = computed(() => {
  if (!inputText.value.trim() || inputValidation.status === 'error') {
    return null
  }

  return withDefaultOnError(() => formatCsvTsv(inputText.value, options.value), null)
})

const detectedInputLabel = computed(() => {
  if (!formatResult.value) {
    return '-'
  }

  return formatResult.value.detectedInputType === 'csv'
    ? t('tools.csv-tsv-formatter.csv', 'CSV')
    : t('tools.csv-tsv-formatter.tsv', 'TSV')
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5 text-primary" />
            {{ t('tools.csv-tsv-formatter.configTitle', 'Configuration') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.csv-tsv-formatter.configDescription', 'Choose input and output delimiters, then normalize the table content.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{{ t('tools.csv-tsv-formatter.inputTypeLabel', 'Input type') }}</FieldLabel>
                <FieldContent>
                  <Select v-model="inputType">
                    <SelectTrigger data-testid="input-type-select">
                      <SelectValue :placeholder="inputType" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        {{ t('tools.csv-tsv-formatter.autoDetect', 'Auto detect') }}
                      </SelectItem>
                      <SelectItem value="csv">
                        {{ t('tools.csv-tsv-formatter.csv', 'CSV') }}
                      </SelectItem>
                      <SelectItem value="tsv">
                        {{ t('tools.csv-tsv-formatter.tsv', 'TSV') }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.csv-tsv-formatter.outputTypeLabel', 'Output type') }}</FieldLabel>
                <FieldContent>
                  <Select v-model="outputType">
                    <SelectTrigger data-testid="output-type-select">
                      <SelectValue :placeholder="outputType" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        {{ t('tools.csv-tsv-formatter.csv', 'CSV') }}
                      </SelectItem>
                      <SelectItem value="tsv">
                        {{ t('tools.csv-tsv-formatter.tsv', 'TSV') }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <span class="text-sm font-medium">{{ t('tools.csv-tsv-formatter.trimCells', 'Trim cells') }}</span>
                <Switch v-model="trimCells" data-testid="trim-cells-switch" />
              </div>

              <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <span class="text-sm font-medium">{{ t('tools.csv-tsv-formatter.skipEmptyLines', 'Skip empty lines') }}</span>
                <Switch v-model="skipEmptyLines" data-testid="skip-empty-lines-switch" />
              </div>

              <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <span class="text-sm font-medium">{{ t('tools.csv-tsv-formatter.normalizeColumns', 'Normalize columns') }}</span>
                <Switch v-model="normalizeColumns" data-testid="normalize-columns-switch" />
              </div>
            </div>

            <p class="text-xs text-muted-foreground">
              {{ t('tools.csv-tsv-formatter.detectedInput', 'Detected input') }}: {{ detectedInputLabel }}
              <span v-if="formatResult"> | {{ t('tools.csv-tsv-formatter.rows', 'Rows') }}: {{ formatResult.rowCount }} | {{ t('tools.csv-tsv-formatter.columns', 'Columns') }}: {{ formatResult.columnCount }}</span>
            </p>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <FileSpreadsheet class="h-5 w-5 text-primary" />
              {{ t('tools.csv-tsv-formatter.cardInputTitle', 'Input') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.csv-tsv-formatter.cardInputDescription', 'Paste CSV or TSV text to format and convert.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Textarea
            v-model="inputText"
            :placeholder="t('tools.csv-tsv-formatter.inputPlaceholder', 'Paste CSV/TSV data here...')"
            rows="16"
            class="max-h-96 resize-y overflow-y-auto font-mono"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-testid="formatter-input"
          />

          <Alert
            v-if="inputValidation.status === 'error'"
            variant="destructive"
            class="border-destructive/40 bg-destructive/10"
            data-testid="formatter-error"
          >
            <AlertTitle class="text-sm">
              {{ t('tools.csv-tsv-formatter.invalidInputTitle', 'Invalid input') }}
            </AlertTitle>
            <AlertDescription class="text-xs">
              {{ inputValidation.message }}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card v-if="inputValidation.status !== 'error'" class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <ArrowRightLeft class="h-5 w-5 text-primary" />
              {{ t('tools.csv-tsv-formatter.cardOutputTitle', 'Formatted output') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.csv-tsv-formatter.cardOutputDescription', 'Copy the normalized text in your selected output format.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TextareaCopyable :value="formatResult?.output || ''" language="text" class="min-h-20" data-testid="formatter-output" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
