// ============================================
// Biao-Nav 主页逻辑
// 加载导航数据、搜索过滤、分类切换、时钟
// ============================================

(function() {
  // 存储导航数据
  let navData = { categories: [], settings: {} };
  let currentCategory = 'all';

  document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initSearch();
    initLangToggle();
    loadNavData();
  });

  // 监听语言变化事件，重新渲染
  window.addEventListener('langChanged', () => {
    renderCategories();
    renderNavGrid();
  });

  // ========== 时钟 ==========
  function initClock() {
    const clockEl = document.getElementById('clock');
    if (!clockEl) return;

    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  // ========== 搜索 ==========
  function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderNavGrid();
      }, 200);
    });
  }

  // ========== 语言切换 ==========
  function initLangToggle() {
    const langToggle = document.getElementById('langToggle');
    langToggle?.addEventListener('click', () => {
      toggleLang(); // 调用 i18n.js 中的函数
    });
  }

  // ========== 加载导航数据 ==========
  async function loadNavData() {
    const grid = document.getElementById('navGrid');

    try {
      const res = await fetch('/api/public/nav');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      navData = await res.json();

      // 更新站名（如果设置了）
      if (navData.settings) {
        const nameKey = `site_name_${currentLang}`;
        if (navData.settings[nameKey]) {
          document.querySelector('.logo-text').textContent = navData.settings[nameKey];
        }
      }

      renderCategories();
      renderNavGrid();
    } catch (err) {
      console.error('导航数据加载失败:', err);
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-text">${t('loadError')}</div>
        </div>
      `;
    }
  }

  // ========== 渲染分类标签 ==========
  function renderCategories() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    list.innerHTML = `<button class="category-tag ${currentCategory === 'all' ? 'active' : ''}" data-category="all">${t('allCategories')}</button>`;

    navData.categories.forEach(cat => {
      const name = cat[langField('name')] || cat.name_zh;
      const btn = document.createElement('button');
      btn.className = `category-tag ${currentCategory === String(cat.id) ? 'active' : ''}`;
      btn.setAttribute('data-category', cat.id);
      btn.textContent = `${cat.icon} ${name}`;
      list.appendChild(btn);
    });

    // 事件委托
    list.onclick = (e) => {
      const tag = e.target.closest('.category-tag');
      if (!tag) return;
      currentCategory = tag.getAttribute('data-category');
      list.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      renderNavGrid();
    };
  }

  // ========== 渲染导航网格 ==========
  function renderNavGrid() {
    const grid = document.getElementById('navGrid');
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput?.value?.toLowerCase()?.trim() || '';

    if (!grid) return;
    grid.innerHTML = '';

    let hasResults = false;

    navData.categories.forEach(cat => {
      // 分类过滤
      if (currentCategory !== 'all' && String(cat.id) !== currentCategory) return;

      // 过滤链接
      const filteredLinks = (cat.links || []).filter(link => {
        if (!searchTerm) return true;
        const title = (link[langField('title')] || link.title_zh || '').toLowerCase();
        const desc = (link[langField('description')] || link.description_zh || '').toLowerCase();
        const url = (link.url || '').toLowerCase();
        return title.includes(searchTerm) || desc.includes(searchTerm) || url.includes(searchTerm);
      });

      if (filteredLinks.length === 0) return;
      hasResults = true;

      // 分类标题
      const catName = cat[langField('name')] || cat.name_zh;
      const sectionEl = document.createElement('div');
      sectionEl.className = 'category-section';
      sectionEl.innerHTML = `
        <span class="category-section-icon">${cat.icon}</span>
        <span class="category-section-title">${catName}</span>
        <div class="category-section-line"></div>
      `;
      grid.appendChild(sectionEl);

      // 链接卡片
      filteredLinks.forEach(link => {
        const title = link[langField('title')] || link.title_zh;
        const desc = link[langField('description')] || link.description_zh;
        const cardEl = document.createElement('a');
        cardEl.className = 'nav-card';
        cardEl.href = link.url;
        cardEl.target = '_blank';
        cardEl.rel = 'noopener noreferrer';
        cardEl.innerHTML = `
          <div class="nav-card-icon">${link.icon || '🔗'}</div>
          <div class="nav-card-info">
            <div class="nav-card-title">${escapeHtml(title)}</div>
            <div class="nav-card-desc">${escapeHtml(desc)}</div>
          </div>
        `;
        grid.appendChild(cardEl);
      });
    });

    if (!hasResults) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">${t('noResults')}</div>
        </div>
      `;
    }
  }

  // ========== HTML 转义 ==========
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
