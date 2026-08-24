interface KvStore {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<unknown>
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream): Promise<void>
  delete(key: string): Promise<void>
}

declare let img_kv: KvStore | undefined

const KV_KEY = 'img_kv'
const MAX_ITEMS = 500

function base64UrlToBytes(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return atob(b64)
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const [headerB64, payloadB64, signatureB64] = parts

    const payloadStr = base64UrlDecode(payloadB64)
    const payload = JSON.parse(payloadStr)
    if (payload.exp && payload.exp * 1000 < Date.now()) return false

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    const signature = base64UrlToBytes(signatureB64)
    const data = encoder.encode(`${headerB64}.${payloadB64}`)

    return crypto.subtle.verify('HMAC', key, signature, data)
  } catch {
    return false
  }
}

function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

function getKV(): KvStore {
  if (typeof img_kv === 'undefined') {
    throw new Error(
      'KV Storage 未配置：请在 EdgeOne Pages 控制台启用 KV 存储，创建命名空间并绑定到本项目（变量名 img_kv）',
    )
  }
  return img_kv
}

async function getItems(): Promise<Record<string, unknown>[]> {
  const data = await getKV().get(KV_KEY, 'json')
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : []
}

async function addItem(item: Record<string, unknown>) {
  const kv = getKV()
  const items = await getItems()
  const newItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    ...item,
    createdAt: new Date().toISOString(),
  }
  items.unshift(newItem)
  if (items.length > MAX_ITEMS) items.length = MAX_ITEMS
  await kv.put(KV_KEY, JSON.stringify(items))
  return newItem
}

async function removeItem(id: string) {
  const items = await getItems()
  const filtered = items.filter((r) => (r as { id?: string }).id !== id)
  await getKV().put(KV_KEY, JSON.stringify(filtered))
}

export async function onRequest(context: {
  request: Request
  env: Record<string, string | undefined>
  params: { path?: string | string[] }
}) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonRes({ code: 1, msg: '未授权' }, 401)
  }

  const token = authHeader.slice(7)
  const uploadPassword = context.env.UPLOAD_PASSWORD
  if (!uploadPassword) {
    return jsonRes({ code: 1, msg: '服务器未配置上传密码' }, 500)
  }

  const valid = await verifyToken(token, uploadPassword)
  if (!valid) {
    return jsonRes({ code: 1, msg: 'token 无效或已过期' }, 401)
  }

  const method = context.request.method
  const pathSegments = context.params.path

  try {
    if (method === 'GET') {
      const items = await getItems()
      return jsonRes({ code: 0, msg: 'ok', data: { images: items, total: items.length } })
    }

    if (method === 'POST') {
      const body = (await context.request.json()) as Record<string, unknown>
      const item = await addItem(body)
      return jsonRes({ code: 0, msg: 'ok', data: item })
    }

    if (method === 'DELETE') {
      const id = Array.isArray(pathSegments) ? pathSegments[0] : pathSegments
      if (!id) {
        return jsonRes({ code: 1, msg: '缺少 id' }, 400)
      }
      await removeItem(id)
      return jsonRes({ code: 0, msg: '删除成功' })
    }

    return jsonRes({ code: 1, msg: '不支持的请求方法' }, 405)
  } catch (e: unknown) {
    return jsonRes({ code: 1, msg: (e as Error).message || '操作失败' }, 500)
  }
}
