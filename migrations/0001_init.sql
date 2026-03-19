-- Biao-Nav 数据库初始化
-- 在 CF Dashboard 中的 D1 控制台运行此 SQL

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 链接表
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  url TEXT NOT NULL,
  description_zh TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 为 links 表的 category_id 添加索引
CREATE INDEX IF NOT EXISTS idx_links_category ON links(category_id);

-- 站点设置表
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 插入默认设置
INSERT INTO settings (key, value) VALUES ('site_name_zh', 'Biao导航');
INSERT INTO settings (key, value) VALUES ('site_name_en', 'Biao Nav');
INSERT INTO settings (key, value) VALUES ('site_desc_zh', '探索互联网的精彩');
INSERT INTO settings (key, value) VALUES ('site_desc_en', 'Explore the best of the Internet');

-- 插入示例分类
INSERT INTO categories (name_zh, name_en, icon, sort_order) VALUES ('常用工具', 'Tools', '🔧', 1);
INSERT INTO categories (name_zh, name_en, icon, sort_order) VALUES ('AI 助手', 'AI', '🤖', 2);
INSERT INTO categories (name_zh, name_en, icon, sort_order) VALUES ('开发资源', 'Dev', '💻', 3);
INSERT INTO categories (name_zh, name_en, icon, sort_order) VALUES ('设计素材', 'Design', '🎨', 4);
INSERT INTO categories (name_zh, name_en, icon, sort_order) VALUES ('社交媒体', 'Social', '💬', 5);
INSERT INTO categories (name_zh, name_en, icon, sort_order) VALUES ('影音娱乐', 'Media', '🎬', 6);

-- 插入示例链接
INSERT INTO links (category_id, title_zh, title_en, url, description_zh, description_en, icon, sort_order) VALUES
(1, 'Google', 'Google', 'https://www.google.com', '全球最大的搜索引擎', 'The world''s largest search engine', '🔍', 1),
(1, 'GitHub', 'GitHub', 'https://github.com', '全球最大的代码托管平台', 'The world''s largest code hosting platform', '🐙', 2),
(1, 'Notion', 'Notion', 'https://www.notion.so', '强大的笔记和知识管理工具', 'Powerful notes and knowledge management', '📝', 3),
(2, 'ChatGPT', 'ChatGPT', 'https://chat.openai.com', 'OpenAI 的 AI 对话助手', 'AI assistant by OpenAI', '💬', 1),
(2, 'Claude', 'Claude', 'https://claude.ai', 'Anthropic 的 AI 助手', 'AI assistant by Anthropic', '🧠', 2),
(2, 'Gemini', 'Gemini', 'https://gemini.google.com', 'Google 的 AI 助手', 'AI assistant by Google', '✨', 3),
(3, 'MDN Web Docs', 'MDN Web Docs', 'https://developer.mozilla.org', 'Web 开发权威文档', 'Authoritative web development docs', '📚', 1),
(3, 'Stack Overflow', 'Stack Overflow', 'https://stackoverflow.com', '程序员问答社区', 'Developer Q&A community', '💡', 2),
(3, 'Can I Use', 'Can I Use', 'https://caniuse.com', '浏览器兼容性查询', 'Browser compatibility tables', '🌐', 3),
(4, 'Dribbble', 'Dribbble', 'https://dribbble.com', '设计师作品展示平台', 'Design showcase platform', '🏀', 1),
(4, 'Figma', 'Figma', 'https://www.figma.com', '在线协作设计工具', 'Online collaborative design tool', '🎯', 2),
(4, 'Unsplash', 'Unsplash', 'https://unsplash.com', '免费高品质图片', 'Free high-quality photos', '📷', 3),
(5, 'Twitter / X', 'Twitter / X', 'https://x.com', '全球社交媒体平台', 'Global social media platform', '🐦', 1),
(5, 'Reddit', 'Reddit', 'https://www.reddit.com', '全球最大社区论坛', 'The front page of the internet', '🔴', 2),
(6, 'YouTube', 'YouTube', 'https://www.youtube.com', '全球最大的视频平台', 'The world''s largest video platform', '▶️', 1),
(6, 'Spotify', 'Spotify', 'https://www.spotify.com', '流媒体音乐平台', 'Music streaming platform', '🎵', 2);
