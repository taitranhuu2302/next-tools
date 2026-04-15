<script setup lang="ts">
import JSONBig from 'json-bigint';
import { FileCode } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';

const JSONBigInt = JSONBig({ useNativeBigInt: true });

const { t } = useToolI18n()

const jsonInput = ref('')
const jsonStringInput = ref('')
const formatJson = ref(true)

function toJsonString(input: string) {
  const parsed = JSONBigInt.parse(input)
  const normalizedJson = JSONBigInt.stringify(parsed)
  return JSON.stringify(normalizedJson)
}

function extractJsonText(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed === 'string') {
      return parsed
    }
  }
  catch {
    // Fallback to direct JSON parsing below.
  }

  return trimmed
}

function toJsonObject(input: string) {
  const jsonText = extractJsonText(input)
  const parsed = JSONBigInt.parse(jsonText)
  return formatJson.value ? JSONBigInt.stringify(parsed, null, 2) : JSONBigInt.stringify(parsed)
}

const jsonStringOutput = computed(() => {
  if (!jsonInput.value.trim()) {
    return ''
  }

  return withDefaultOnError(() => toJsonString(jsonInput.value), '')
})

const jsonOutput = computed(() => {
  if (!jsonStringInput.value.trim()) {
    return ''
  }

  return withDefaultOnError(() => toJsonObject(jsonStringInput.value), '')
})

const jsonInputValidation = useValidation({
  source: jsonInput,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => toJsonString(value)),
      message: t('tools.json-string-converter.invalidJson', 'Invalid JSON'),
    },
  ]),
})

const jsonStringInputValidation = useValidation({
  source: jsonStringInput,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => toJsonObject(value)),
      message: t('tools.json-string-converter.invalidJsonString', 'Invalid JSON string'),
    },
  ]),
})
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <Card class="h-full gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <FileCode class="h-5 w-5 text-primary" />
            {{ t('tools.json-string-converter.cardEncodeTitle', 'JSON to string') }}
          </CardTitle>
          <CardDescription>
            {{
              t(
                'tools.json-string-converter.cardEncodeDescription',
                'Convert a JSON object into an escaped JSON string value.',
              )
            }}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <FieldGroup>
          <Field>
            <FieldContent class="space-y-2">
              <Textarea
                id="json-input"
                v-model="jsonInput"
                :placeholder="t('tools.json-string-converter.jsonInputPlaceholder', 'Paste JSON here...')"
                rows="12"
                class="max-h-96 resize-y overflow-y-auto font-mono"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-testid="json-input"
              />

              <Alert
                v-if="jsonInputValidation.status === 'error'"
                variant="destructive"
                class="border-destructive/40 bg-destructive/10"
                data-testid="json-input-error"
              >
                <AlertTitle class="text-sm">
                  {{ t('tools.json-string-converter.invalidJsonTitle', 'Invalid JSON') }}
                </AlertTitle>
                <AlertDescription class="text-xs">
                  {{ jsonInputValidation.message }}
                </AlertDescription>
              </Alert>

              <TextareaCopyable
                v-if="jsonInputValidation.status !== 'error'"
                :value="jsonStringOutput"
                language="json"
                class="min-h-20"
                data-testid="json-string-output"
              />
            </FieldContent>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>

    <Card class="h-full gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <FileCode class="h-5 w-5 text-primary" />
            {{ t('tools.json-string-converter.cardDecodeTitle', 'String to JSON') }}
          </CardTitle>
          <CardDescription>
            {{
              t(
                'tools.json-string-converter.cardDecodeDescription',
                'Convert an escaped JSON string value back to a JSON object.',
              )
            }}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <FieldGroup>
          <Field>
            <FieldContent class="space-y-2">
              <Textarea
                id="json-string-input"
                v-model="jsonStringInput"
                :placeholder="t('tools.json-string-converter.jsonStringInputPlaceholder', 'Paste escaped JSON string here...')"
                rows="12"
                class="max-h-96 resize-y overflow-y-auto font-mono"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-testid="json-string-input"
              />

              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">
                  {{ t('tools.json-string-converter.formatJson', 'Format JSON') }}
                </span>
                <Switch v-model="formatJson" />
              </div>

              <Alert
                v-if="jsonStringInputValidation.status === 'error'"
                variant="destructive"
                class="border-destructive/40 bg-destructive/10"
                data-testid="json-string-input-error"
              >
                <AlertTitle class="text-sm">
                  {{ t('tools.json-string-converter.invalidJsonStringTitle', 'Invalid JSON string') }}
                </AlertTitle>
                <AlertDescription class="text-xs">
                  {{ jsonStringInputValidation.message }}
                </AlertDescription>
              </Alert>

              <TextareaCopyable
                v-if="jsonStringInputValidation.status !== 'error'"
                :value="jsonOutput"
                language="json"
                class="min-h-20"
                data-testid="json-output"
              />
            </FieldContent>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  </div>
</template>
