// 处理 OPTIONS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}

// 处理所有请求
export async function onRequest() {
  try {
    const res = new Response(JSON.stringify({ message: 'Hello from Edge Function!' }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
    return res
  } catch (e) {
    // 返回错误
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 502,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
