function getErrorDetail(err: unknown): string | undefined {
  const data = (err as { response?: { data?: unknown } }).response?.data
  if (typeof data === 'string') return data
  if (Buffer.isBuffer(data)) return data.toString('utf8')
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8')
  return undefined
}

function extractImagePath(rawPath: string): string {
  const path = String(rawPath).split(/[?#]/)[0]
  const match = path.match(/-\/(?:imgs|files)\/(.+)/)
  return match ? match[1] : path
}

function buildImageUrl(baseUrl: string, rawPath: string): string {
  return baseUrl + 'img-api/' + extractImagePath(rawPath)
}

async function requestUploadMeta(
  fileName: string,
  fileSize: number,
  type: string,
  signal?: AbortSignal,
) {
  const metaUrl = `https://api.cnb.cool/${process.env.SLUG_IMG}/-/upload/${type}`
  const resp = await fetch(metaUrl, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${process.env.TOKEN_IMG}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: fileName, size: fileSize }),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`获取上传元数据失败: ${resp.status} ${resp.statusText} ${errText}`)
  }

  return (await resp.json()) as { assets: Record<string, unknown>; upload_url: string }
}

function requestTimeout(ms = 30000): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) }
}

async function uploadToCnb({
  fileBuffer,
  fileName,
  type = 'imgs',
}: {
  fileBuffer: Buffer
  fileName: string
  type?: string
}) {
  const timeout = requestTimeout(30000)

  try {
    const { assets, upload_url } = await requestUploadMeta(
      fileName,
      fileBuffer.length,
      type,
      timeout.signal,
    )

    const uploadResp = await fetch(upload_url, {
      method: 'PUT',
      signal: timeout.signal,
      headers: { 'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(fileBuffer),
    })

    if (!uploadResp.ok) {
      const errText = await uploadResp.text().catch(() => '')
      throw new Error(`上传到存储失败: ${uploadResp.status} ${uploadResp.statusText} ${errText}`)
    }

    return { assets, url: assets['path'] }
  } finally {
    timeout.clear()
  }
}

export { uploadToCnb, getErrorDetail, extractImagePath, buildImageUrl }
