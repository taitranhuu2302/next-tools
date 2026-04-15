<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { AlertTriangle, PenTool, ShieldCheck } from 'lucide-vue-next';
import { computed } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';
import { buildJwtHs256, parseJsonObject } from './jwt-signer-builder.service';

const { t } = useToolI18n()

const headerJson = useStorage('jwt-signer-builder:header-json', '{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
const payloadJson = useStorage('jwt-signer-builder:payload-json', '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}')
const secret = useStorage('jwt-signer-builder:secret', '')

const headerValidation = useValidation({
  source: headerJson,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => parseJsonObject(value)),
      message: t('tools.jwt-signer-builder.invalidHeader', 'Header must be a valid JSON object'),
    },
  ]),
})

const payloadValidation = useValidation({
  source: payloadJson,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isNotThrowing(() => parseJsonObject(value)),
      message: t('tools.jwt-signer-builder.invalidPayload', 'Payload must be a valid JSON object'),
    },
  ]),
})

const secretValidation = useValidation({
  source: secret,
  rules: computed(() => [
    {
      validator: (value: string) => value.trim().length > 0,
      message: t('tools.jwt-signer-builder.secretRequired', 'Secret is required'),
    },
  ]),
})

const signerResult = computed(() => {
  if (
    headerValidation.status === 'error'
    || payloadValidation.status === 'error'
    || secretValidation.status === 'error'
  ) {
    return null
  }

  if (!headerJson.value.trim() || !payloadJson.value.trim() || !secret.value.trim()) {
    return null
  }

  return withDefaultOnError(() => buildJwtHs256({
    headerJson: headerJson.value,
    payloadJson: payloadJson.value,
    secret: secret.value,
  }), null)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <Alert class="border-amber-500/40 bg-amber-500/10" data-testid="security-warning">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>{{ t('tools.jwt-signer-builder.warningTitle', 'Security warning') }}</AlertTitle>
      <AlertDescription>
        {{ t('tools.jwt-signer-builder.warningDescription', 'Use test secrets only. Do not paste production secrets in browser tools.') }}
      </AlertDescription>
    </Alert>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <PenTool class="h-5 w-5 text-primary" />
              {{ t('tools.jwt-signer-builder.cardInputTitle', 'JWT signing input') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.jwt-signer-builder.cardInputDescription', 'Provide header, payload, and secret to sign a JWT with HS256.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel>{{ t('tools.jwt-signer-builder.headerLabel', 'Header JSON') }}</FieldLabel>
                <FieldContent class="space-y-2">
                  <Textarea v-model="headerJson" rows="7" class="font-mono" data-testid="header-json" />
                  <p v-if="headerValidation.status === 'error'" class="text-xs text-destructive">
                    {{ headerValidation.message }}
                  </p>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.jwt-signer-builder.payloadLabel', 'Payload JSON') }}</FieldLabel>
                <FieldContent class="space-y-2">
                  <Textarea v-model="payloadJson" rows="9" class="font-mono" data-testid="payload-json" />
                  <p v-if="payloadValidation.status === 'error'" class="text-xs text-destructive">
                    {{ payloadValidation.message }}
                  </p>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.jwt-signer-builder.secretLabel', 'Secret key') }}</FieldLabel>
                <FieldContent class="space-y-2">
                  <Input v-model="secret" type="password" class="font-mono" data-testid="secret-input" />
                  <p v-if="secretValidation.status === 'error'" class="text-xs text-destructive">
                    {{ secretValidation.message }}
                  </p>
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card class="h-full gap-2">
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <ShieldCheck class="h-5 w-5 text-primary" />
              {{ t('tools.jwt-signer-builder.cardOutputTitle', 'Signed token output') }}
            </CardTitle>
            <CardDescription>
              {{ t('tools.jwt-signer-builder.cardOutputDescription', 'Copy the generated JWT and individual Base64URL segments.') }}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <Field>
            <FieldLabel>{{ t('tools.jwt-signer-builder.tokenLabel', 'JWT token') }}</FieldLabel>
            <FieldContent>
              <TextareaCopyable :value="signerResult?.token || ''" rows="7" class="font-mono" data-testid="jwt-token" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{{ t('tools.jwt-signer-builder.headerSegmentLabel', 'Header segment') }}</FieldLabel>
            <FieldContent>
              <TextareaCopyable :value="signerResult?.headerSegment || ''" rows="2" class="font-mono" data-testid="header-segment" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{{ t('tools.jwt-signer-builder.payloadSegmentLabel', 'Payload segment') }}</FieldLabel>
            <FieldContent>
              <TextareaCopyable :value="signerResult?.payloadSegment || ''" rows="3" class="font-mono" data-testid="payload-segment" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{{ t('tools.jwt-signer-builder.signatureSegmentLabel', 'Signature segment') }}</FieldLabel>
            <FieldContent>
              <TextareaCopyable :value="signerResult?.signatureSegment || ''" rows="2" class="font-mono" data-testid="signature-segment" />
            </FieldContent>
          </Field>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
