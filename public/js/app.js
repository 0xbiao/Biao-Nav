// ============================================
// Biao-Nav 主页逻辑
// 导航数据加载、搜索、分类切换、时钟、
// 骨架屏、入场动画、搜索引擎、返回顶部、键盘快捷键
// ============================================

(function() {
  // 存储导航数据
  let navData = { categories: [], settings: {} };
  let currentCategory = 'all';
  let currentEngine = localStorage.getItem('biao-nav-engine') || 'google';

  // 搜索引擎配置
  const SEARCH_ENGINES = {
    google: { icon: '🌐', url: 'https://www.google.com/search?q=' },
    bing: { icon: '🔷', url: 'https://www.bing.com/search?q=' },
    baidu: { icon: '🅱️', url: 'https://www.baidu.com/s?wd=' },
    local: { icon: '🔍', url: null },
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

  // 监听语言变化事件，重新渲染并更新搜索框 placeholder
  window.addEventListener('langChanged', () => {
    renderCategories();
    renderNavGrid();
    // 更新外部搜索框 placeholder
    const dropdown = document.getElementById('searchEnginesDropdown');
    const activeItem = dropdown?.querySelector(`.search-engine-item[data-engine="${currentEngine}"]`);
    if (activeItem) {
      const externalInput = document.getElementById('searchInputExternal');
      if (externalInput) {
        const engineName = activeItem.textContent.trim().split(' ').pop();
        externalInput.placeholder = t('searchWith').replace('{engine}', engineName);
      }
    }
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
    const internalInput = document.getElementById('searchInputInternal');
    const externalInput = document.getElementById('searchInputExternal');

    if (internalInput) {
      let debounceTimer;
      internalInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderNavGrid();
        }, 200);
      });
    }

    if (externalInput) {
      externalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = externalInput.value.trim();
          if (query) {
            window.open(SEARCH_ENGINES[currentEngine].url + encodeURIComponent(query), '_blank');
          }
        }
      });
    }
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

    // 初始设置 Placeholder
    const updatePlaceholder = (item) => {
      const externalInput = document.getElementById('searchInputExternal');
      if (externalInput) {
        const engineName = item.textContent.trim().split(' ').pop();
        externalInput.placeholder = t('searchWith').replace('{engine}', engineName);
      }
    };

    // 初始化时调用一次
    const activeItem = Array.from(dropdown.querySelectorAll('.search-engine-item')).find(i => i.dataset.engine === currentEngine);
    if (activeItem) updatePlaceholder(activeItem);

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
      updatePlaceholder(item);
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
      // 按 / 聚焦内部搜索框（不在输入框中时）
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        document.getElementById('searchInputInternal')?.focus();
      }
      // Escape 失焦
      if (e.key === 'Escape') {
        document.getElementById('searchInputInternal')?.blur();
        document.getElementById('searchInputExternal')?.blur();
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
    const internalInput = document.getElementById('searchInputInternal');
    const searchTerm = internalInput?.value?.toLowerCase()?.trim() || '';

    if (!grid) return;
    grid.innerHTML = '';

    let hasResults = false;
    let cardIndex = 0; // 动画交错索引

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

      // 分类标题（带交错动画）
      const catName = escapeHtml(cat[langField('name')] || cat.name_zh);
      const sectionEl = document.createElement('div');
      sectionEl.className = 'category-section';
      sectionEl.style.animationDelay = `${cardIndex * 0.05}s`;
      sectionEl.innerHTML = `
        <span class="category-section-icon">${escapeHtml(cat.icon)}</span>
        <span class="category-section-title">${catName}</span>
        <div class="category-section-line"></div>
      `;
      grid.appendChild(sectionEl);
      cardIndex++;

      // 链接卡片（带交错动画）
      filteredLinks.forEach(link => {
        const title = link[langField('title')] || link.title_zh;
        const desc = link[langField('description')] || link.description_zh;
        
        // 我们不再预先给出写死的 fallback，而是挂载一个错误处理队列来尝试
        const domainUrl = link.url;
        const domain = (()=>{try{return new URL(domainUrl).hostname;}catch{return '';}})();
        const firstAttemptUrl = `https://favicon.im/${domain}`;
        
        const fallbackIcon = escapeHtml(link.icon || '🔗');
        const cardEl = document.createElement('a');
        cardEl.className = 'nav-card';
        cardEl.href = link.url;
        cardEl.target = '_blank';
        cardEl.rel = 'noopener noreferrer';
        cardEl.style.animationDelay = `${cardIndex * 0.05}s`;
        cardEl.innerHTML = `
          <div class="nav-card-icon">
            <img src="${firstAttemptUrl}" data-url="${escapeHtml(domainUrl)}" data-retry="0" alt="" class="favicon-img" onerror="window.handleFaviconError(this)">
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

  // ========== 全局 Favicon 加载错误处理 ==========
  // 按顺序尝试多个公有防盗链较弱的接口以及站点原生 ico
  window.handleFaviconError = function(img) {
    const url = img.getAttribute('data-url');
    let retryCount = parseInt(img.getAttribute('data-retry'));
    
    let domain = '';
    let origin = '';
    try {
      const u = new URL(url);
      domain = u.hostname;
      origin = u.origin;
    } catch {
      showFallback();
      return;
    }

    const fallbackSources = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://api.iowen.cn/favicon/${domain}.png`,
      `https://staticaly.com/favicon/${domain}`, // 稳定服务
      `${origin}/favicon.ico`,
      `${origin}/apple-touch-icon.png`
    ];

    if (retryCount < fallbackSources.length) {
      img.src = fallbackSources[retryCount];
      img.setAttribute('data-retry', retryCount + 1);
    } else {
      showFallback();
    }

    function showFallback() {
      img.onerror = null;
      img.style.display = 'none';
      if (img.nextElementSibling) {
        img.nextElementSibling.style.display = 'flex';
      }
    }
  };

  // ========== HTML 转义 ==========
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
