<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Image, Copy, Check, ExternalLink, ArrowLeft, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

const router = useRouter()

interface ImageRecord {
  id: string
  url: string
  thumbnailUrl?: string
  urlOriginal?: string
  thumbnailOriginalUrl?: string
  name: string
  size: number
  type: string
  width: number
  height: number
  hasThumbnail: boolean
  thumbnailWidth: number
  thumbnailHeight: number
  thumbnailSize: number
  compressionRatio: number
  createdAt: string
}

interface ListResponse {
  code: number
  msg: string
  data: {
    images: ImageRecord[]
    total: number
  }
}

const images = ref<ImageRecord[]>([])
const loading = ref(true)
const error = ref('')
const total = ref(0)
const brokenImages = ref(new Set<string>())
const copiedId = ref('')

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatRatio(ratio: number): string {
  return (Math.abs(ratio) < 0.01 ? 0 : ratio).toFixed(1) + '%'
}

async function copyUrl(url: string, id: string) {
  try {
    await navigator.clipboard.writeText(url)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = ''
    }, 2000)
  } catch {
    toast.error('复制失败')
  }
}

async function fetchImages() {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('hw_img_host_token')
    const res = await fetch('/kv-api', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    let json: ListResponse
    try {
      json = (await res.json()) as ListResponse
    } catch {
      error.value = `请求失败（HTTP ${res.status}）`
      return
    }
    if (!res.ok || json.code !== 0) {
      error.value = json.msg || `请求失败（HTTP ${res.status}）`
      return
    }
    images.value = json.data.images
    total.value = json.data.total
  } catch {
    error.value = '网络请求失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchImages()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <div class="mb-8 flex items-center justify-between">
        <button
          class="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          @click="router.push('/')"
        >
          <ArrowLeft class="h-4 w-4 transition group-hover:-translate-x-0.5" />
          上传图片
        </button>
        <div class="flex items-center gap-2.5">
          <Image class="h-5 w-5 text-foreground/60" :stroke-width="1.5" />
          <h1 class="text-xl font-normal tracking-wide text-foreground">图片图库</h1>
        </div>
        <div class="w-18" />
      </div>

      <div v-if="loading" class="flex items-center justify-center py-24">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-24">
        <p class="text-sm text-destructive">{{ error }}</p>
        <Button variant="outline" size="sm" class="mt-4" @click="fetchImages">重试</Button>
      </div>

      <div v-else-if="images.length === 0" class="flex flex-col items-center justify-center py-24">
        <Image class="mb-3 h-10 w-10 text-muted-foreground/40" :stroke-width="1" />
        <p class="text-sm text-muted-foreground">还没有上传的图片</p>
        <Button variant="outline" size="sm" class="mt-4" @click="router.push('/')"> 去上传 </Button>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="img in images"
            :key="img.id"
            class="group overflow-hidden rounded-xl border border-border/50 bg-card transition hover:border-border"
          >
            <div class="relative aspect-4/3 overflow-hidden bg-muted/30">
              <img
                :src="img.thumbnailUrl || img.url"
                :alt="img.name"
                class="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
                @error="brokenImages.add(img.id)"
              />
              <div
                v-if="brokenImages.has(img.id)"
                class="absolute inset-0 flex items-center justify-center bg-muted/30"
              >
                <Image class="h-8 w-8 text-muted-foreground/50" :stroke-width="1" />
              </div>
              <div class="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
              <button
                class="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 opacity-0 backdrop-blur-sm transition hover:bg-background group-hover:opacity-100"
                :title="copiedId === img.id ? '已复制' : '复制链接'"
                @click="copyUrl(img.url, img.id)"
              >
                <Check v-if="copiedId === img.id" class="h-3.5 w-3.5 text-green-600" />
                <Copy v-else class="h-3.5 w-3.5 text-foreground/70" />
              </button>
              <a
                :href="img.url"
                target="_blank"
                class="absolute left-2 top-2 rounded-md bg-background/80 p-1.5 opacity-0 backdrop-blur-sm transition hover:bg-background group-hover:opacity-100"
                title="新窗口打开"
              >
                <ExternalLink class="h-3.5 w-3.5 text-foreground/70" />
              </a>
            </div>

            <div class="space-y-1.5 px-3 py-2.5">
              <p class="truncate text-xs font-medium text-foreground/80" :title="img.name">
                {{ img.name }}
              </p>
              <div class="flex items-center justify-between text-[11px] text-muted-foreground/70">
                <span>{{ img.width }}x{{ img.height }}</span>
                <span>{{ formatSize(img.size) }}</span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-muted-foreground/50">
                <span>压缩 {{ formatRatio(img.compressionRatio) }}</span>
                <span>{{ formatDate(img.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-center">
          <p class="text-xs text-muted-foreground">共 {{ total }} 张图片</p>
        </div>
      </template>
    </div>
  </div>
</template>
