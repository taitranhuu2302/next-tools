<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { FileCode2, ShieldCheck, Sparkles } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';
import { generateJsonSchemaFromSample, validateJsonSchema } from './json-schema-validator.service';

const { t } = useToolI18n()

const sampleJson = ref(`{
  "name": "John",
  "age": 30,
  "active": true,
  "roles": ["admin", "editor"],
  "profile": {
    "email": "john@example.com"
  }
}`)

const schemaInput = useStorage('json-schema-validator:schema-input', '')
const strictMode = useStorage('json-schema-validator:strict-mode', true)

const sampleJsonValidation = useValidation({
  source: sampleJson,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => JSON.parse(value)),
      message: t('tools.json-schema-validator.invalidJson', 'Invalid JSON'),
    },
  ]),
})

const generatedSchema = computed(() => {
  if (!sampleJson.value.trim()) {
    return ''
  }

  return withDefaultOnError(() => generateJsonSchemaFromSample(sampleJson.value, strictMode.value), '')
})

const schemaSource = computed(() => schemaInput.value.trim() || generatedSchema.value)

const schemaValidation = useValidation({
  source: schemaInput,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => JSON.parse(value)),
      message: t('tools.json-schema-validator.invalidSchema', 'Invalid JSON Schema'),
    },
  ]),
})

const validationResult = computed(() => {
  if (sampleJsonValidation.status === 'error' || !sampleJson.value.trim()) {
    return null
  }

  if (!schemaSource.value.trim()) {
    return null
  }

  return withDefaultOnError(() => {
    const schemaJson = schemaValidation.status === 'error'
      ? null
      : JSON.parse(schemaSource.value)

    if (!schemaJson) {
      return null
    }

    return validateJsonSchema({
      sampleJson: sampleJson.value,
      schemaJson: schemaSource.value,
    })
  }, null)
})

function useGeneratedSchema() {
  if (generatedSchema.value) {
    schemaInput.value = generatedSchema.value
  }
}

function clearSchema() {
  schemaInput.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Sparkles class="h-5 w-5 text-primary" />
            {{ t('tools.json-schema-validator.optionsTitle', 'Generation options') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.json-schema-validator.optionsDescription', 'Generate a stricter JSON Schema from the sample JSON and validate it immediately.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
          <div class="space-y-0.5">
            <p class="text-sm font-medium">
              {{ t('tools.json-schema-validator.strictMode', 'Strict mode') }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t('tools.json-schema-validator.strictModeDescription', 'Mark all observed object properties as required and disallow extra properties in generated schema.') }}
            </p>
          </div>
          <Switch v-model="strictMode" data-testid="strict-mode-switch" />
        </div>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <FileCode2 class="h-5 w-5 text-primary" />
              {{ t('tools.json-schema-validator.sampleTitle', 'Sample JSON') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.json-schema-validator.sampleDescription', 'Paste a sample JSON document to generate a schema from it.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldContent class="space-y-2">
                <Textarea
                  id="sample-json"
                  v-model="sampleJson"
                  :placeholder="t('tools.json-schema-validator.samplePlaceholder', 'Paste your sample JSON here...')"
                  rows="16"
                  class="max-h-96 resize-y overflow-y-auto font-mono"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-testid="sample-json"
                />
                <div class="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" :disabled="!generatedSchema" @click="useGeneratedSchema">
                    <ShieldCheck class="mr-2 h-4 w-4" />
                    {{ t('tools.json-schema-validator.useGeneratedSchema', 'Use generated schema') }}
                  </Button>
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>

          <Alert v-if="sampleJsonValidation.status === 'error'" variant="destructive" class="mt-4 border-destructive/40 bg-destructive/10" data-testid="sample-json-error">
            <AlertTitle class="text-sm">
              {{ t('tools.json-schema-validator.invalidJsonTitle', 'Invalid JSON') }}
            </AlertTitle>
            <AlertDescription class="text-xs">
              {{ sampleJsonValidation.message }}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <ShieldCheck class="h-5 w-5 text-primary" />
              {{ t('tools.json-schema-validator.generatedSchemaTitle', 'Generated schema') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.json-schema-validator.generatedSchemaDescription', 'A JSON Schema preview generated from the sample JSON.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            v-if="sampleJsonValidation.status !== 'error'"
            :model-value="generatedSchema"
            readonly
            rows="16"
            class="max-h-96 resize-y overflow-y-auto font-mono"
            data-testid="generated-schema"
          />
          <Alert v-else variant="destructive" class="border-destructive/40 bg-destructive/10">
            <AlertTitle class="text-sm">
              {{ t('tools.json-schema-validator.generatedSchemaUnavailableTitle', 'Schema unavailable') }}
            </AlertTitle>
            <AlertDescription class="text-xs">
              {{ t('tools.json-schema-validator.generatedSchemaUnavailableDescription', 'Fix the sample JSON to generate a schema preview.') }}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>

    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <ShieldCheck class="h-5 w-5 text-primary" />
            {{ t('tools.json-schema-validator.schemaTitle', 'Schema validator') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.json-schema-validator.schemaDescription', 'Edit the schema below or use the generated preview, then validate the sample JSON against it.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel>{{ t('tools.json-schema-validator.schemaInputLabel', 'JSON Schema (optional override)') }}</FieldLabel>
              <FieldContent class="space-y-2">
                <Textarea
                  id="schema-input"
                  v-model="schemaInput"
                  :placeholder="t('tools.json-schema-validator.schemaPlaceholder', 'Leave empty to use the generated schema...')"
                  rows="16"
                  class="max-h-96 resize-y overflow-y-auto font-mono"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-testid="schema-input"
                />
                <div class="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" :disabled="!schemaInput" @click="clearSchema">
                    {{ t('common.clear', 'Clear') }}
                  </Button>
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>

        <Alert v-if="schemaValidation.status === 'error'" variant="destructive" class="mt-4 border-destructive/40 bg-destructive/10" data-testid="schema-error">
          <AlertTitle class="text-sm">
            {{ t('tools.json-schema-validator.invalidSchemaTitle', 'Invalid JSON Schema') }}
          </AlertTitle>
          <AlertDescription class="text-xs">
            {{ schemaValidation.message }}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <ShieldCheck class="h-5 w-5 text-primary" />
            {{ t('tools.json-schema-validator.resultTitle', 'Validation result') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.json-schema-validator.resultDescription', 'The sample JSON is validated against the active schema.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Alert v-if="sampleJsonValidation.status === 'error'" variant="destructive" class="border-destructive/40 bg-destructive/10" data-testid="validation-error">
          <AlertTitle class="text-sm">
            {{ t('tools.json-schema-validator.validationUnavailableTitle', 'Validation unavailable') }}
          </AlertTitle>
          <AlertDescription class="text-xs">
            {{ t('tools.json-schema-validator.validationUnavailableDescription', 'Fix the sample JSON to validate it.') }}
          </AlertDescription>
        </Alert>

        <Alert v-else-if="schemaValidation.status === 'error'" variant="destructive" class="border-destructive/40 bg-destructive/10" data-testid="validation-error">
          <AlertTitle class="text-sm">
            {{ t('tools.json-schema-validator.validationUnavailableTitle', 'Validation unavailable') }}
          </AlertTitle>
          <AlertDescription class="text-xs">
            {{ t('tools.json-schema-validator.validationUnavailableSchemaDescription', 'Fix the schema to validate the sample JSON.') }}
          </AlertDescription>
        </Alert>

        <Alert v-else-if="validationResult?.valid" class="border-emerald-500/40 bg-emerald-500/10" data-testid="validation-success">
          <AlertTitle class="text-sm text-emerald-700 dark:text-emerald-300">
            {{ t('tools.json-schema-validator.validTitle', 'Valid JSON') }}
          </AlertTitle>
          <AlertDescription class="text-xs">
            {{ t('tools.json-schema-validator.validDescription', 'The sample JSON matches the current schema.') }}
          </AlertDescription>
        </Alert>

        <Alert v-else-if="validationResult && !validationResult.valid" variant="destructive" class="border-destructive/40 bg-destructive/10" data-testid="validation-failure">
          <AlertTitle class="text-sm">
            {{ t('tools.json-schema-validator.invalidTitle', 'Schema validation failed') }}
          </AlertTitle>
          <AlertDescription class="space-y-2 text-xs">
            <p>{{ t('tools.json-schema-validator.invalidDescription', 'The sample JSON does not satisfy the schema.') }}</p>
            <ul class="list-disc space-y-1 pl-4">
              <li v-for="error in validationResult.errors" :key="`${error.path}-${error.message}`">
                <span class="font-mono">{{ error.path }}</span>: {{ error.message }}
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </div>
</template>
