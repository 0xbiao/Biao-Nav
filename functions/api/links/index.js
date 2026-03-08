// 链接列表 + 新增接口
// GET  /api/links  - 获取所有链接（可按分类筛选）
// POST /api/links  - 新增链接

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('category_id');

  try {
    let query = 'SELECT l.*, c.name_zh as category_name_zh, c.name_en as category_name_en FROM links l LEFT JOIN categories c ON l.category_id = c.id';
    const bindings = [];

    if (categoryId) {
      query += ' WHERE l.category_id = ?';
      bindings.push(categoryId);
    }

    query += ' ORDER BY l.sort_order ASC, l.id ASC';

    const stmt = env.DB.prepare(query);
    const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();

    return new Response(JSON.stringify({ data: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '查询失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { category_id, title_zh, title_en, url, description_zh, description_en, icon, sort_order } = body;

    if (!category_id || !title_zh || !title_en || !url) {
      return new Response(JSON.stringify({ error: '分类、中英文标题和 URL 不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await env.DB.prepare(
      'INSERT INTO links (category_id, title_zh, title_en, url, description_zh, description_en, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(category_id, title_zh, title_en, url, description_zh || '', description_en || '', icon || '', sort_order || 0).run();

    return new Response(JSON.stringify({
      message: '链接创建成功',
      data: { id: result.meta.last_row_id, category_id, title_zh, title_en, url }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '创建失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
