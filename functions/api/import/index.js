// \u6570\u636e\u5bfc\u5165\u63a5\u53e3\uff08\u9700\u8ba4\u8bc1\uff09
// POST /api/import - \u4ece JSON \u5bfc\u5165\u6570\u636e\uff08\u8986\u76d6\u6240\u6709\u73b0\u6709\u6570\u636e\uff09
// \u4f7f\u7528\u5355\u6b21 batch \u8c03\u7528\u4fdd\u8bc1\u539f\u5b50\u6027

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const importData = await request.json();

    if (!importData.categories || !importData.links) {
      return new Response(JSON.stringify({ error: '\u65e0\u6548\u7684\u5bfc\u5165\u6570\u636e\u683c\u5f0f' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // \u6784\u5efa\u5168\u90e8\u64cd\u4f5c\u8bed\u53e5\uff0c\u5408\u5e76\u4e3a\u5355\u6b21 batch \u4fdd\u8bc1\u539f\u5b50\u6027
    const statements = [];

    // 1. \u6e05\u7a7a\u73b0\u6709\u6570\u636e
    statements.push(env.DB.prepare('DELETE FROM links'));
    statements.push(env.DB.prepare('DELETE FROM categories'));
    statements.push(env.DB.prepare('DELETE FROM settings'));

    // 2. \u5bfc\u5165\u8bbe\u7f6e
    if (importData.settings) {
      const settingsStmt = env.DB.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?)'
      );
      Object.entries(importData.settings).forEach(([key, value]) => {
        statements.push(settingsStmt.bind(key, String(value)));
      });
    }

    // 3. \u5bfc\u5165\u5206\u7c7b\uff08\u4fdd\u7559\u539f\u59cb ID \u4ee5\u7ef4\u6301\u94fe\u63a5\u5173\u8054\uff09
    const catStmt = env.DB.prepare(
      'INSERT INTO categories (id, name_zh, name_en, icon, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    importData.categories.forEach(cat => {
      statements.push(catStmt.bind(cat.id, cat.name_zh, cat.name_en, cat.icon || '\ud83d\udcc1', cat.sort_order || 0));
    });

    // 4. \u5bfc\u5165\u94fe\u63a5
    const linkStmt = env.DB.prepare(
      'INSERT INTO links (id, category_id, title_zh, title_en, url, description_zh, description_en, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    importData.links.forEach(link => {
      statements.push(linkStmt.bind(link.id, link.category_id, link.title_zh, link.title_en, link.url, link.description_zh || '', link.description_en || '', link.icon || '', link.sort_order || 0));
    });

    // \u5355\u6b21 batch \u539f\u5b50\u6027\u6267\u884c\u6240\u6709\u64cd\u4f5c
    await env.DB.batch(statements);

    return new Response(JSON.stringify({
      message: '\u5bfc\u5165\u6210\u529f',
      stats: {
        categories: importData.categories.length,
        links: importData.links.length,
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '\u5bfc\u5165\u5931\u8d25', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
