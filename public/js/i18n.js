// ============================================
// Biao-Nav 国际化模块
// 支持中文 (zh) 和英文 (en)
// ============================================

const I18N = {
  zh: {
    siteName: 'Biao导航',
    searchPlaceholder: '搜索导航...',
    searchWith: '使用 {engine} 搜索...',
    allCategories: '全部',
    themeLabel: '主题风格',
    accentLabel: '配色方案',
    themeDark: '暗夜',
    themeLight: '明亮',
    themeAurora: '极光',
    themeNature: '自然',
    themeCyber: '赛博',
    engineLocal: '站内搜索',
    engineBaidu: '百度',
    noResults: '没有找到匹配的导航',
    loadError: '数据加载失败，请刷新重试',
    loading: '加载中...',
  },
  en: {
    siteName: 'Biao Nav',
    searchPlaceholder: 'Search navigation...',
    searchWith: 'Search with {engine}...',
    allCategories: 'All',
    themeLabel: 'Theme Style',
    accentLabel: 'Color Accent',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeAurora: 'Aurora',
    themeNature: 'Nature',
    themeCyber: 'Cyber',
    engineLocal: 'Local Search',
    engineBaidu: 'Baidu',
    noResults: 'No matching navigation found',
    loadError: 'Failed to load data, please refresh',
    loading: 'Loading...',
  }
};

// 当前语言
let currentLang = localStorage.getItem('biao-nav-lang') || 'zh';

/**
 * 获取翻译文本
 */
function t(key) {
  return I18N[currentLang]?.[key] || I18N.zh[key] || key;
}

/**
 * 根据语言获取字段名后缀
 */
function langField(base) {
  return `${base}_${currentLang}`;
}

/**
 * 切换语言
 */
function toggleLang() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('biao-nav-lang', currentLang);
  applyI18n();
  const langIcon = document.getElementById('langIcon');
  if (langIcon) langIcon.textContent = currentLang === 'zh' ? '中' : 'EN';
  window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: currentLang } }));
}

/**
 * 应用国际化
 */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[currentLang]?.[key]) {
      el.textContent = I18N[currentLang][key];
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[currentLang]?.[key]) {
      el.placeholder = I18N[currentLang][key];
    }
  });
  document.title = t('siteName');
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const langIcon = document.getElementById('langIcon');
  if (langIcon) langIcon.textContent = currentLang === 'zh' ? '中' : 'EN';
  applyI18n();
});
