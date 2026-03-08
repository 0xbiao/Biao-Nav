// ============================================
// Biao-Nav 主页逻辑
// 导航数据加载、搜索、分类切换、时钟、
// 骨架屏、入场动画、搜索引擎、返回顶部、键盘快捷键
// ============================================

(function() {
  // 存储导航数据
  let navData = { categories: [], settings: {} };
  let currentCategory = 'all';
  let currentEngine = localStorage.getItem('biao-nav-engine') || 'local';

  // 搜索引擎配置
  const SEARCH_ENGINES = {
    local: { icon: '🔍', url: null },
    google: { icon: '🌐', url: 'https://www.google.com/search?q=' },
    bing: { icon: '🔷', url: 'https://www.bing.com/search?q=' },
    baidu: { icon: '🅱️', url: 'https://www.baidu.com/s?wd=' },
  };

  document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initSearch();
    initSearchEngine();
    initLangToggle();
    initBackToTop();
    initKeyboardShortcuts();
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
      if (currentEngine !== 'local') return; // 外部搜索不过滤
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderNavGrid();
      }, 200);
    });

    // 回车触发外部搜索
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && currentEngine !== 'local') {
        const query = searchInput.value.trim();
        if (query) {
          window.open(SEARCH_ENGINES[currentEngine].url + encodeURIComponent(query), '_blank');
        }
      }
    });
  }

  // ========== 搜索引擎切换 ==========
  function initSearchEngine() {
    const btn = document.getElementById('searchEngineBtn');
    const dropdown = document.getElementById('searchEnginesDropdown');
    if (!btn || !dropdown) return;

    // 恢复上次选择
    btn.textContent = SEARCH_ENGINES[currentEngine]?.icon || '🔍';
    dropdown.querySelectorAll('.search-engine-item').forEach(item => {
      item.classList.toggle('active', item.dataset.engine === currentEngine);
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.search-engine-item');
      if (!item) return;
      currentEngine = item.dataset.engine;
      localStorage.setItem('biao-nav-engine', currentEngine);
      btn.textContent = item.dataset.icon;
      dropdown.querySelectorAll('.search-engine-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      dropdown.classList.remove('active');

      // 更新 placeholder
      const searchInput = document.getElementById('searchInput');
      if (currentEngine === 'local') {
        searchInput.placeholder = t('searchPlaceholder');
      } else {
        const engineName = item.textContent.trim().split(' ').pop();
        searchInput.placeholder = t('searchWith').replace('{engine}', engineName);
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.remove('active');
      }
    });
  }

  // ========== 语言切换 ==========
  function initLangToggle() {
    const langToggle = document.getElementById('langToggle');
    langToggle?.addEventListener('click', () => {
      toggleLang(); // 调用 i18n.js 中的函数
    });
  }

  // ========== 返回顶部 ==========
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 300);
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== 键盘快捷键 ==========
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // 按 / 聚焦搜索框（不在输入框中时）
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
      // Escape 失焦
      if (e.key === 'Escape') {
        document.getElementById('searchInput')?.blur();
      }
    });
  }

  // ========== 加载导航数据 ==========
  async function loadNavData() {
    const grid = document.getElementById('navGrid');

    try {
      const res = await fetch('/api/public/nav');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      navData = await res.json();

      // 更新站名
      if (navData.settings) {
        const nameKey = `site_name_${currentLang}`;
        if (navData.settings[nameKey]) {
          document.querySelector('.logo-text').textContent = navData.settings[nameKey];
        }
      }

      // 移除骨架屏
      const skeleton = document.getElementById('skeletonGrid');
      if (skeleton) skeleton.remove();

      renderCategories();
      renderNavGrid();
    } catch (err) {
      console.error('导航数据加载失败:', err);
      const skeleton = document.getElementById('skeletonGrid');
      if (skeleton) skeleton.remove();
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
    let cardIndex = 0; // 动画交错索引

    navData.categories.forEach(cat => {
      // 分类过滤
      if (currentCategory !== 'all' && String(cat.id) !== currentCategory) return;

      // 过滤链接
      const filteredLinks = (cat.links || []).filter(link => {
        if (!searchTerm || currentEngine !== 'local') return true;
        const title = (link[langField('title')] || link.title_zh || '').toLowerCase();
        const desc = (link[langField('description')] || link.description_zh || '').toLowerCase();
        const url = (link.url || '').toLowerCase();
        return title.includes(searchTerm) || desc.includes(searchTerm) || url.includes(searchTerm);
      });

      if (filteredLinks.length === 0) return;
      hasResults = true;

      // 分类标题（带交错动画）
      const catName = cat[langField('name')] || cat.name_zh;
      const sectionEl = document.createElement('div');
      sectionEl.className = 'category-section';
      sectionEl.style.animationDelay = `${cardIndex * 0.05}s`;
      sectionEl.innerHTML = `
        <span class="category-section-icon">${cat.icon}</span>
        <span class="category-section-title">${catName}</span>
        <div class="category-section-line"></div>
      `;
      grid.appendChild(sectionEl);
      cardIndex++;

      // 链接卡片（带交错动画）
      filteredLinks.forEach(link => {
        const title = link[langField('title')] || link.title_zh;
        const desc = link[langField('description')] || link.description_zh;
        const faviconUrl = getFaviconUrl(link.url);
        const fallbackIcon = link.icon || '🔗';
        const cardEl = document.createElement('a');
        cardEl.className = 'nav-card';
        cardEl.href = link.url;
        cardEl.target = '_blank';
        cardEl.rel = 'noopener noreferrer';
        cardEl.style.animationDelay = `${cardIndex * 0.05}s`;
        cardEl.innerHTML = `
          <div class="nav-card-icon">
            <img src="${faviconUrl}" alt="" class="favicon-img" onerror="this.onerror=null;this.src='${getFaviconFallback(link.url)}';this.addEventListener('error',function(){this.style.display='none';this.nextElementSibling.style.display='flex';});">
            <span class="favicon-fallback" style="display:none;">${fallbackIcon}</span>
          </div>
          <div class="nav-card-info">
            <div class="nav-card-title">${escapeHtml(title)}</div>
            <div class="nav-card-desc">${escapeHtml(desc)}</div>
          </div>
        `;
        grid.appendChild(cardEl);
        cardIndex++;
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

  // ========== 获取 Favicon URL（主源：Google） ==========
  function getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  }

  // ========== 获取 Favicon 备用源 ==========
  function getFaviconFallback(url) {
    try {
      const origin = new URL(url).origin;
      return `${origin}/favicon.ico`;
    } catch {
      return '';
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
