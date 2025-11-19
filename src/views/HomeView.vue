<script setup lang="ts">
import FileUploader from '@/components/public/FileUploader.vue'
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'

const uploadInfo = ref<{
  url: string
  thumbnailUrl?: string
  urlOriginal?: string
  thumbnailOriginalUrl?: string
} | null>(null)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
    <div class="flex min-h-[calc(100vh-4px)] flex-col items-center justify-center px-4 py-12">
      <div class="mb-4 text-center">
        <div class="mb-4 flex items-center justify-center gap-3">
          <Upload class="h-8 w-8" :stroke-width="2" />
          <h1 class="text-3xl font-light tracking-tight text-gray-900">图片上传</h1>
        </div>
        <p class="mt-2 text-sm text-gray-500">支持拖拽上传 • 自动压缩 • 生成缩略图</p>
      </div>

      <div class="w-full max-w-lg">
        <FileUploader
          v-model:uploadInfo="uploadInfo"
          belongTo="mindmap"
          :maxHeight="5000"
          :maxWidth="5000"
          :quality="0.7"
          :generateThumbnail="true"
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
            class="border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4"
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
