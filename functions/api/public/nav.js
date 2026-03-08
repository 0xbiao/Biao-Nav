// 公开导航数据接口（无需认证）
// GET /api/public/nav - 获取所有分类及其下链接

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 获取所有分类
    const { results: categories } = await env.DB.prepare(
      'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
    ).all();

    // 获取所有链接
    const { results: links } = await env.DB.prepare(
      'SELECT * FROM links ORDER BY sort_order ASC, id ASC'
    ).all();

    // 获取站点设置
    const { results: settingsRows } = await env.DB.prepare(
      'SELECT * FROM settings'
    ).all();

    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });

    // 将链接按分类分组
    const data = categories.map(cat => ({
      ...cat,
      links: links.filter(link => link.category_id === cat.id),
    }));

    return new Response(JSON.stringify({ categories: data, settings }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400', // 缓存 5 分钟，后台回源1天
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '数据加载失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
