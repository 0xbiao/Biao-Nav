// 全局 HTML 拦截：用于注入 CF 环境变量（如 SITE_NAME）
export async function onRequest(context) {
  const { request, env, next } = context;
  const response = await next();
  
  // 只处理 GET 请求和 HTML 响应
  if (request.method !== 'GET') return response;
  
  const siteName = env.SITE_NAME;
  if (!siteName) return response;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    return new HTMLRewriter()
      .on('title', {
        element(e) {
          e.setInnerContent(`${siteName} - 极简网址导航`);
        }
      })
      .on('meta[property="og:title"]', {
        element(e) {
          e.setAttribute('content', `${siteName} - 极简高颜值网址导航`);
        }
      })
      .on('meta[name="description"]', {
        element(e) {
          e.setAttribute('content', `${siteName} - 探索互联网的精彩。精选实用工具、开发资源与灵感网站的高颜值导航站。`);
        }
      })
      .on('.logo-text', {
        // 对于部分页面没有 i18n 脚本的情况直接替换 HTML
        element(e) {
          e.setInnerContent(siteName);
        }
      })
      .on('head', {
        element(e) {
          // 向前端 JS 注入环境变量，方便 i18n 覆盖硬编码的站名
          e.append(`<script>window.CF_SITE_NAME = "${siteName}";</script>`, { html: true });
        }
      })
      .transform(response);
  }

  return response;
}
