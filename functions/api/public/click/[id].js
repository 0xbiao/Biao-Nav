// 记录链接点击量
// POST /api/public/click/:id
export async function onRequestPost(context) {
  const { env, params } = context;
  const id = params.id;

  try {
    const result = await env.DB.prepare(
      'UPDATE links SET click_count = click_count + 1 WHERE id = ?'
    ).bind(id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '链接未找到' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '更新失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
