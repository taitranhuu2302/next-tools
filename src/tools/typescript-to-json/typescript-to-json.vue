<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { FileJson2, FileType2, Settings } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';
import { convertTypeScriptToJson } from './typescript-to-json.service';

const { t } = useToolI18n()

const typeScriptInput = ref(`const config: AppConfig = {
  env: 'production',
  retries: 3,
  features: {
    upload: true,
    quota: 10_000,
  },
}`)

const formatJson = useStorage('typescript-to-json:format-json', true)

const inputValidation = useValidation({
  source: typeScriptInput,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => convertTypeScriptToJson(value, formatJson.value)),
      message: t('tools.typescript-to-json.invalidInput', 'Input must contain a valid TypeScript object/array literal'),
    },
  ]),
})

const jsonOutput = computed(() => {
  if (!typeScriptInput.value.trim() || inputValidation.status === 'error') {
    return ''
  }

  return withDefaultOnError(() => convertTypeScriptToJson(typeScriptInput.value, formatJson.value), '')
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5 text-primary" />
            {{ t('tools.typescript-to-json.configTitle', 'Configuration') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.typescript-to-json.configDescription', 'Convert TypeScript object/array literals into JSON.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
          <span class="text-sm font-medium">{{ t('tools.typescript-to-json.formatJson', 'Format JSON output') }}</span>
          <Switch v-model="formatJson" data-testid="format-json-switch" />
        </div>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <FileType2 class="h-5 w-5 text-primary" />
              {{ t('tools.typescript-to-json.cardInputTitle', 'TypeScript input') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.typescript-to-json.cardInputDescription', 'Paste TypeScript code containing an object or array literal.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Textarea
            v-model="typeScriptInput"
            rows="16"
            class="max-h-96 resize-y overflow-y-auto font-mono"
            data-testid="typescript-input"
            :placeholder="t('tools.typescript-to-json.inputPlaceholder', 'Paste TypeScript value here...')"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
          <Alert
            v-if="inputValidation.status === 'error'"
            variant="destructive"
            class="border-destructive/40 bg-destructive/10"
            data-testid="typescript-error"
          >
            <AlertTitle class="text-sm">
              {{ t('tools.typescript-to-json.invalidInputTitle', 'Invalid TypeScript input') }}
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
              <FileJson2 class="h-5 w-5 text-primary" />
              {{ t('tools.typescript-to-json.cardOutputTitle', 'JSON output') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.typescript-to-json.cardOutputDescription', 'Review and copy the converted JSON output.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>{{ t('tools.typescript-to-json.outputLabel', 'Converted JSON') }}</FieldLabel>
                <FieldContent>
                  <TextareaCopyable :value="jsonOutput" language="json" class="min-h-20" data-testid="json-output" />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
