// 数据导出接口（需认证）
// GET /api/export - 导出所有数据为 JSON

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results: categories } = await env.DB.prepare(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    ).all();

    const { results: links } = await env.DB.prepare(
      'SELECT * FROM links ORDER BY sort_order ASC'
    ).all();

    const { results: settingsRows } = await env.DB.prepare(
      'SELECT * FROM settings'
    ).all();

    const settings = {};
    settingsRows.forEach(row => { settings[row.key] = row.value; });

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      settings,
      categories,
      links,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="biao-nav-backup-${new Date().toISOString().slice(0,10)}.json"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '导出失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
