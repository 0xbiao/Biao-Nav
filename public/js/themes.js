// ============================================
// Biao-Nav 主题切换模块
// 管理主题风格和配色方案的切换与持久化
// ============================================

(function() {
  // 从 localStorage 恢复上次的主题和配色
  const savedTheme = localStorage.getItem('biao-nav-theme') || 'auto';
  const savedAccent = localStorage.getItem('biao-nav-accent') || 'ocean';

  // 在 DOM 加载前就应用主题，避免闪烁
  applyTheme(savedTheme);
  document.documentElement.setAttribute('data-accent', savedAccent);

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('biao-nav-theme') === 'auto' || !localStorage.getItem('biao-nav-theme')) {
      applyTheme('auto');
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const themePanel = document.getElementById('themePanel');
    const themeGrid = document.getElementById('themeGrid');
    const accentGrid = document.getElementById('accentGrid');

    // 标记当前激活的主题和配色
    updateActiveStates(savedTheme, savedAccent);

    // 切换主题面板显示/隐藏
    themeToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      themePanel.classList.toggle('active');
    });

    // 点击面板外部关闭
    document.addEventListener('click', (e) => {
      if (!themePanel?.contains(e.target) && e.target !== themeToggle) {
        themePanel?.classList.remove('active');
      }
    });

    // 主题选择
    themeGrid?.addEventListener('click', (e) => {
      const option = e.target.closest('.theme-option');
      if (!option) return;
      const theme = option.getAttribute('data-value');
      setTheme(theme);
    });

    // 配色选择
    accentGrid?.addEventListener('click', (e) => {
      const option = e.target.closest('.accent-option');
      if (!option) return;
      const accent = option.getAttribute('data-value');
      setAccent(accent);
    });
  });

  function applyTheme(theme) {
    if (theme === 'auto') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isSystemDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  function setTheme(theme) {
    applyTheme(theme);
    localStorage.setItem('biao-nav-theme', theme);
    updateActiveStates(theme, null);
  }

  function setAccent(accent) {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('biao-nav-accent', accent);
    updateActiveStates(null, accent);
  }

  function updateActiveStates(theme, accent) {
    if (theme) {
      document.querySelectorAll('.theme-option').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-value') === theme);
      });
    }
    if (accent) {
      document.querySelectorAll('.accent-option').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-value') === accent);
      });
    }
  }
})();
