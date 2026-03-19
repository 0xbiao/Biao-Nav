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

// 允许写入的设置键白名单
const ALLOWED_SETTINGS_KEYS = ['site_name_zh', 'site_name_en', 'site_desc_zh', 'site_desc_en'];

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // 过滤只保留白名单内的键
    const safeEntries = Object.entries(body).filter(([key]) => ALLOWED_SETTINGS_KEYS.includes(key));

    if (safeEntries.length === 0) {
      return new Response(JSON.stringify({ error: '没有有效的设置字段' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stmt = env.DB.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    const batch = safeEntries.map(([key, value]) =>
      stmt.bind(key, String(value))
    );

    await env.DB.batch(batch);

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
