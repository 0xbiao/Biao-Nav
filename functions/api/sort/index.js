// 排序更新接口（需认证）
// PUT /api/sort - 批量更新排序
// Body: { table: "categories"|"links", items: [{ id: 1, sort_order: 0 }, ...] }

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const { table, items } = await request.json();

    if (!['categories', 'links'].includes(table) || !Array.isArray(items)) {
      return new Response(JSON.stringify({ error: '参数无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stmt = env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`);
    const batch = items.map(item => stmt.bind(item.sort_order, item.id));

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    return new Response(JSON.stringify({ message: '排序更新成功' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '排序更新失败', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
