import { toJavaScriptWarn } from 'curlconverter'

interface CurlToFetchResult {
  code: string
  warnings: Array<[string, string]>
}

function convertCurlToFetch(curlCommand: string): CurlToFetchResult {
  const [code, warnings] = toJavaScriptWarn(curlCommand)

  return {
    code,
    warnings,
  }
}

export { convertCurlToFetch }
export type { CurlToFetchResult }
