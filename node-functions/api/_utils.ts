/**
 * 上传文件到 CNB 对象存储
 * @param {object} param0 - 上传参数
 * @param {Buffer} param0.fileBuffer - 文件的 Buffer
 * @param {string} param0.fileName - 文件名
 * @param {string} [param0.type='imgs'] - 上传类型，默认为 'imgs'
 * @returns 上传结果包含资源信息和URL
 */
async function uploadToCnb({
  fileBuffer,
  fileName,
  type = 'imgs',
}: {
  fileBuffer: Buffer
  fileName: string
  type?: string
}) {
  const fileSize = fileBuffer.length
  const metaUrl = `https://api.cnb.cool/${process.env.SLUG_IMG}/-/upload/${type}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s 超时

  try {
    const metaResp = await fetch(metaUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.TOKEN_IMG}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: fileName, size: fileSize }),
    })

    if (!metaResp.ok) {
      const errText = await metaResp.text().catch(() => '')
      throw new Error(`获取上传元数据失败: ${metaResp.status} ${metaResp.statusText} ${errText}`)
    }

    const { assets, upload_url } = await metaResp.json()

    const uploadResp = await fetch(upload_url, {
      method: 'PUT',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/octet-stream' },
      body: fileBuffer,
    })

    if (!uploadResp.ok) {
      const errText = await uploadResp.text().catch(() => '')
      throw new Error(`上传到存储失败: ${uploadResp.status} ${uploadResp.statusText} ${errText}`)
    }

    return { assets, url: assets['path'] }
  } finally {
    clearTimeout(timeoutId)
  }
}

export { uploadToCnb }
