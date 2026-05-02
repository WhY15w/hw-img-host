import express from 'express'
import { uploadToCnb, signUpload } from './_utils'
import { reply } from './_reply'
import multer from 'multer'

const upload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024, // 单文件最大 20MB
    fieldSize: 20 * 1024 * 1024, // 表单字段最大 20MB
  },
})
const app = express()

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.get('/upload/sign', async (req, res) => {
  try {
    const fileName = req.query.name as string
    const fileSize = parseInt(req.query.size as string, 10)
    if (!fileName || !fileSize) {
      return res.status(400).json(reply(1, '缺少 name 或 size 参数'))
    }
    const result = await signUpload({ fileName, fileSize })
    res.json(reply(0, 'ok', result))
  } catch (e: unknown) {
    res.status(500).json(reply(1, '获取上传签名失败', { message: (e as Error).message }))
  }
})

app.post(
  '/upload/img',
  (req, res, next) => {
    upload.fields([
      { name: 'file', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        const status = err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FIELD_SIZE' ? 413 : 400
        return res.status(status).json(reply(1, `文件超出限制: ${err.message}`, ''))
      }
      next()
    })
  },
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
      const mainUrl = baseUrl + 'img-api/' + mainImgPath

      let thumbnailUrl = null
      let thumbnailAssets = null

      // 上传缩略图
      if (thumbnailFile) {
        const thumbnailResult = await uploadToCnb({
          fileBuffer: thumbnailFile.buffer,
          fileName: thumbnailFile.originalname,
        })

        const thumbnailImgPath = extractImagePath(thumbnailResult.url)
        thumbnailUrl = baseUrl + 'img-api/' + thumbnailImgPath
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
    } catch (err: unknown) {
      const msg = (err as Error).message || '未知错误'
      let detail = ''
      const responseData = (err as { response?: { data?: unknown } }).response?.data
      if (responseData && typeof responseData === 'string') {
        detail = responseData
      } else if (responseData && Buffer.isBuffer(responseData)) {
        detail = responseData.toString('utf8')
      } else if (responseData instanceof ArrayBuffer) {
        detail = Buffer.from(responseData).toString('utf8')
      }
      console.error('上传失败:', msg, detail)
      res.status(500).json(
        reply(1, '上传失败', {
          message: msg,
          detail: detail || undefined,
        }),
      )
    }
  },
)

/**
 * 从 URL 中提取图片路径
 * @param {string} url - 完整的 URL
 * @returns {string} - 提取的图片路径
 */
function extractImagePath(url: string): string {
  if (url.includes('-/imgs/')) {
    return url.split('-/imgs/')[1]
  } else if (url.includes('-/files/')) {
    return url.split('-/files/')[1]
  }
  return url
}

export default app
