// ============================================
// Biao-Nav 管理后台逻辑
// 登录、分类管理、链接管理、站点设置、
// 拖拽排序、数据导入导出
// ============================================

(function() {
  const API = '/api';
  let token = localStorage.getItem('biao-nav-token') || '';
  let categories = [];
  let links = [];
  let dragSrcRow = null; // 拖拽源行

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', () => {
    if (token) showAdmin();
    initLogin();
    initNavigation();
    initCategoryForm();
    initLinkForm();
    initLogout();
    initLinkFilter();
    initSettings();
    initDataManagement();
  });

  // ========== 登录 ==========
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
        if (!res.ok) { showToast(data.error || '登录失败', 'error'); return; }
        token = data.token;
        localStorage.setItem('biao-nav-token', token);
        showToast('登录成功', 'success');
        showAdmin();
      } catch { showToast('网络错误', 'error'); }
      finally { btn.textContent = '登 录'; btn.disabled = false; }
    });
  }

  function showAdmin() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('adminView').style.display = 'flex';
    loadDashboard();
  }

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
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`page-${page}`)?.classList.add('active');

        if (page === 'dashboard') loadDashboard();
        if (page === 'categories') loadCategories();
        if (page === 'links') loadLinks();
        if (page === 'settings') loadSettings();
      });
    });
  }

  // ========== API 请求封装 ==========
  async function apiRequest(path, method = 'GET', body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, options);
    const data = await res.json();
    if (res.status === 401) {
      token = '';
      localStorage.removeItem('biao-nav-token');
      document.getElementById('loginView').style.display = '';
      document.getElementById('adminView').style.display = 'none';
      showToast('登录已过期，请重新登录', 'error');
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  // ========== 仪表盘 ==========
  async function loadDashboard() {
    try {
      const [catData, linkData] = await Promise.all([
        apiRequest('/categories'),
        apiRequest('/links'),
      ]);
      categories = catData.data || [];
      links = linkData.data || [];
      document.getElementById('statCategories').textContent = categories.length;
      document.getElementById('statLinks').textContent = links.length;
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('加载仪表盘数据失败', 'error');
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
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">暂无分类</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map(cat => `
      <tr draggable="true" data-id="${cat.id}" data-type="categories">
        <td class="drag-handle" style="cursor:grab;color:var(--text-muted);">≡</td>
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

    // 绑定拖拽事件
    initDragSort(tbody, 'categories');
  }

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
        if (id) { await apiRequest(`/categories/${id}`, 'PUT', body); showToast('分类更新成功', 'success'); }
        else { await apiRequest('/categories', 'POST', body); showToast('分类创建成功', 'success'); }
        closeCategoryModal();
        loadCategories();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

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

  window.deleteCategory = async function(id, name) {
    if (!confirm(`确定要删除分类「${name}」吗？\n该分类下所有链接也会被删除！`)) return;
    try {
      await apiRequest(`/categories/${id}`, 'DELETE');
      showToast('分类已删除', 'success');
      loadCategories();
    } catch (err) { showToast(err.message, 'error'); }
  };

  window.closeCategoryModal = function() {
    document.getElementById('categoryModal').classList.remove('active');
  };

  // ========== 链接管理 ==========
  function initLinkFilter() {
    document.getElementById('linkCategoryFilter')?.addEventListener('change', () => renderLinksTable());
  }

  async function loadLinks() {
    try {
      const [catData, linkData] = await Promise.all([
        apiRequest('/categories'),
        apiRequest('/links'),
      ]);
      categories = catData.data || [];
      links = linkData.data || [];
      updateCategorySelects();
      renderLinksTable();
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('加载链接失败', 'error');
    }
  }

  function updateCategorySelects() {
    const filter = document.getElementById('linkCategoryFilter');
    if (filter) {
      const currentVal = filter.value;
      filter.innerHTML = '<option value="">全部分类</option>' +
        categories.map(c => `<option value="${c.id}">${c.icon} ${escapeHtml(c.name_zh)}</option>`).join('');
      filter.value = currentVal;
    }
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
    if (filterCatId) filtered = links.filter(l => String(l.category_id) === filterCatId);

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px;">暂无链接</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(link => `
      <tr draggable="true" data-id="${link.id}" data-type="links">
        <td class="drag-handle" style="cursor:grab;color:var(--text-muted);">≡</td>
        <td>${escapeHtml(link.title_zh)}</td>
        <td>${escapeHtml(link.title_en)}</td>
        <td>${escapeHtml(link.category_name_zh || '-')}</td>
        <td><a href="${escapeHtml(link.url)}" target="_blank" style="color:var(--accent-primary);word-break:break-all;">${truncate(link.url, 25)}</a></td>
        <td>${link.sort_order}</td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" onclick="editLink(${link.id})">编辑</button>
          <button class="btn btn-danger btn-sm" onclick="deleteLink(${link.id}, '${escapeHtml(link.title_zh)}')">删除</button>
        </td>
      </tr>
    `).join('');

    initDragSort(tbody, 'links');
  }

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
        icon: '', // 不再使用手动填写的图标
        sort_order: parseInt(document.getElementById('linkSortOrder').value) || 0,
      };
      try {
        if (id) { await apiRequest(`/links/${id}`, 'PUT', body); showToast('链接更新成功', 'success'); }
        else { await apiRequest('/links', 'POST', body); showToast('链接创建成功', 'success'); }
        closeLinkModal();
        loadLinks();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  window.editLink = function(id) {
    const link = links.find(l => l.id === id);
    if (!link) return;
    document.getElementById('linkModalTitle').textContent = '编辑链接';
    document.getElementById('linkId').value = link.id;
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
    } catch (err) { showToast(err.message, 'error'); }
  };

  window.closeLinkModal = function() {
    document.getElementById('linkModal').classList.remove('active');
  };

  // ========== 拖拽排序 ==========
  function initDragSort(tbody, tableName) {
    const rows = tbody.querySelectorAll('tr[draggable="true"]');
    rows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        dragSrcRow = row;
        row.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        row.style.opacity = '1';
        tbody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        if (dragSrcRow === row) return;

        // 交换 DOM 位置
        const parent = row.parentNode;
        const allRows = [...parent.querySelectorAll('tr[draggable="true"]')];
        const srcIdx = allRows.indexOf(dragSrcRow);
        const destIdx = allRows.indexOf(row);

        if (srcIdx < destIdx) {
          parent.insertBefore(dragSrcRow, row.nextSibling);
        } else {
          parent.insertBefore(dragSrcRow, row);
        }

        // 保存新排序
        const newOrder = [...parent.querySelectorAll('tr[draggable="true"]')].map((r, i) => ({
          id: parseInt(r.dataset.id),
          sort_order: i,
        }));

        try {
          await apiRequest('/sort', 'PUT', { table: tableName, items: newOrder });
          showToast('排序已保存', 'success');
          // 重新加载以同步数据
          if (tableName === 'categories') loadCategories();
          else loadLinks();
        } catch (err) {
          showToast('排序保存失败', 'error');
        }
      });
    });
  }

  // ========== 站点设置 ==========
  function initSettings() {
    document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
      const body = {
        site_name_zh: document.getElementById('settingSiteNameZh').value,
        site_name_en: document.getElementById('settingSiteNameEn').value,
        site_desc_zh: document.getElementById('settingSiteDescZh').value,
        site_desc_en: document.getElementById('settingSiteDescEn').value,
      };
      try {
        await apiRequest('/settings', 'PUT', body);
        showToast('设置保存成功', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    });
  }

  async function loadSettings() {
    try {
      const data = await apiRequest('/settings');
      const s = data.data || {};
      document.getElementById('settingSiteNameZh').value = s.site_name_zh || '';
      document.getElementById('settingSiteNameEn').value = s.site_name_en || '';
      document.getElementById('settingSiteDescZh').value = s.site_desc_zh || '';
      document.getElementById('settingSiteDescEn').value = s.site_desc_en || '';
    } catch (err) {
      if (err.message !== 'Unauthorized') showToast('加载设置失败', 'error');
    }
  }

  // ========== 数据导入导出 ==========
  function initDataManagement() {
    // 导出
    document.getElementById('exportBtn')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API}/export`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('导出失败');
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `biao-nav-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('数据已导出', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    });

    // 导入
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    importBtn?.addEventListener('click', () => importFile?.click());

    importFile?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm('⚠️ 导入数据将覆盖所有现有分类、链接和设置！\n确定要继续吗？')) {
        importFile.value = '';
        return;
      }

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        await apiRequest('/import', 'POST', importData);
        showToast(`导入成功！分类: ${importData.categories?.length || 0}，链接: ${importData.links?.length || 0}`, 'success');
        loadDashboard();
      } catch (err) {
        showToast('导入失败: ' + err.message, 'error');
      } finally {
        importFile.value = '';
      }
    });
  }

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
