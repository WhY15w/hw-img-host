<script setup lang="ts">
import FileUploader from '@/components/public/FileUploader.vue'
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const password = ref('')
const quality = ref(0.7)
const generateThumbnail = ref(true)

const uploadInfo = ref<{
  url: string
  thumbnailUrl?: string
  urlOriginal?: string
  thumbnailOriginalUrl?: string
} | null>(null)
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
    <div class="flex min-h-[calc(100vh-4px)] flex-col items-center justify-center px-4 py-12">
      <div class="mb-4 text-center">
        <div class="mb-4 flex items-center justify-center gap-3">
          <Upload class="h-8 w-8" :stroke-width="2" />
          <h1 class="text-3xl font-light tracking-tight text-gray-900">图片上传</h1>
        </div>
        <p class="mt-2 text-sm text-gray-500">支持拖拽上传 • 自动压缩 • 生成缩略图</p>
      </div>

      <div class="w-full max-w-lg">
        <div class="mx-auto mb-4 w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h3 class="text-sm font-medium text-gray-700">上传设置</h3>

          <div class="space-y-1.5">
            <Label for="upload-password" class="text-xs text-gray-500">上传密码</Label>
            <Input
              id="upload-password"
              v-model="password"
              type="password"
              placeholder="请输入上传密码"
              class="h-9"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <Label class="text-xs text-gray-500">压缩质量</Label>
              <span class="text-xs font-medium text-gray-700">
                {{ Math.round(quality * 100) }}%
              </span>
            </div>
            <Slider
              :model-value="[quality]"
              @update:model-value="(val: number[] | undefined) => (quality = val?.[0] ?? quality)"
              :min="0.1"
              :max="1"
              :step="0.05"
            />
          </div>

          <div class="flex items-center justify-between">
            <Label for="thumbnail-toggle" class="text-xs text-gray-500">生成缩略图</Label>
            <Switch id="thumbnail-toggle" v-model="generateThumbnail" />
          </div>
        </div>

        <FileUploader
          v-model:uploadInfo="uploadInfo"
          :password="password"
          :quality="quality"
          :generateThumbnail="generateThumbnail"
          :maxHeight="5000"
          :maxWidth="5000"
          :thumbnailMaxWidth="400"
          :thumbnailMaxHeight="800"
          :thumbnailQuality="0.8"
        />
      </div>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="uploadInfo"
          class="mt-8 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white/80 shadow-sm backdrop-blur-sm"
        >
          <div
            class="border-b border-gray-100 bg-linear-to-r from-green-50 to-emerald-50 px-6 py-4"
          >
            <div class="flex items-center gap-2">
              <div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              <h3 class="text-sm font-medium text-gray-700">上传完成</h3>
            </div>
          </div>
          <div class="space-y-3 p-6">
            <div class="group">
              <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                代理原图链接
              </p>
              <a
                :href="uploadInfo.url"
                target="_blank"
                class="block truncate text-sm text-blue-600 transition hover:text-blue-700"
              >
                {{ uploadInfo.url }}
              </a>
            </div>
            <div v-if="uploadInfo.thumbnailUrl" class="group">
              <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                代理缩略图链接
              </p>
              <a
                :href="uploadInfo.thumbnailUrl"
                target="_blank"
                class="block truncate text-sm text-purple-600 transition hover:text-purple-700"
              >
                {{ uploadInfo.thumbnailUrl }}
              </a>
            </div>
            <div class="group">
              <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                CNB原图链接
              </p>
              <a
                :href="uploadInfo.urlOriginal"
                target="_blank"
                class="block truncate text-sm text-blue-600 transition hover:text-blue-700"
              >
                {{ uploadInfo.urlOriginal }}
              </a>
            </div>
            <div v-if="uploadInfo.thumbnailUrl" class="group">
              <p class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                CNB缩略图链接
              </p>
              <a
                :href="uploadInfo.thumbnailOriginalUrl"
                target="_blank"
                class="block truncate text-sm text-purple-600 transition hover:text-purple-700"
              >
                {{ uploadInfo.thumbnailOriginalUrl }}
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
