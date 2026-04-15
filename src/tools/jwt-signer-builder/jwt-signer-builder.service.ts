import { HmacSHA256, enc } from 'crypto-js'

interface JwtSignerInput {
  headerJson: string
  payloadJson: string
  secret: string
}

interface JwtSignerOutput {
  token: string
  headerSegment: string
  payloadSegment: string
  signatureSegment: string
}

function parseJsonObject(input: string): Record<string, unknown> {
  const parsed = JSON.parse(input) as unknown

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON must be an object')
  }

  return parsed as Record<string, unknown>
}

function toBase64UrlJson(value: Record<string, unknown>): string {
  const json = JSON.stringify(value)
  return enc.Utf8.parse(json).toString(enc.Base64url)
}

function buildJwtHs256({ headerJson, payloadJson, secret }: JwtSignerInput): JwtSignerOutput {
  if (!secret) {
    throw new Error('Secret is required')
  }

  const headerObject = parseJsonObject(headerJson)
  const payloadObject = parseJsonObject(payloadJson)

  const normalizedHeader: Record<string, unknown> = {
    ...headerObject,
    alg: 'HS256',
    typ: headerObject.typ ?? 'JWT',
  }

  const headerSegment = toBase64UrlJson(normalizedHeader)
  const payloadSegment = toBase64UrlJson(payloadObject)
  const signingInput = `${headerSegment}.${payloadSegment}`
  const signatureSegment = HmacSHA256(signingInput, secret).toString(enc.Base64url)

  return {
    token: `${signingInput}.${signatureSegment}`,
    headerSegment,
    payloadSegment,
    signatureSegment,
  }
}

export { buildJwtHs256, parseJsonObject }
export type { JwtSignerInput, JwtSignerOutput }
