<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { FileSpreadsheet, Settings } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';
import { convertCsvToJson, detectDelimiter } from './csv-to-json.service';

const { t } = useToolI18n()

const csvInput = ref('name,age,active\nJohn,30,true\nJane,25,false')
const delimiterInput = useStorage('csv-to-json:delimiter', ',')
const hasHeader = useStorage('csv-to-json:has-header', true)
const inferTypes = useStorage('csv-to-json:infer-types', true)
const skipEmptyLines = useStorage('csv-to-json:skip-empty-lines', true)
const formatJson = useStorage('csv-to-json:format-json', true)

const detectedDelimiter = computed(() => detectDelimiter(csvInput.value))

const jsonOutput = computed(() => {
  if (!csvInput.value.trim()) {
    return ''
  }

  const delimiter = delimiterInput.value || detectedDelimiter.value

  return withDefaultOnError(() => {
    const converted = convertCsvToJson(csvInput.value, {
      delimiter,
      hasHeader: hasHeader.value,
      inferTypes: inferTypes.value,
      skipEmptyLines: skipEmptyLines.value,
    })

    return formatJson.value
      ? JSON.stringify(converted, null, 2)
      : JSON.stringify(converted)
  }, '')
})

const csvInputValidation = useValidation({
  source: csvInput,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => {
        const delimiter = delimiterInput.value || detectDelimiter(value)
        convertCsvToJson(value, {
          delimiter,
          hasHeader: hasHeader.value,
          inferTypes: inferTypes.value,
          skipEmptyLines: skipEmptyLines.value,
        })
      }),
      message: t('tools.csv-to-json.invalidCsv', 'Invalid CSV format'),
    },
  ]),
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5 text-primary" />
            {{ t('tools.csv-to-json.configTitle', 'Configuration') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.csv-to-json.configDescription', 'Configure delimiter and parsing options for your CSV data.') }}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel>
                {{ t('tools.csv-to-json.delimiterLabel', 'Delimiter') }}
              </FieldLabel>
              <FieldContent class="space-y-2">
                <Input
                  v-model="delimiterInput"
                  :placeholder="t('tools.csv-to-json.delimiterPlaceholder', 'Leave empty to auto detect')"
                  class="max-w-xs"
                  data-testid="delimiter-input"
                />
                <p class="text-xs text-muted-foreground">
                  {{ t('tools.csv-to-json.detectedDelimiter', 'Detected delimiter') }}: <span class="font-mono">{{ detectedDelimiter === '\t' ? '\\t' : detectedDelimiter }}</span>
                </p>
              </FieldContent>
            </Field>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <span class="text-sm font-medium">{{ t('tools.csv-to-json.firstRowHeader', 'First row is header') }}</span>
                <Switch v-model="hasHeader" data-testid="has-header-switch" />
              </div>

              <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <span class="text-sm font-medium">{{ t('tools.csv-to-json.inferTypes', 'Infer primitive types') }}</span>
                <Switch v-model="inferTypes" data-testid="infer-types-switch" />
              </div>

              <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <span class="text-sm font-medium">{{ t('tools.csv-to-json.skipEmptyLines', 'Skip empty lines') }}</span>
                <Switch v-model="skipEmptyLines" data-testid="skip-empty-lines-switch" />
              </div>

              <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <span class="text-sm font-medium">{{ t('tools.csv-to-json.formatJson', 'Format JSON') }}</span>
                <Switch v-model="formatJson" data-testid="format-json-switch" />
              </div>
            </div>
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
              {{ t('tools.csv-to-json.cardInputTitle', 'CSV input') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.csv-to-json.cardInputDescription', 'Paste CSV data to convert it into JSON.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldContent class="space-y-2">
                <Textarea
                  id="csv-input"
                  v-model="csvInput"
                  :placeholder="t('tools.csv-to-json.inputPlaceholder', 'Paste your CSV here...')"
                  rows="16"
                  class="max-h-96 resize-y overflow-y-auto font-mono"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-testid="csv-input"
                />

                <Alert
                  v-if="csvInputValidation.status === 'error'"
                  variant="destructive"
                  class="border-destructive/40 bg-destructive/10"
                  data-testid="error-message"
                >
                  <AlertTitle class="text-sm">
                    {{ t('tools.csv-to-json.invalidCsvTitle', 'Invalid CSV') }}
                  </AlertTitle>
                  <AlertDescription class="text-xs">
                    {{ csvInputValidation.message }}
                  </AlertDescription>
                </Alert>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card v-if="csvInputValidation.status !== 'error'" class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <FileSpreadsheet class="h-5 w-5 text-primary" />
              {{ t('tools.csv-to-json.cardOutputTitle', 'JSON output') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.csv-to-json.cardOutputDescription', 'Review and copy the generated JSON result.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldContent>
                <TextareaCopyable :value="jsonOutput" language="json" class="min-h-20" data-testid="json-output" />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>

    <Separator />
  </div>
</template>
