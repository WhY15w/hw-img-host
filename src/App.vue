<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Toaster } from 'vue-sonner'
import { Upload, Image, LogOut } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { isAuthenticated, logout } = useAuth()

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <nav
      v-if="isAuthenticated"
      class="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm"
    >
      <div class="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <div class="flex items-center gap-1">
          <button
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition"
            :class="
              route.name === 'home'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="router.push('/')"
          >
            <Upload class="h-3.5 w-3.5" />
            上传
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition"
            :class="
              route.name === 'gallery'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="router.push('/gallery')"
          >
            <Image class="h-3.5 w-3.5" />
            图库
          </button>
        </div>
        <button
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          @click="handleLogout"
        >
          <LogOut class="h-3.5 w-3.5" />
          退出
        </button>
      </div>
    </nav>
    <div :class="{ 'pt-12': isAuthenticated }">
      <RouterView />
    </div>
    <Toaster position="top-center" richColors closeButton />
  </div>
</template>
