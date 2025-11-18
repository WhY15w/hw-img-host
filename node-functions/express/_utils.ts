/**
 * 上传文件到 cnb.cool 仓库
 * @param {Object} options - 上传配置对象
 * @param {Buffer} options.fileBuffer - 文件二进制数据
 * @param {string} options.fileName - 文件名
 * @param {string} [options.slug=process.env.SLUG_IMG] - 仓库路径（默认读环境变量）
 * @param {string} [options.type="imgs"] - 上传类型（控制URL的`-/upload/`后部分，默认"imgs"）
 * @returns {Promise<{assets: object, url: string}>}
 */
async function uploadToCnb({ fileBuffer, fileName, type = 'imgs' }) {
  const fileSize = fileBuffer.length
  const metaUrl = `https://api.cnb.cool/${process.env.SLUG_IMG}/-/upload/${type}`

  const metaResp = await fetch(metaUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN_IMG}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: fileName, size: fileSize }),
  })

  if (!metaResp.ok) {
    throw new Error(`Failed to get upload URL: ${metaResp.status} ${metaResp.statusText}`)
  }

  const { assets, upload_url } = await metaResp.json()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const uploadResp = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: fileBuffer,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!uploadResp.ok) {
      throw new Error(`Failed to upload file: ${uploadResp.status} ${uploadResp.statusText}`)
    }

    return { assets, url: assets['path'] }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout after 30 seconds')
    }
    throw error
  }
}

export { uploadToCnb }
