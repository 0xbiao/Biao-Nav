// 管理员登录接口
// POST /api/auth/login
// Body: { password: "xxx" }
// 返回: { token: "jwt-token" }

async function createJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = btoa(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + 86400 * 7, // 7 天有效期
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const data = encoder.encode(`${header}.${tokenPayload}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${header}.${tokenPayload}.${sig}`;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const adminPassword = env.ADMIN_PASSWORD;
    const jwtSecret = env.JWT_SECRET;

    // 强制要求配置 CF 环境变量，未配置则拒绝登录
    if (!adminPassword || !jwtSecret) {
      return new Response(JSON.stringify({ error: '管理后台未配置，请在 Cloudflare 中设置 ADMIN_PASSWORD 和 JWT_SECRET 环境变量' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { password } = await request.json();

    if (password !== adminPassword) {
      return new Response(JSON.stringify({ error: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await createJWT({ role: 'admin' }, jwtSecret);

    return new Response(JSON.stringify({ token, message: '登录成功' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
