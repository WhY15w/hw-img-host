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
import { ref } from 'vue'
import axios, { type AxiosProgressEvent } from 'axios'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'vue-sonner'
import { CheckCircle2, XCircle, LoaderIcon } from 'lucide-vue-next'

interface Props {
  belongTo?: string
  // 原图配置
  maxWidth?: number // 0 表示不限制，保持原始尺寸
  maxHeight?: number // 0 表示不限制，保持原始尺寸
  quality?: number // 原图压缩质量
  // 缩略图配置
  generateThumbnail?: boolean // 是否生成缩略图
  thumbnailMaxWidth?: number // 缩略图最大宽度
  thumbnailMaxHeight?: number // 缩略图最大高度
  thumbnailQuality?: number // 缩略图质量
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

interface UploadResponse {
  code: number
  msg?: string
  data: {
    url: string
    thumbnailUrl?: string
    assets?: {
      path: string
    }
    thumbnailAssets?: {
      path: string
    }
  }
}

const props = withDefaults(defineProps<Props>(), {
  belongTo: 'mindmap',
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
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法获取 canvas context'))
          return
        }

        let width = img.width
        let height = img.height

        if (maxWidth > 0 || maxHeight > 0) {
          if (maxWidth > 0 && maxHeight > 0) {
            // 同时限制宽高
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            if (ratio < 1) {
              width = Math.round(width * ratio)
              height = Math.round(height * ratio)
            }
          } else if (maxWidth > 0 && width > maxWidth) {
            // 仅限制宽度
            const ratio = maxWidth / width
            width = maxWidth
            height = Math.round(height * ratio)
          } else if (maxHeight > 0 && height > maxHeight) {
            // 仅限制高度
            const ratio = maxHeight / height
            height = maxHeight
            width = Math.round(width * ratio)
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
                type: 'image/webp',
              })
              resolve({
                compressedFile,
                width,
                height,
              })
            } else {
              reject(new Error('WebP 转换失败'))
            }
          },
          'image/webp',
          quality,
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
    thumbnailFile.value = null
    thumbnailPreview.value = ''
    return
  }

  processing.value = true

  try {
    if (f.size > 5 * 1024 * 1024) {
      errorMsg.value = '图片大小不能超过 5MB'
      return
    }
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
    const formData = new FormData()
    formData.append('file', file.value)
    formData.append('belongTo', props.belongTo)

    if (props.generateThumbnail && thumbnailFile.value) {
      formData.append('thumbnail', thumbnailFile.value)
    }

    const { data } = await axios.post<UploadResponse>('/api/upload/img', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      },
      timeout: 30000,
    })

    if (data.code !== 0) {
      throw new Error(data.msg || '上传失败')
    }

    uploadedUrl.value = data.data.url
    uploadedThumbnailUrl.value = data.data.thumbnailUrl || ''

    const uploadInfo: UploadInfo = {
      url: uploadedUrl.value,
      urlOriginal: 'https://cnb.cool' + data.data?.assets?.path,
      thumbnailUrl: uploadedThumbnailUrl.value,
      thumbnailOriginalUrl: 'https://cnb.cool' + data.data?.thumbnailAssets?.path,
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

    toast.success(data.msg || '上传成功')
  } catch (err) {
    console.error(err)
    const error = err as { response?: { data?: { error?: string } }; message?: string }
    errorMsg.value = error.response?.data?.error || error.message || '上传失败'
    toast.error(errorMsg.value)
  } finally {
    uploading.value = false
  }
}
</script>
