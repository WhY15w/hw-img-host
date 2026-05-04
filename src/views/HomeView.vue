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
  <div class="min-h-screen bg-background">
    <div class="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div class="mb-10 text-center">
        <div class="mb-3 flex items-center justify-center gap-2.5">
          <Upload class="h-6 w-6 text-foreground/60" :stroke-width="1.5" />
          <h1 class="text-2xl font-normal tracking-wide text-foreground">图片上传</h1>
        </div>
        <p class="text-sm text-muted-foreground">拖拽上传 · 压缩转码 · 直达链接</p>
      </div>

      <div class="w-full max-w-md space-y-5">
        <div class="space-y-4 rounded-xl border border-border/50 bg-card px-5 py-4">
          <div class="space-y-1.5">
            <Label for="upload-password" class="text-xs text-muted-foreground">上传密码</Label>
            <Input
              id="upload-password"
              v-model="password"
              type="password"
              placeholder="未设置则无需输入"
              class="h-9"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs text-muted-foreground">压缩质量</Label>
              <span class="text-xs tabular-nums text-foreground/70"
                >{{ Math.round(quality * 100) }}%</span
              >
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
            <Label for="thumbnail-toggle" class="text-xs text-muted-foreground">生成缩略图</Label>
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
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="uploadInfo"
          class="mt-6 w-full max-w-md overflow-hidden rounded-xl border border-border/50 bg-card"
        >
          <div class="px-5 py-3.5">
            <span class="text-xs font-medium text-muted-foreground">上传完成</span>
          </div>
          <div class="space-y-0.5 border-t border-border/30 px-5 py-3.5">
            <div class="flex items-baseline gap-2 py-1.5">
              <span class="w-17 shrink-0 text-xs text-muted-foreground/70">代理原图</span>
              <a
                :href="uploadInfo.url"
                target="_blank"
                class="truncate text-sm text-foreground/80 underline-offset-2 transition hover:text-foreground hover:underline"
              >
                {{ uploadInfo.url }}
              </a>
            </div>
            <div v-if="uploadInfo.thumbnailUrl" class="flex items-baseline gap-2 py-1.5">
              <span class="w-17 shrink-0 text-xs text-muted-foreground/70">代理缩略图</span>
              <a
                :href="uploadInfo.thumbnailUrl"
                target="_blank"
                class="truncate text-sm text-foreground/80 underline-offset-2 transition hover:text-foreground hover:underline"
              >
                {{ uploadInfo.thumbnailUrl }}
              </a>
            </div>
            <div class="flex items-baseline gap-2 py-1.5">
              <span class="w-17 shrink-0 text-xs text-muted-foreground/70">CNB 原图</span>
              <a
                :href="uploadInfo.urlOriginal"
                target="_blank"
                class="truncate text-sm text-foreground/80 underline-offset-2 transition hover:text-foreground hover:underline"
              >
                {{ uploadInfo.urlOriginal }}
              </a>
            </div>
            <div v-if="uploadInfo.thumbnailUrl" class="flex items-baseline gap-2 py-1.5">
              <span class="w-17 shrink-0 text-xs text-muted-foreground/70">CNB 缩略图</span>
              <a
                :href="uploadInfo.thumbnailOriginalUrl"
                target="_blank"
                class="truncate text-sm text-foreground/80 underline-offset-2 transition hover:text-foreground hover:underline"
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
