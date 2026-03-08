# 🧭 Biao-Nav 导航站

基于 **Cloudflare Pages + D1** 的现代导航站，支持后台管理、多主题多配色、中英双语。

## ✨ 功能特性

- 🎨 **5 种主题风格**：暗夜 / 明亮 / 极光 / 自然 / 赛博
- 🌈 **6 种配色方案**：海洋蓝 / 火焰橙 / 翡翠绿 / 紫罗兰 / 玫瑰金 / 冰川灰
- 🌐 **中英双语** 无缝切换
- 🔍 **实时搜索** 导航过滤
- 📁 **分类管理** 后台增删改查
- 🔗 **链接管理** 后台增删改查
- 📱 **响应式设计** 适配所有设备
- ⚡ **零成本运行** 使用 CF 免费额度

---

## 🚀 部署步骤

### 1. Fork 本仓库

点击右上角 **Fork** 按钮，将项目复制到你的 GitHub 账号。

### 2. 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **D1 SQL Database**
3. 点击 **Create database**，数据库名设为 `biao-nav-db`
4. 进入数据库，点击 **Console** 标签
5. 复制 `migrations/0001_init.sql` 文件中的全部 SQL 内容，粘贴到控制台中执行
6. 记录下**数据库 ID**（在数据库概览页面可以找到）

### 3. 创建 Pages 项目

1. 在 CF Dashboard 进入 **Workers & Pages** → **Create**
2. 选择 **Pages** → **Connect to Git**
3. 授权并选择你 Fork 的 **Biao-Nav** 仓库
4. 构建配置：
   - **Framework preset**: `None`
   - **Build command**: 留空
   - **Build output directory**: `public`
5. 点击 **Save and Deploy**

### 4. 绑定 D1 数据库

1. 进入你创建的 Pages 项目 → **Settings** → **Functions**
2. 找到 **D1 database bindings**
3. 添加绑定：
   - **Variable name**: `DB`
   - **D1 database**: 选择 `biao-nav-db`

### 5. 设置环境变量

在项目 **Settings** → **Environment variables** 中添加：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ADMIN_PASSWORD` | 管理后台密码 | `your-strong-password` |
| `JWT_SECRET` | JWT 签名密钥 | `any-random-string-here` |

> ⚠️ 请使用强密码，不要使用默认值。

### 6. 重新部署

设置完环境变量和 D1 绑定后，进入 **Deployments** 页面，对最新部署点击 **Retry deployment** 使配置生效。

### 7. 访问你的导航站

- 导航主页：`https://your-project.pages.dev`
- 管理后台：`https://your-project.pages.dev/admin.html`

---

## 📁 项目结构

```
Biao-Nav/
├── public/                  # 静态文件（部署根目录）
│   ├── index.html           # 导航主页
│   ├── admin.html           # 管理后台
│   ├── css/
│   │   ├── style.css        # 主样式 + 设计系统
│   │   ├── themes.css       # 多主题定义
│   │   └── admin.css        # 管理后台样式
│   └── js/
│       ├── app.js           # 主页逻辑
│       ├── i18n.js          # 国际化
│       ├── themes.js        # 主题切换
│       └── admin.js         # 管理后台逻辑
├── functions/               # CF Pages Functions (API)
│   └── api/
│       ├── _middleware.js   # CORS + JWT 认证
│       ├── auth/login.js    # 登录接口
│       ├── categories/      # 分类 CRUD
│       ├── links/           # 链接 CRUD
│       └── public/nav.js    # 公开数据接口
├── migrations/
│   └── 0001_init.sql        # 数据库初始化 SQL
├── wrangler.toml            # CF 配置
└── package.json
```

---

## 🔧 自定义域名（可选）

在 Pages 项目 **Custom domains** 中添加你的域名，CF 会自动配置 DNS 和 SSL。

---

## 📝 License

MIT
