<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { Network, Search, Server } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToolI18n } from '@/composable/useToolI18n';
import { useValidation } from '@/composable/validation';
import { cn } from '@/lib/utils';
import { tableCellClasses, tableContainerClasses, tableHeadClasses, tableHeaderClasses } from '@/utils/table';
import { isLikelyHostname, lookupDns } from './dns-lookup-parser.service';
import type { DnsLookupResult, DnsProvider, DnsRecordType } from './dns-lookup-parser.service';

const { t } = useToolI18n()

const hostname = ref('example.com')
const provider = useStorage<DnsProvider>('dns-lookup-parser:provider', 'google')
const recordType = useStorage<DnsRecordType>('dns-lookup-parser:record-type', 'A')

const isLoading = ref(false)
const result = ref<DnsLookupResult | null>(null)
const lookupError = ref('')

const providerOptions: Array<{ label: string, value: DnsProvider }> = [
  { label: 'Google DNS', value: 'google' },
  { label: 'Cloudflare DNS', value: 'cloudflare' },
]

const recordTypeOptions: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']

const hostnameValidation = useValidation({
  source: hostname,
  rules: computed(() => [
    {
      validator: (value: string) => !value.trim() || isLikelyHostname(value),
      message: t('tools.dns-lookup-parser.invalidHostname', 'Invalid hostname'),
    },
  ]),
})

async function onLookup() {
  lookupError.value = ''
  result.value = null

  if (!hostname.value.trim() || hostnameValidation.status === 'error') {
    return
  }

  isLoading.value = true
  try {
    result.value = await lookupDns({
      name: hostname.value.trim(),
      type: recordType.value,
      provider: provider.value,
    })
  }
  catch (error) {
    lookupError.value = error instanceof Error ? error.message : t('tools.dns-lookup-parser.lookupFailed', 'DNS lookup failed')
  }
  finally {
    isLoading.value = false
  }
}

function clearInput() {
  hostname.value = ''
  result.value = null
  lookupError.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Network class="h-5 w-5 text-primary" />
            {{ t('tools.dns-lookup-parser.cardInputTitle', 'DNS query input') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.dns-lookup-parser.cardInputDescription', 'Enter a hostname, choose record type and provider, then query DNS-over-HTTPS.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel>{{ t('tools.dns-lookup-parser.hostnameLabel', 'Hostname') }}</FieldLabel>
              <FieldContent class="space-y-2">
                <Input
                  v-model="hostname"
                  :placeholder="t('tools.dns-lookup-parser.hostnamePlaceholder', 'example.com')"
                  class="font-mono"
                  :aria-invalid="hostnameValidation.status === 'error'"
                  data-testid="hostname-input"
                />
                <Alert
                  v-if="hostnameValidation.status === 'error'"
                  variant="destructive"
                  class="border-destructive/40 bg-destructive/10"
                  data-testid="hostname-error"
                >
                  <AlertTitle class="text-sm">
{{ t('tools.dns-lookup-parser.invalidHostnameTitle', 'Invalid hostname') }}
</AlertTitle>
                  <AlertDescription class="text-xs">
{{ hostnameValidation.message }}
</AlertDescription>
                </Alert>
              </FieldContent>
            </Field>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{{ t('tools.dns-lookup-parser.recordTypeLabel', 'Record type') }}</FieldLabel>
                <FieldContent>
                  <Select v-model="recordType">
                    <SelectTrigger data-testid="record-type-select">
                      <SelectValue :placeholder="recordType" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="type in recordTypeOptions" :key="type" :value="type">
                        {{ type }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{{ t('tools.dns-lookup-parser.providerLabel', 'DNS provider') }}</FieldLabel>
                <FieldContent>
                  <Select v-model="provider">
                    <SelectTrigger data-testid="provider-select">
                      <SelectValue :placeholder="provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="item in providerOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button size="sm" :disabled="isLoading || hostnameValidation.status === 'error' || !hostname.trim()" @click="onLookup">
                <Search class="mr-2 h-4 w-4" />
                {{ isLoading ? t('tools.dns-lookup-parser.lookuping', 'Looking up...') : t('tools.dns-lookup-parser.lookup', 'Lookup') }}
              </Button>
              <Button size="sm" variant="ghost" :disabled="!hostname" @click="clearInput">
                {{ t('common.clear', 'Clear') }}
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>

    <Alert
      v-if="lookupError"
      variant="destructive"
      class="border-destructive/40 bg-destructive/10"
      data-testid="lookup-error"
    >
      <AlertTitle class="text-sm">
{{ t('tools.dns-lookup-parser.lookupFailedTitle', 'Lookup failed') }}
</AlertTitle>
      <AlertDescription class="text-xs">
{{ lookupError }}
</AlertDescription>
    </Alert>

    <Card v-if="result" class="gap-2">
      <CardHeader>
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Server class="h-5 w-5 text-primary" />
            {{ t('tools.dns-lookup-parser.cardResultsTitle', 'DNS answer') }}
          </CardTitle>
          <CardDescription>
            {{ t('tools.dns-lookup-parser.cardResultsDescription', 'Parsed records from the DNS-over-HTTPS response.') }}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table :container-class="tableContainerClasses">
            <TableHeader :class="tableHeaderClasses">
              <TableRow>
                <TableHead :class="cn(tableHeadClasses)">
{{ t('tools.dns-lookup-parser.name', 'Name') }}
</TableHead>
                <TableHead :class="tableHeadClasses">
{{ t('tools.dns-lookup-parser.type', 'Type') }}
</TableHead>
                <TableHead :class="tableHeadClasses">
TTL
</TableHead>
                <TableHead :class="tableHeadClasses">
{{ t('tools.dns-lookup-parser.value', 'Value') }}
</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="result.answers.length === 0">
                <TableCell :class="cn(tableCellClasses, 'text-muted-foreground italic')" colspan="4">
                  {{ t('tools.dns-lookup-parser.noRecords', 'No records found for this query.') }}
                </TableCell>
              </TableRow>
              <TableRow v-for="(answer, index) in result.answers" :key="`${answer.name}-${answer.type}-${index}`">
                <TableCell :class="cn(tableCellClasses, 'font-mono text-xs')">
{{ answer.name }}
</TableCell>
                <TableCell :class="tableCellClasses">
{{ answer.typeName }}
</TableCell>
                <TableCell :class="tableCellClasses">
{{ answer.ttl }}
</TableCell>
                <TableCell :class="cn(tableCellClasses, 'font-mono text-xs break-all')">
{{ answer.data }}
</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <p v-if="result.comment" class="mt-4 text-xs text-muted-foreground">
          {{ result.comment }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
