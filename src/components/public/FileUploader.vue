<template>
  <div class="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm transition">
    <label
      class="mb-2 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center text-sm transition"
      :class="[
        isDragging
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:bg-blue-50',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input type="file" accept="image/*" @change="onFileChange" class="hidden" />
      <span v-if="!file">
        {{ isDragging ? '释放文件上传' : '点击或拖拽上传图片' }}
      </span>
      <div v-else-if="processing" class="flex items-center gap-2 text-blue-600">
        <LoaderIcon class="h-5 w-5 animate-spin text-gray-400" />
        <span>图片处理中...</span>
      </div>
      <div v-else class="flex w-full items-center justify-center font-medium text-blue-600">
        <span class="max-w-[90%] truncate" :title="file?.name">
          {{ file?.name }}
        </span>
        <XCircle
          class="ml-2 inline h-4 w-4 cursor-pointer text-red-400 transition hover:text-red-500"
          @click.stop="handleFile(null)"
        />
      </div>
    </label>

    <!-- 原图信息 -->
    <div v-if="file" class="mb-3 rounded-lg border border-gray-200 p-3">
      <p class="mb-2 text-xs text-gray-500">原图信息:</p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600">
        <p>
          大小:
          <span class="font-medium text-gray-800"> {{ (file.size / 1024).toFixed(2) }} KB </span>
        </p>
        <p>
          格式:
          <span class="font-medium text-gray-800">
            {{ file.type || '未知' }}
          </span>
        </p>
        <p>
          压缩率:
          <span class="font-medium text-gray-800"> {{ compressionRatio.toFixed(2) }}% </span>
        </p>
        <p>
          尺寸:
          <span class="font-medium text-gray-800"> {{ imageWidth }}x{{ imageHeight }} </span>
        </p>
      </div>
    </div>

    <!-- 缩略图预览 -->
    <div
      v-if="file && generateThumbnail && thumbnailPreview"
      class="mb-3 rounded-lg border border-gray-200 p-3"
    >
      <p class="mb-2 text-xs text-gray-500">缩略图预览:</p>
      <div class="flex items-center gap-3">
        <img :src="thumbnailPreview" alt="缩略图" class="h-20 w-20 rounded border object-cover" />
        <div class="flex gap-4 text-xs text-gray-600">
          <p>
            尺寸:
            <span class="font-medium"> {{ thumbnailWidth }}x{{ thumbnailHeight }} </span>
          </p>
          <p>
            大小:
            <span class="font-medium"> {{ (thumbnailSize / 1024).toFixed(2) }} KB </span>
          </p>
        </div>
      </div>
    </div>

    <Button
      class="w-full rounded-xl bg-blue-500 text-white transition hover:bg-blue-600"
      :disabled="!file || uploading"
      @click="uploadFile"
    >
      {{ uploading ? '上传中...' : '开始上传' }}
    </Button>

    <div v-if="uploading" class="mt-4">
      <Progress :model-value="uploadProgress" class="h-2 rounded-full" />
      <p class="mt-2 text-center text-sm text-gray-600">{{ uploadProgress }}%</p>
    </div>

    <div v-if="uploadedUrl" class="mt-4 flex items-center justify-center text-center">
      <div class="flex items-center text-sm text-green-600">
        <CheckCircle2 class="mr-0.5 h-4 w-4" />
        <span>上传成功！</span>
      </div>
      <a :href="uploadedUrl" target="_blank" class="ml-2 text-sm text-blue-500 hover:underline">
        查看图片
      </a>
    </div>

    <p v-if="errorMsg" class="mt-4 text-center text-sm text-red-500">
      {{ errorMsg }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import axios, { type AxiosProgressEvent } from 'axios'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'vue-sonner'
import { CheckCircle2, XCircle, LoaderIcon } from 'lucide-vue-next'

interface Props {
  password?: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
  generateThumbnail?: boolean
  thumbnailMaxWidth?: number
  thumbnailMaxHeight?: number
  thumbnailQuality?: number
}

interface UploadInfo {
  url: string
  urlOriginal?: string
  thumbnailUrl?: string
  thumbnailOriginalUrl?: string
  name: string
  size: number
  type: string
  compressionRatio: number
  width: number
  height: number
  hasThumbnail: boolean
  thumbnailWidth: number
  thumbnailHeight: number
  thumbnailSize: number
}

interface CompressResult {
  compressedFile: File
  width: number
  height: number
}

interface ThumbnailResult {
  thumbnailFile: File
  previewUrl: string
  width: number
  height: number
  size: number
}

interface SignResponse {
  code: number
  msg?: string
  data: {
    assets: { path: string }
    upload_url: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  password: undefined,
  maxWidth: 0,
  maxHeight: 0,
  quality: 0.7,
  generateThumbnail: false,
  thumbnailMaxWidth: 200,
  thumbnailMaxHeight: 200,
  thumbnailQuality: 0.9,
})

const emit = defineEmits<{
  'update:uploadInfo': [uploadInfo: UploadInfo]
}>()

const file = ref<File | null>(null)
const originalFile = ref<File | null>(null)
const thumbnailFile = ref<File | null>(null)
const thumbnailPreview = ref<string>('')
const thumbnailWidth = ref<number>(0)
const thumbnailHeight = ref<number>(0)
const thumbnailSize = ref<number>(0)
const uploadProgress = ref<number>(0)
const uploading = ref<boolean>(false)
const processing = ref<boolean>(false)
const uploadedUrl = ref<string>('')
const uploadedThumbnailUrl = ref<string>('')
const errorMsg = ref<string>('')
const isDragging = ref<boolean>(false)
const compressionRatio = ref<number>(0)
const imageWidth = ref<number>(0)
const imageHeight = ref<number>(0)

let qualityDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => props.quality,
  () => {
    if (qualityDebounceTimer) clearTimeout(qualityDebounceTimer)
    qualityDebounceTimer = setTimeout(() => {
      if (originalFile.value && !processing.value && !uploading.value) {
        handleFile(originalFile.value)
      }
    }, 300)
  },
)

watch(
  () => props.generateThumbnail,
  (newVal) => {
    if (!newVal) {
      thumbnailFile.value = null
      thumbnailPreview.value = ''
      thumbnailWidth.value = 0
      thumbnailHeight.value = 0
      thumbnailSize.value = 0
    } else if (file.value && !processing.value) {
      generateThumbnailImage(file.value).then((t) => {
        thumbnailFile.value = t.thumbnailFile
        thumbnailPreview.value = t.previewUrl
        thumbnailWidth.value = t.width
        thumbnailHeight.value = t.height
        thumbnailSize.value = t.size
      })
    }
  },
)

onUnmounted(() => {
  if (qualityDebounceTimer) clearTimeout(qualityDebounceTimer)
})

async function compressImageToWebp(
  file: File,
  quality: number = 0.7,
  maxWidth: number = 0,
  maxHeight: number = 0,
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = async () => {
        let width = img.width
        let height = img.height

        if (maxWidth > 0 || maxHeight > 0) {
          if (maxWidth > 0 && maxHeight > 0) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            if (ratio < 1) {
              width = Math.round(width * ratio)
              height = Math.round(height * ratio)
            }
          } else if (maxWidth > 0 && width > maxWidth) {
            const ratio = maxWidth / width
            width = maxWidth
            height = Math.round(height * ratio)
          } else if (maxHeight > 0 && height > maxHeight) {
            const ratio = maxHeight / height
            height = maxHeight
            width = Math.round(width * ratio)
          }
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法获取 canvas context'))
          return
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // 根据像素数自适应质量，确保 body 不超过 3MB
        const pixelCount = width * height
        let effectiveQuality = quality
        if (pixelCount > 4_000_000) {
          effectiveQuality = Math.min(quality, 0.6)
        } else if (pixelCount > 2_000_000) {
          effectiveQuality = Math.min(quality, 0.65)
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('WebP 转换失败'))
              return
            }
            // 如果 body 超过 3MB 且还有降质空间，再降一档
            if (blob.size > 3 * 1024 * 1024 && effectiveQuality > 0.3) {
              canvas.toBlob(
                (retryBlob) => {
                  if (!retryBlob) {
                    reject(new Error('WebP 转换失败'))
                    return
                  }
                  const compressedFile = new File(
                    [retryBlob],
                    file.name.replace(/\.\w+$/, '.webp'),
                    { type: 'image/webp' },
                  )
                  resolve({ compressedFile, width, height })
                },
                'image/webp',
                0.3,
              )
              return
            }
            const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
              type: 'image/webp',
            })
            resolve({ compressedFile, width, height })
          },
          'image/webp',
          effectiveQuality,
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
  })
}
async function generateThumbnailImage(file: File): Promise<ThumbnailResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法获取 canvas context'))
          return
        }

        // 计算缩略图尺寸，保持宽高比
        let width = img.width
        let height = img.height
        const maxWidth = props.thumbnailMaxWidth
        const maxHeight = props.thumbnailMaxHeight

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailFile = new File([blob], file.name.replace(/\.\w+$/, '_thumb.webp'), {
                type: 'image/webp',
              })
              // 生成预览 URL
              const previewUrl = URL.createObjectURL(blob)
              resolve({
                thumbnailFile,
                previewUrl,
                width,
                height,
                size: blob.size,
              })
            } else {
              reject(new Error('缩略图生成失败'))
            }
          },
          'image/webp',
          props.thumbnailQuality,
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
  })
}

function extractImagePath(url: string): string {
  if (url.includes('-/imgs/')) {
    return url.split('-/imgs/')[1] || url
  } else if (url.includes('-/files/')) {
    return url.split('-/files/')[1] || url
  }
  return url
}

function onFileChange(e: Event): void {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (f) {
    handleFile(f)
  }
}

function onDrop(e: DragEvent): void {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) {
    handleFile(f)
  }
}

async function handleFile(f: File | null): Promise<void> {
  if (!f) {
    file.value = null
    originalFile.value = null
    thumbnailFile.value = null
    thumbnailPreview.value = ''
    return
  }

  processing.value = true

  try {
    if (f.size > 20 * 1024 * 1024) {
      errorMsg.value = '图片大小不能超过 20MB'
      return
    }
    originalFile.value = f
    const { compressedFile, width, height } = await compressImageToWebp(
      f,
      props.quality,
      props.maxWidth,
      props.maxHeight,
    )
    compressionRatio.value = ((f.size - compressedFile.size) / f.size) * 100
    file.value = compressedFile
    imageWidth.value = width
    imageHeight.value = height

    // 如果需要生成缩略图
    if (props.generateThumbnail) {
      const thumbnail = await generateThumbnailImage(compressedFile)
      thumbnailFile.value = thumbnail.thumbnailFile
      thumbnailPreview.value = thumbnail.previewUrl
      thumbnailWidth.value = thumbnail.width
      thumbnailHeight.value = thumbnail.height
      thumbnailSize.value = thumbnail.size
    }

    errorMsg.value = ''
    uploadedUrl.value = ''
    uploadedThumbnailUrl.value = ''
  } catch (err) {
    console.error('压缩失败:', err)
    errorMsg.value = '图片处理失败'
  } finally {
    processing.value = false
  }
}

async function uploadFile(): Promise<void> {
  if (!file.value) {
    errorMsg.value = '请先选择文件'
    return
  }
  try {
    uploading.value = true
    uploadProgress.value = 0

    const signRes = await axios.get<SignResponse>('/api/upload/sign', {
      params: {
        name: file.value.name,
        size: file.value.size,
        ...(props.password ? { password: props.password } : {}),
      },
    })
    if (signRes.data.code !== 0) {
      throw new Error(signRes.data.msg || '获取上传签名失败')
    }

    const { assets, upload_url: uploadUrl } = signRes.data.data

    await axios.put(uploadUrl, file.value, {
      headers: { 'Content-Type': 'application/octet-stream' },
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      },
      timeout: 30000,
    })

    const proxyUrl = window.location.origin + '/img-api/' + extractImagePath(assets.path)
    const originUrl = 'https://cnb.cool' + assets.path

    uploadedUrl.value = proxyUrl

    let thumbProxyUrl: string | undefined
    let thumbOriginUrl: string | undefined

    if (thumbnailFile.value) {
      uploadProgress.value = 0

      const thumbSignRes = await axios.get<SignResponse>('/api/upload/sign', {
        params: {
          name: thumbnailFile.value.name,
          size: thumbnailFile.value.size,
          ...(props.password ? { password: props.password } : {}),
        },
      })
      if (thumbSignRes.data.code !== 0) {
        throw new Error(thumbSignRes.data.msg || '获取缩略图上传签名失败')
      }

      await axios.put(thumbSignRes.data.data.upload_url, thumbnailFile.value, {
        headers: { 'Content-Type': 'application/octet-stream' },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.total) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        },
        timeout: 30000,
      })

      thumbProxyUrl =
        window.location.origin + '/img-api/' + extractImagePath(thumbSignRes.data.data.assets.path)
      thumbOriginUrl = 'https://cnb.cool' + thumbSignRes.data.data.assets.path
      uploadedThumbnailUrl.value = thumbProxyUrl
    }

    const uploadInfo: UploadInfo = {
      url: proxyUrl,
      urlOriginal: originUrl,
      thumbnailUrl: thumbProxyUrl,
      thumbnailOriginalUrl: thumbOriginUrl,
      name: file.value.name,
      size: file.value.size,
      type: file.value.type,
      compressionRatio: compressionRatio.value,
      width: imageWidth.value,
      height: imageHeight.value,
      hasThumbnail: props.generateThumbnail,
      thumbnailWidth: thumbnailWidth.value,
      thumbnailHeight: thumbnailHeight.value,
      thumbnailSize: thumbnailSize.value,
    }
    emit('update:uploadInfo', uploadInfo)

    toast.success('上传成功')
  } catch (err) {
    console.error(err)
    const error = err as {
      response?: {
        data?: { code?: number; msg?: string; data?: { message?: string; detail?: string } }
      }
      message?: string
    }
    const serverMsg = error.response?.data?.msg
    const serverDetail = error.response?.data?.data?.detail
    const serverInnerMsg = error.response?.data?.data?.message
    errorMsg.value = serverMsg || serverInnerMsg || serverDetail || error.message || '上传失败'
    toast.error(errorMsg.value)
  } finally {
    uploading.value = false
  }
}
</script>
