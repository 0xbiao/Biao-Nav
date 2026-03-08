// ============================================
// Biao-Nav 管理后台逻辑
// 登录、分类管理、链接管理
// ============================================

(function() {
  // API 基础路径
  const API = '/api';

  // JWT Token
  let token = localStorage.getItem('biao-nav-token') || '';

  // 缓存数据
  let categories = [];
  let links = [];

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', () => {
    // 检查 token 是否有效
    if (token) {
      showAdmin();
    }

    initLogin();
    initNavigation();
    initCategoryForm();
    initLinkForm();
    initLogout();
    initLinkFilter();
  });

  // ========== 登录功能 ==========
  function initLogin() {
    const form = document.getElementById('loginForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('loginPassword').value;
      const btn = document.getElementById('loginBtn');

      btn.textContent = '登录中...';
      btn.disabled = true;

      try {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || '登录失败', 'error');
          return;
        }

        token = data.token;
        localStorage.setItem('biao-nav-token', token);
        showToast('登录成功', 'success');
        showAdmin();
      } catch (err) {
        showToast('网络错误', 'error');
      } finally {
        btn.textContent = '登 录';
        btn.disabled = false;
      }
    });
  }

  // ========== 显示管理界面 ==========
  function showAdmin() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('adminView').style.display = 'flex';
    loadDashboard();
  }

  // ========== 退出登录 ==========
  function initLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      token = '';
      localStorage.removeItem('biao-nav-token');
      document.getElementById('loginView').style.display = '';
      document.getElementById('adminView').style.display = 'none';
      document.getElementById('loginPassword').value = '';
    });
  }

  // ========== 侧边栏导航 ==========
  function initNavigation() {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');

        // 更新激活状态
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // 切换页面
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`page-${page}`)?.classList.add('active');

        // 加载数据
        if (page === 'dashboard') loadDashboard();
        if (page === 'categories') loadCategories();
        if (page === 'links') loadLinks();
      });
    });
  }

  // ========== API 请求封装 ==========
  async function apiRequest(path, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API}${path}`, options);
    const data = await res.json();

    if (res.status === 401) {
      // Token 过期，回到登录
      token = '';
      localStorage.removeItem('biao-nav-token');
      document.getElementById('loginView').style.display = '';
      document.getElementById('adminView').style.display = 'none';
      showToast('登录已过期，请重新登录', 'error');
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  }

  // ========== 仪表盘 ==========
  async function loadDashboard() {
    try {
      const catData = await apiRequest('/categories');
      const linkData = await apiRequest('/links');
      categories = catData.data || [];
      links = linkData.data || [];

      document.getElementById('statCategories').textContent = categories.length;
      document.getElementById('statLinks').textContent = links.length;
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        showToast('加载仪表盘数据失败', 'error');
      }
    }
  }

  // ========== 分类管理 ==========
  async function loadCategories() {
    try {
      const data = await apiRequest('/categories');
      categories = data.data || [];
      renderCategoriesTable();
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('加载分类失败', 'error');
    }
  }

  function renderCategoriesTable() {
    const tbody = document.getElementById('categoriesBody');
    if (!tbody) return;

    if (categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px;">暂无分类，点击"新增分类"添加</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map(cat => `
      <tr>
        <td>${cat.icon}</td>
        <td>${escapeHtml(cat.name_zh)}</td>
        <td>${escapeHtml(cat.name_en)}</td>
        <td>${cat.sort_order}</td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" onclick="editCategory(${cat.id})">编辑</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory(${cat.id}, '${escapeHtml(cat.name_zh)}')">删除</button>
        </td>
      </tr>
    `).join('');
  }

  // 分类弹窗操作
  function initCategoryForm() {
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
      document.getElementById('categoryModalTitle').textContent = '新增分类';
      document.getElementById('categoryForm').reset();
      document.getElementById('categoryId').value = '';
      document.getElementById('categorySortOrder').value = '0';
      document.getElementById('categoryModal').classList.add('active');
    });

    document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('categoryId').value;
      const body = {
        name_zh: document.getElementById('categoryNameZh').value,
        name_en: document.getElementById('categoryNameEn').value,
        icon: document.getElementById('categoryIcon').value || '📁',
        sort_order: parseInt(document.getElementById('categorySortOrder').value) || 0,
      };

      try {
        if (id) {
          await apiRequest(`/categories/${id}`, 'PUT', body);
          showToast('分类更新成功', 'success');
        } else {
          await apiRequest('/categories', 'POST', body);
          showToast('分类创建成功', 'success');
        }
        closeCategoryModal();
        loadCategories();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 编辑分类（全局函数供 onclick 调用）
  window.editCategory = function(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('categoryModalTitle').textContent = '编辑分类';
    document.getElementById('categoryId').value = cat.id;
    document.getElementById('categoryIcon').value = cat.icon;
    document.getElementById('categoryNameZh').value = cat.name_zh;
    document.getElementById('categoryNameEn').value = cat.name_en;
    document.getElementById('categorySortOrder').value = cat.sort_order;
    document.getElementById('categoryModal').classList.add('active');
  };

  // 删除分类
  window.deleteCategory = async function(id, name) {
    if (!confirm(`确定要删除分类「${name}」吗？\n该分类下所有链接也会被删除！`)) return;

    try {
      await apiRequest(`/categories/${id}`, 'DELETE');
      showToast('分类已删除', 'success');
      loadCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.closeCategoryModal = function() {
    document.getElementById('categoryModal').classList.remove('active');
  };

  // ========== 链接管理 ==========
  function initLinkFilter() {
    document.getElementById('linkCategoryFilter')?.addEventListener('change', () => {
      renderLinksTable();
    });
  }

  async function loadLinks() {
    try {
      // 同时加载分类和链接
      const [catData, linkData] = await Promise.all([
        apiRequest('/categories'),
        apiRequest('/links'),
      ]);

      categories = catData.data || [];
      links = linkData.data || [];

      // 更新分类筛选下拉
      updateCategorySelects();
      renderLinksTable();
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('加载链接失败', 'error');
    }
  }

  function updateCategorySelects() {
    // 筛选下拉
    const filter = document.getElementById('linkCategoryFilter');
    if (filter) {
      const currentVal = filter.value;
      filter.innerHTML = '<option value="">全部分类</option>' +
        categories.map(c => `<option value="${c.id}">${c.icon} ${escapeHtml(c.name_zh)}</option>`).join('');
      filter.value = currentVal;
    }

    // 表单下拉
    const formSelect = document.getElementById('linkCategoryId');
    if (formSelect) {
      formSelect.innerHTML = '<option value="">请选择分类</option>' +
        categories.map(c => `<option value="${c.id}">${c.icon} ${escapeHtml(c.name_zh)}</option>`).join('');
    }
  }

  function renderLinksTable() {
    const tbody = document.getElementById('linksBody');
    if (!tbody) return;

    const filterCatId = document.getElementById('linkCategoryFilter')?.value;
    let filtered = links;

    if (filterCatId) {
      filtered = links.filter(l => String(l.category_id) === filterCatId);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px;">暂无链接</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(link => `
      <tr>
        <td>${link.icon || '🔗'}</td>
        <td>${escapeHtml(link.title_zh)}</td>
        <td>${escapeHtml(link.title_en)}</td>
        <td>${escapeHtml(link.category_name_zh || '-')}</td>
        <td><a href="${escapeHtml(link.url)}" target="_blank" style="color:var(--accent-primary);word-break:break-all;">${truncate(link.url, 30)}</a></td>
        <td>${link.sort_order}</td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" onclick="editLink(${link.id})">编辑</button>
          <button class="btn btn-danger btn-sm" onclick="deleteLink(${link.id}, '${escapeHtml(link.title_zh)}')">删除</button>
        </td>
      </tr>
    `).join('');
  }

  // 链接弹窗操作
  function initLinkForm() {
    document.getElementById('addLinkBtn')?.addEventListener('click', () => {
      document.getElementById('linkModalTitle').textContent = '新增链接';
      document.getElementById('linkForm').reset();
      document.getElementById('linkId').value = '';
      document.getElementById('linkSortOrder').value = '0';
      updateCategorySelects();
      document.getElementById('linkModal').classList.add('active');
    });

    document.getElementById('linkForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('linkId').value;
      const body = {
        category_id: parseInt(document.getElementById('linkCategoryId').value),
        title_zh: document.getElementById('linkTitleZh').value,
        title_en: document.getElementById('linkTitleEn').value,
        url: document.getElementById('linkUrl').value,
        description_zh: document.getElementById('linkDescZh').value,
        description_en: document.getElementById('linkDescEn').value,
        icon: document.getElementById('linkIcon').value || '',
        sort_order: parseInt(document.getElementById('linkSortOrder').value) || 0,
      };

      try {
        if (id) {
          await apiRequest(`/links/${id}`, 'PUT', body);
          showToast('链接更新成功', 'success');
        } else {
          await apiRequest('/links', 'POST', body);
          showToast('链接创建成功', 'success');
        }
        closeLinkModal();
        loadLinks();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  window.editLink = function(id) {
    const link = links.find(l => l.id === id);
    if (!link) return;

    document.getElementById('linkModalTitle').textContent = '编辑链接';
    document.getElementById('linkId').value = link.id;
    document.getElementById('linkIcon').value = link.icon;
    document.getElementById('linkTitleZh').value = link.title_zh;
    document.getElementById('linkTitleEn').value = link.title_en;
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkDescZh').value = link.description_zh || '';
    document.getElementById('linkDescEn').value = link.description_en || '';
    document.getElementById('linkSortOrder').value = link.sort_order;

    updateCategorySelects();
    document.getElementById('linkCategoryId').value = link.category_id;
    document.getElementById('linkModal').classList.add('active');
  };

  window.deleteLink = async function(id, name) {
    if (!confirm(`确定要删除链接「${name}」吗？`)) return;

    try {
      await apiRequest(`/links/${id}`, 'DELETE');
      showToast('链接已删除', 'success');
      loadLinks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.closeLinkModal = function() {
    document.getElementById('linkModal').classList.remove('active');
  };

  // ========== 工具函数 ==========
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }
})();
