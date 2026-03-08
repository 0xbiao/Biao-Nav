// 站点设置接口（需认证）
// GET  /api/settings  - 获取所有设置
// PUT  /api/settings  - 批量更新设置

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare('SELECT * FROM settings').all();
    const settings = {};
    results.forEach(row => { settings[row.key] = row.value; });

    return new Response(JSON.stringify({ data: settings }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '查询失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // 批量更新/插入设置
    const stmt = env.DB.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    const batch = Object.entries(body).map(([key, value]) =>
      stmt.bind(key, String(value))
    );

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    return new Response(JSON.stringify({ message: '设置更新成功' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '更新失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
