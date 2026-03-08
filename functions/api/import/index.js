// 数据导入接口（需认证）
// POST /api/import - 从 JSON 导入数据（覆盖所有现有数据）

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const importData = await request.json();

    if (!importData.categories || !importData.links) {
      return new Response(JSON.stringify({ error: '无效的导入数据格式' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 清空现有数据
    await env.DB.batch([
      env.DB.prepare('DELETE FROM links'),
      env.DB.prepare('DELETE FROM categories'),
      env.DB.prepare('DELETE FROM settings'),
    ]);

    // 导入设置
    if (importData.settings) {
      const settingsStmt = env.DB.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?)'
      );
      const settingsBatch = Object.entries(importData.settings).map(([key, value]) =>
        settingsStmt.bind(key, String(value))
      );
      if (settingsBatch.length > 0) {
        await env.DB.batch(settingsBatch);
      }
    }

    // 导入分类（需要保留原始 ID 以维持链接关联）
    const catStmt = env.DB.prepare(
      'INSERT INTO categories (id, name_zh, name_en, icon, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const catBatch = importData.categories.map(cat =>
      catStmt.bind(cat.id, cat.name_zh, cat.name_en, cat.icon || '📁', cat.sort_order || 0)
    );
    if (catBatch.length > 0) {
      await env.DB.batch(catBatch);
    }

    // 导入链接
    const linkStmt = env.DB.prepare(
      'INSERT INTO links (id, category_id, title_zh, title_en, url, description_zh, description_en, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const linkBatch = importData.links.map(link =>
      linkStmt.bind(link.id, link.category_id, link.title_zh, link.title_en, link.url, link.description_zh || '', link.description_en || '', link.icon || '', link.sort_order || 0)
    );
    if (linkBatch.length > 0) {
      await env.DB.batch(linkBatch);
    }

    return new Response(JSON.stringify({
      message: '导入成功',
      stats: {
        categories: importData.categories.length,
        links: importData.links.length,
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '导入失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
