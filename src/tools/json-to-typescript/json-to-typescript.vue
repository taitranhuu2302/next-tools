<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { FileCode2, FileJson2, Settings } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';
import { generateTypesFromJson } from './json-to-typescript.service';

const { t } = useToolI18n()

const jsonInput = ref(`{
  "id": 1,
  "name": "Alice",
  "isActive": true,
  "tags": ["admin", "editor"],
  "profile": {
    "email": "alice@example.com"
  }
}`)
const rootTypeName = useStorage('json-to-typescript:root-type-name', 'RootObject')

const jsonValidation = useValidation({
  source: jsonInput,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => JSON.parse(value)),
      message: t('tools.json-to-typescript.invalidJson', 'Invalid JSON input'),
    },
  ]),
})

const generatedTypes = computed(() => {
  if (!jsonInput.value.trim() || jsonValidation.status === 'error') {
    return ''
  }

  const normalizedRoot = rootTypeName.value.trim() || 'RootObject'
  return withDefaultOnError(() => generateTypesFromJson(jsonInput.value, normalizedRoot), '')
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5 text-primary" />
            {{ t('tools.json-to-typescript.configTitle', 'Configuration') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.json-to-typescript.configDescription', 'Set your root type name and generate TypeScript types from JSON.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel>{{ t('tools.json-to-typescript.rootTypeLabel', 'Root type name') }}</FieldLabel>
              <FieldContent>
                <Input v-model="rootTypeName" data-testid="root-type-name" class="max-w-xs font-mono" />
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <FileJson2 class="h-5 w-5 text-primary" />
              {{ t('tools.json-to-typescript.cardInputTitle', 'JSON input') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.json-to-typescript.cardInputDescription', 'Paste JSON and generate matching TypeScript types.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <Textarea
            v-model="jsonInput"
            rows="16"
            class="max-h-96 resize-y overflow-y-auto font-mono"
            data-testid="json-input"
            :placeholder="t('tools.json-to-typescript.inputPlaceholder', 'Paste JSON here...')"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
          <Alert
            v-if="jsonValidation.status === 'error'"
            variant="destructive"
            class="border-destructive/40 bg-destructive/10"
            data-testid="json-error"
          >
            <AlertTitle class="text-sm">
              {{ t('tools.json-to-typescript.invalidJsonTitle', 'Invalid JSON') }}
            </AlertTitle>
            <AlertDescription class="text-xs">
              {{ jsonValidation.message }}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card v-if="jsonValidation.status !== 'error'" class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <FileCode2 class="h-5 w-5 text-primary" />
              {{ t('tools.json-to-typescript.cardOutputTitle', 'TypeScript output') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.json-to-typescript.cardOutputDescription', 'Review and copy generated interfaces and types.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>{{ t('tools.json-to-typescript.outputLabel', 'Generated TypeScript') }}</FieldLabel>
                <FieldContent>
                  <TextareaCopyable :value="generatedTypes" language="typescript" class="min-h-20" data-testid="typescript-output" />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
