// 分类列表 + 新增接口
// GET  /api/categories  - 获取所有分类
// POST /api/categories  - 新增分类

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
    ).all();

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
    const { name_zh, name_en, icon, sort_order } = body;

    if (!name_zh || !name_en) {
      return new Response(JSON.stringify({ error: '中英文名称不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await env.DB.prepare(
      'INSERT INTO categories (name_zh, name_en, icon, sort_order) VALUES (?, ?, ?, ?)'
    ).bind(name_zh, name_en, icon || '📁', sort_order || 0).run();

    return new Response(JSON.stringify({
      message: '分类创建成功',
      data: { id: result.meta.last_row_id, name_zh, name_en, icon: icon || '📁', sort_order: sort_order || 0 }
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
