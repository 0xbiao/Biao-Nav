// API 中间件：CORS 处理 + JWT 认证
// 公开路径无需认证，管理路径需要 JWT Token

async function verifyJWT(token, secret) {
  // 简易 JWT 验证（HMAC-SHA256）
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  if (expectedSig !== signatureB64) return null;

  try {
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// 公开路径列表（不需要认证）
const PUBLIC_PATHS = [
  '/api/public/',
  '/api/auth/login',
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 公开路径跳过认证
  if (isPublicPath(url.pathname)) {
    const response = await next();
    return addCorsHeaders(response);
  }

  // 管理路径需要 JWT 认证
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: '未授权访问' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const token = authHeader.substring(7);
  const jwtSecret = env.JWT_SECRET || 'biao-nav-default-secret';
  const payload = await verifyJWT(token, jwtSecret);

  if (!payload) {
    return new Response(JSON.stringify({ error: 'Token 无效或已过期' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 将用户信息注入 context
  context.data = { ...context.data, user: payload };

  const response = await next();
  return addCorsHeaders(response);
}

function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
