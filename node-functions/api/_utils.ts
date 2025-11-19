/**
 * 上传文件到 CNB 对象存储
 * @param {object} param0 - 上传参数
 * @param {Buffer} param0.fileBuffer - 文件的 Buffer
 * @param {string} param0.fileName - 文件名
 * @param {string} [param0.type='imgs'] - 上传类型，默认为 'imgs'
 * @returns 上传结果包含资源信息和URL
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
    throw new Error('Failed to get upload metadata')
  }

  const { assets, upload_url } = await metaResp.json()

  const uploadResp = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: fileBuffer,
  })

  if (!uploadResp.ok) {
    throw new Error('Failed to upload image')
  }

  return { assets, url: assets['path'] }
}

/**
 * 创建代理处理函数
 * @param {string} baseUrl 基础URL
 * @param {object} requestConfig 请求配置
 * @returns 路由处理函数
 */
function createProxyHandler(baseUrl, requestConfig) {
  return async (req, res) => {
    try {
      const urlPath = Array.isArray(req.params.path) ? req.params.path.join('/') : req.params.path

      if (!urlPath || urlPath.includes('..')) {
        return res.status(400).json({ error: 'Invalid image path' })
      }

      const targetUrl = new URL(urlPath, baseUrl).toString()

      const fetchOptions = {
        method: 'GET',
        headers: requestConfig?.headers || {},
        signal: requestConfig?.timeout ? AbortSignal.timeout(requestConfig.timeout) : undefined,
      }

      const response = await fetch(targetUrl, fetchOptions)

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/png'
        const arrayBuffer = await response.arrayBuffer()

        res.setHeader('Content-Type', contentType)
        res.send(Buffer.from(arrayBuffer))
      } else {
        res.status(response.status).json({
          error: `Upstream error: ${response.statusText}`,
        })
      }
    } catch (e) {
      console.error(`❌ [Proxy Error] ${e.message}`)
      if (e.name === 'TimeoutError' || e.name === 'AbortError') {
        return res.status(504).json({ error: 'Upstream request timed out' })
      }
      if (e instanceof TypeError && e.message.includes('fetch')) {
        return res.status(502).json({ error: 'Failed to fetch from upstream' })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

export { uploadToCnb, createProxyHandler }
