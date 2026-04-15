interface ApiClientRequest {
  method: string
  url: string
  headersText: string
  body: string
  proxyPrefix: string
}

interface ApiClientResponse {
  status: number
  statusText: string
  durationMs: number
  responseUrl: string
  headers: Array<{ key: string, value: string }>
  body: string
}

function parseHeaders(headersText: string): Headers {
  const headers = new Headers()

  for (const rawLine of headersText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex <= 0) {
      throw new Error('Invalid header line format')
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (!key) {
      throw new Error('Header name is required')
    }

    headers.append(key, value)
  }

  return headers
}

function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  }
  catch {
    return text
  }
}

function buildFinalUrl(url: string, proxyPrefix: string): string {
  const trimmedUrl = url.trim()
  if (!proxyPrefix.trim()) {
    return trimmedUrl
  }

  return `${proxyPrefix.trim()}${encodeURIComponent(trimmedUrl)}`
}

async function sendApiRequest(request: ApiClientRequest): Promise<ApiClientResponse> {
  const headers = parseHeaders(request.headersText)
  const method = request.method.toUpperCase()
  const finalUrl = buildFinalUrl(request.url, request.proxyPrefix)

  const hasBody = !['GET', 'HEAD'].includes(method)
  const body = hasBody && request.body.trim().length > 0 ? request.body : undefined

  const startedAt = performance.now()
  const response = await fetch(finalUrl, {
    method,
    headers,
    body,
  })

  const endedAt = performance.now()
  const rawBody = await response.text()

  const responseHeaders = [...response.headers.entries()]
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key))

  return {
    status: response.status,
    statusText: response.statusText,
    durationMs: Math.round(endedAt - startedAt),
    responseUrl: response.url,
    headers: responseHeaders,
    body: tryFormatJson(rawBody),
  }
}

export { parseHeaders, sendApiRequest }
export type { ApiClientRequest, ApiClientResponse }
