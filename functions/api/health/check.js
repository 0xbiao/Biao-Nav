// 链接健康检查 API (需认证，受 _middleware 保护)
// POST /api/health/check
// Body: { "url": "https://example.com" }

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: '缺少 URL' }), { status: 400 });
    }

    try {
      const abortController = new AbortController();
      const id = setTimeout(() => abortController.abort(), 5000); // 5 秒超时限制
      
      const res = await fetch(url, {
        method: 'GET', // 某些网站禁止 HEAD，故用 GET
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BiaoNavHealthCheck/1.0)'
        },
        signal: abortController.signal
      });
      clearTimeout(id);

      return new Response(JSON.stringify({
        url,
        ok: res.ok,
        status: res.status
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (fetchErr) {
      // 超时或网络不可达
      return new Response(JSON.stringify({
        url,
        ok: false,
        status: 0,
        error: fetchErr.name === 'AbortError' ? '请求超时' : '无法连接'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: '解析参数失败', detail: err.message }), { status: 500 });
  }
}
