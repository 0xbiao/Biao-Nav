// 分类修改 + 删除接口
// PUT    /api/categories/:id  - 修改分类
// DELETE /api/categories/:id  - 删除分类

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;

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
      'UPDATE categories SET name_zh = ?, name_en = ?, icon = ?, sort_order = ? WHERE id = ?'
    ).bind(name_zh, name_en, icon || '📁', sort_order || 0, id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '分类不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: '分类更新成功' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '更新失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;

  try {
    // 先删除该分类下所有链接
    await env.DB.prepare('DELETE FROM links WHERE category_id = ?').bind(id).run();
    // 再删除分类
    const result = await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '分类不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: '分类删除成功' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '删除失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
