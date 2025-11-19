import express from 'express'
import { uploadToCnb, createProxyHandler } from './_utils'
import { reply } from './_reply'
import multer from 'multer'
const upload = multer()
const app = express()

const requestConfig = {
  responseType: 'arraybuffer',
  timeout: 5000,
  headers: {
    Accept: 'image/*, */*',
    'User-Agent': 'SeerImageProxy/1.0 (+https://seerinfo.yuyuqaq.cn)',
  },
}
const BASE_URL = 'https://cnb.cool/' + process.env.SLUG_IMG + '/-/imgs/'

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express on Node Functions!' })
})

app.get('/img/*path', createProxyHandler(BASE_URL, requestConfig))

app.post(
  '/upload/img',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      if (!files || !files.file) {
        return res.status(400).json(reply(1, '未上传文件', ''))
      }

      const mainFile = files.file?.[0]
      const thumbnailFile = files.thumbnail?.[0]

      // 上传主图
      const mainResult = await uploadToCnb({
        fileBuffer: mainFile.buffer,
        fileName: mainFile.originalname,
      })

      const baseUrl = process.env.BASE_IMG_URL

      const mainImgPath = extractImagePath(mainResult.url)
      const mainUrl = baseUrl + mainImgPath

      let thumbnailUrl = null
      let thumbnailAssets = null

      // 上传缩略图
      if (thumbnailFile) {
        const thumbnailResult = await uploadToCnb({
          fileBuffer: thumbnailFile.buffer,
          fileName: thumbnailFile.originalname,
        })

        const thumbnailImgPath = extractImagePath(thumbnailResult.url)
        thumbnailUrl = baseUrl + thumbnailImgPath
        thumbnailAssets = thumbnailResult.assets
      }

      res.json(
        reply(0, '上传成功', {
          url: mainUrl,
          thumbnailUrl: thumbnailUrl,
          assets: mainResult.assets,
          thumbnailAssets: thumbnailAssets,
          hasThumbnail: !!thumbnailFile,
        }),
      )
    } catch (err) {
      console.error('上传失败:', err.response?.data || err.message)
      res.status(500).json(reply(1, '上传失败', err.message))
    }
  },
)

/**
 * 从 URL 中提取图片路径
 * @param {string} url - 完整的 URL
 * @returns {string} - 提取的图片路径
 */
function extractImagePath(url) {
  if (url.includes('-/imgs/')) {
    return url.split('-/imgs/')[1]
  } else if (url.includes('-/files/')) {
    return url.split('-/files/')[1]
  }
  return url
}

export default app
