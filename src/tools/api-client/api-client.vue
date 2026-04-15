<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { Globe2, Send, ShieldAlert } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { sendApiRequest } from './api-client.service';
import type { ApiClientResponse } from './api-client.service';

const { t } = useToolI18n()

const method = useStorage('api-client:method', 'GET')
const url = useStorage('api-client:url', 'https://jsonplaceholder.typicode.com/todos/1')
const headersText = useStorage('api-client:headers', 'Accept: application/json')
const body = useStorage('api-client:body', '')
const useProxy = useStorage('api-client:use-proxy', false)
const proxyPrefix = useStorage('api-client:proxy-prefix', 'https://corsproxy.io/?')

const isLoading = ref(false)
const requestError = ref('')
const response = ref<ApiClientResponse | null>(null)

const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const urlValidation = useValidation({
  source: url,
  rules: computed(() => [
    {
      validator: (value: string) => isNotThrowing(() => new URL(value.trim())),
      message: t('tools.api-client.invalidUrl', 'Invalid URL'),
    },
  ]),
})

const headersValidation = useValidation({
  source: headersText,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => {
        value.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim()
          if (!trimmed) {
            return
          }

          if (trimmed.indexOf(':') <= 0) {
            throw new Error('Invalid header format')
          }
        })
      }),
      message: t('tools.api-client.invalidHeaders', 'Headers must use "Key: Value" format'),
    },
  ]),
})

const canSend = computed(() => {
  return urlValidation.status !== 'error' && headersValidation.status !== 'error' && !isLoading.value
})

async function onSend() {
  if (!canSend.value) {
    return
  }

  isLoading.value = true
  requestError.value = ''
  response.value = null

  try {
    response.value = await sendApiRequest({
      method: method.value,
      url: url.value,
      headersText: headersText.value,
      body: body.value,
      proxyPrefix: useProxy.value ? proxyPrefix.value : '',
    })
  }
  catch (error) {
    requestError.value = error instanceof Error ? error.message : t('tools.api-client.requestFailed', 'Request failed')
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Alert class="border-amber-500/40 bg-amber-500/10" data-testid="cors-note">
      <ShieldAlert class="h-4 w-4" />
      <AlertTitle>{{ t('tools.api-client.corsTitle', 'CORS note') }}</AlertTitle>
      <AlertDescription>
        {{ t('tools.api-client.corsDescription', 'This browser tool cannot truly bypass CORS. Use a trusted proxy or your own backend relay when needed.') }}
      </AlertDescription>
    </Alert>

    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Globe2 class="h-5 w-5 text-primary" />
            {{ t('tools.api-client.requestTitle', 'Request') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.api-client.requestDescription', 'Send an HTTP request and inspect the response.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
              <Field>
                <FieldLabel>{{ t('tools.api-client.methodLabel', 'Method') }}</FieldLabel>
                <FieldContent>
                  <Select v-model="method">
                    <SelectTrigger data-testid="method-select">
                      <SelectValue :placeholder="method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="m in methodOptions" :key="m" :value="m">
                        {{ m }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.api-client.urlLabel', 'URL') }}</FieldLabel>
                <FieldContent class="space-y-1">
                  <Input v-model="url" class="font-mono" data-testid="url-input" />
                  <p v-if="urlValidation.status === 'error'" class="text-xs text-destructive">
                    {{ urlValidation.message }}
                  </p>
                </FieldContent>
              </Field>
            </div>

            <div class="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
              <span class="text-sm font-medium">{{ t('tools.api-client.useProxy', 'Use proxy prefix') }}</span>
              <Switch v-model="useProxy" data-testid="use-proxy-switch" />
            </div>

            <Field v-if="useProxy">
              <FieldLabel>{{ t('tools.api-client.proxyPrefixLabel', 'Proxy prefix') }}</FieldLabel>
              <FieldContent>
                <Input v-model="proxyPrefix" class="font-mono" data-testid="proxy-prefix-input" />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{{ t('tools.api-client.headersLabel', 'Headers') }}</FieldLabel>
              <FieldContent class="space-y-1">
                <Textarea
                  v-model="headersText"
                  rows="5"
                  class="max-h-48 resize-y overflow-y-auto font-mono"
                  :placeholder="t('tools.api-client.headersPlaceholder', 'Accept: application/json')"
                  data-testid="headers-input"
                />
                <p v-if="headersValidation.status === 'error'" class="text-xs text-destructive">
                  {{ headersValidation.message }}
                </p>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{{ t('tools.api-client.bodyLabel', 'Body') }}</FieldLabel>
              <FieldContent>
                <Textarea
                  v-model="body"
                  rows="7"
                  class="max-h-64 resize-y overflow-y-auto font-mono"
                  :placeholder="t('tools.api-client.bodyPlaceholder')"
                  data-testid="body-input"
                />
              </FieldContent>
            </Field>

            <div>
              <Button :disabled="!canSend" data-testid="send-button" @click="onSend">
                <Send class="mr-2 h-4 w-4" />
                {{ isLoading ? t('tools.api-client.sending', 'Sending...') : t('tools.api-client.send', 'Send request') }}
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>

    <Alert
      v-if="requestError"
      variant="destructive"
      class="border-destructive/40 bg-destructive/10"
      data-testid="request-error"
    >
      <AlertTitle>{{ t('tools.api-client.requestFailedTitle', 'Request failed') }}</AlertTitle>
      <AlertDescription>{{ requestError }}</AlertDescription>
    </Alert>

    <Card v-if="response" class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle>{{ t('tools.api-client.responseTitle', 'Response') }}</CardTitle>
          <CardDescription>
            {{ t('tools.api-client.responseDescription', 'Inspect status, headers, and body returned by the API.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div class="rounded-lg border bg-muted/20 p-3">
            <p class="text-xs text-muted-foreground">
{{ t('tools.api-client.status', 'Status') }}
</p>
            <p class="font-medium">
{{ response.status }} {{ response.statusText }}
</p>
          </div>
          <div class="rounded-lg border bg-muted/20 p-3">
            <p class="text-xs text-muted-foreground">
{{ t('tools.api-client.duration', 'Duration') }}
</p>
            <p class="font-medium">
{{ response.durationMs }} ms
</p>
          </div>
          <div class="rounded-lg border bg-muted/20 p-3">
            <p class="text-xs text-muted-foreground">
{{ t('tools.api-client.finalUrl', 'Final URL') }}
</p>
            <p class="font-mono text-xs break-all">
{{ response.responseUrl }}
</p>
          </div>
        </div>

        <Field>
          <FieldLabel>{{ t('tools.api-client.responseHeaders', 'Response headers') }}</FieldLabel>
          <FieldContent>
            <TextareaCopyable
              :value="response.headers.map(h => `${h.key}: ${h.value}`).join('\n')"
              language="text"
              class="min-h-20"
              data-testid="response-headers"
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>{{ t('tools.api-client.responseBody', 'Response body') }}</FieldLabel>
          <FieldContent>
            <TextareaCopyable :value="response.body" language="json" class="min-h-20" data-testid="response-body" />
          </FieldContent>
        </Field>
      </CardContent>
    </Card>
  </div>
</template>
