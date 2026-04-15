interface DnsAnswer {
  name: string
  type: number
  typeName: string
  ttl: number
  data: string
}

interface DnsLookupResult {
  status: number
  answers: DnsAnswer[]
  comment?: string
}

type DnsProvider = 'google' | 'cloudflare'

type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS'

const RECORD_TYPE_CODE: Record<DnsRecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  MX: 15,
  TXT: 16,
  AAAA: 28,
}

const CODE_TO_TYPE_NAME: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
}

function getEndpoint(provider: DnsProvider, name: string, type: DnsRecordType): { url: string, headers?: HeadersInit } {
  const code = RECORD_TYPE_CODE[type]

  if (provider === 'cloudflare') {
    return {
      url: `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${code}`,
      headers: {
        accept: 'application/dns-json',
      },
    }
  }

  return {
    url: `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${code}`,
  }
}

function normalizeAnswers(rawAnswers: Array<Record<string, unknown>> | undefined): DnsAnswer[] {
  if (!rawAnswers || !Array.isArray(rawAnswers)) {
    return []
  }

  return rawAnswers
    .filter(item => typeof item === 'object' && item !== null)
    .map((item) => {
      const type = Number(item.type ?? 0)
      return {
        name: String(item.name ?? ''),
        type,
        typeName: CODE_TO_TYPE_NAME[type] || String(type),
        ttl: Number(item.TTL ?? 0),
        data: String(item.data ?? ''),
      }
    })
}

async function lookupDns({ name, type, provider }: { name: string, type: DnsRecordType, provider: DnsProvider }): Promise<DnsLookupResult> {
  const endpoint = getEndpoint(provider, name, type)
  const response = await fetch(endpoint.url, {
    method: 'GET',
    headers: endpoint.headers,
  })

  if (!response.ok) {
    throw new Error(`DNS lookup failed with status ${response.status}`)
  }

  const payload = await response.json() as {
    Status?: number
    Answer?: Array<Record<string, unknown>>
    Comment?: string
  }

  return {
    status: Number(payload.Status ?? 0),
    answers: normalizeAnswers(payload.Answer),
    comment: payload.Comment,
  }
}

function isLikelyHostname(value: string): boolean {
  const input = value.trim()
  if (!input) {
    return false
  }

  // Basic hostname validation for a simple DNS lookup UI.
  const hostnameRegex = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i
  const localhostRegex = /^localhost$/i
  return hostnameRegex.test(input) || localhostRegex.test(input)
}

export { isLikelyHostname, lookupDns }
export type { DnsLookupResult, DnsProvider, DnsRecordType }
