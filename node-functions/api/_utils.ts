import axios from 'axios'

async function uploadToCnb({ fileBuffer, fileName, type = 'imgs' }) {
  const fileSize = fileBuffer.length
  const metaUrl = `https://api.cnb.cool/${process.env.SLUG_IMG}/-/upload/${type}`

  const metaResp = await axios.post(
    metaUrl,
    { name: fileName, size: fileSize },
    {
      headers: {
        Authorization: `Bearer ${process.env.TOKEN_IMG}`,
        'Content-Type': 'application/json',
      },
    },
  )

  const { assets, upload_url } = metaResp.data

  const uploadResp = await axios.put(upload_url, fileBuffer, {
    headers: { 'Content-Type': 'application/octet-stream' },
    timeout: 30000,
  })

  if (metaResp.status !== 200 || uploadResp.status !== 200) {
    throw new Error('Failed to upload image')
  }

  return { assets, url: assets['path'] }
}

export { uploadToCnb }
