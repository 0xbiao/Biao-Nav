// 链接修改 + 删除接口
// PUT    /api/links/:id  - 修改链接
// DELETE /api/links/:id  - 删除链接

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;

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
      'UPDATE links SET category_id = ?, title_zh = ?, title_en = ?, url = ?, description_zh = ?, description_en = ?, icon = ?, sort_order = ? WHERE id = ?'
    ).bind(category_id, title_zh, title_en, url, description_zh || '', description_en || '', icon || '', sort_order || 0, id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '链接不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: '链接更新成功' }), {
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
    const result = await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: '链接不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: '链接删除成功' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '删除失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
