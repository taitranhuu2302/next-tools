<script setup lang="ts">
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';
import { convertCurlToFetch } from './curl-to-fetch.service';

const { t } = useToolI18n()

const curlInput = ref(`curl 'https://api.example.com/users' \
  -H 'accept: application/json' \
  -H 'authorization: Bearer token'`)

const conversionResult = computed(() => {
  if (!curlInput.value.trim()) {
    return {
      code: '',
      warnings: [] as Array<[string, string]>,
    }
  }

  return withDefaultOnError(() => convertCurlToFetch(curlInput.value), {
    code: '',
    warnings: [] as Array<[string, string]>,
  })
})

const curlValidation = useValidation({
  source: curlInput,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => convertCurlToFetch(value)),
      message: t('tools.curl-to-fetch.invalidCurl', 'Invalid cURL command'),
    },
  ]),
})

function clearInput() {
  curlInput.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Code class="h-5 w-5 text-primary" />
            {{ t('tools.curl-to-fetch.cardInputTitle', 'cURL input') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.curl-to-fetch.cardInputDescription', 'Paste a cURL command and convert it into JavaScript fetch code.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldContent class="space-y-2">
              <Textarea
                id="curl-input"
                v-model="curlInput"
                :placeholder="t('tools.curl-to-fetch.inputPlaceholder', 'Paste your cURL command here...')"
                rows="16"
                class="max-h-96 resize-y overflow-y-auto font-mono"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                data-testid="curl-input"
              />
              <div class="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" @click="clearInput">
                  {{ t('common.clear', 'Clear') }}
                </Button>
              </div>
              <Alert
                v-if="curlValidation.status === 'error'"
                variant="destructive"
                class="border-destructive/40 bg-destructive/10"
                data-testid="error-message"
              >
                <AlertTitle class="text-sm">
                  {{ t('tools.curl-to-fetch.invalidCurlTitle', 'Invalid cURL command') }}
                </AlertTitle>
                <AlertDescription class="text-xs">
                  {{ curlValidation.message }}
                </AlertDescription>
              </Alert>
            </FieldContent>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>

    <Card v-if="curlValidation.status !== 'error'" class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Code class="h-5 w-5 text-primary" />
            {{ t('tools.curl-to-fetch.cardOutputTitle', 'Fetch output') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.curl-to-fetch.cardOutputDescription', 'Review and copy the generated fetch code.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <Textarea
          :model-value="conversionResult.code"
          readonly
          rows="16"
          class="max-h-96 resize-y overflow-y-auto font-mono"
          data-testid="fetch-output"
        />

        <Alert
          v-if="conversionResult.warnings.length > 0"
          class="border-amber-500/40 bg-amber-500/10"
          data-testid="warnings-message"
        >
          <AlertTitle class="text-sm">
            {{ t('tools.curl-to-fetch.warningsTitle', 'Conversion warnings') }}
          </AlertTitle>
          <AlertDescription class="space-y-2 text-xs">
            <p>{{ t('tools.curl-to-fetch.warningsDescription', 'Some parts of the cURL command may not map perfectly to fetch.') }}</p>
            <ul class="list-disc space-y-1 pl-4">
              <li v-for="warning in conversionResult.warnings" :key="`${warning[0]}-${warning[1]}`">
                <span class="font-mono">{{ warning[0] }}</span>: {{ warning[1] }}
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </div>
</template>
