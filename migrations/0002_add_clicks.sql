-- 添加点击统计字段和收藏标记（仅限展示层面需要，收藏是前台 localstorage，不需要存服务端其实。这里只加点击统计）
ALTER TABLE links ADD COLUMN click_count INTEGER DEFAULT 0;
