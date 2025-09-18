import { FeishuAPI, validateConfig } from '../utils/api.js';
import { StorageManager } from '../utils/storage.js';
import { DOMUtils, ValidationUtils, MessageUtils, TimeUtils, ArrayUtils } from '../utils/utils.js';

class OptionsPage {
  constructor() {
    this.currentTab = 'basic';
    this.defaultTags = new Set();
    this.history = [];
    this.currentPage = 1;
    this.pageSize = 20;
    this.filteredHistory = [];
    
    this.init();
  }

  async init() {
    this.bindEvents();
    this.switchTab('basic');
    await this.loadSettings();
    await this.loadHistory();
    await this.updateStats();
  }

  bindEvents() {
    // 标签切换
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // 配置表单
    document.getElementById('configForm').addEventListener('submit', this.saveConfig.bind(this));
    document.getElementById('testConnection').addEventListener('click', this.testConnection.bind(this));
    document.getElementById('toggleSecret').addEventListener('click', this.togglePassword.bind(this));

    // 字段映射
    document.getElementById('refreshFields').addEventListener('click', this.refreshFields.bind(this));

    // 默认标签
    const tagInput = document.getElementById('defaultTagInput');
    tagInput.addEventListener('keypress', this.handleTagInput.bind(this));

    // 高级设置
    document.getElementById('autoFillDescription').addEventListener('change', this.saveAdvancedSettings.bind(this));
    document.getElementById('enableNotifications').addEventListener('change', this.saveAdvancedSettings.bind(this));
    document.getElementById('duplicateCheck').addEventListener('change', this.saveAdvancedSettings.bind(this));
    document.getElementById('maxRetries').addEventListener('change', this.saveAdvancedSettings.bind(this));

    // 数据管理
    document.getElementById('clearCache').addEventListener('click', this.clearCache.bind(this));
    document.getElementById('clearHistory').addEventListener('click', this.clearHistory.bind(this));

    // 导入导出
    document.getElementById('exportBtn').addEventListener('click', this.exportConfig.bind(this));
    document.getElementById('importBtn').addEventListener('click', this.importConfig.bind(this));
    document.getElementById('importFile').addEventListener('change', this.handleFileImport.bind(this));

    // 历史记录
    document.getElementById('historySearch').addEventListener('input', this.filterHistory.bind(this));
    document.getElementById('timeFilter').addEventListener('change', this.filterHistory.bind(this));
    document.getElementById('tagFilter').addEventListener('change', this.filterHistory.bind(this));
    document.getElementById('exportHistory').addEventListener('click', this.exportHistory.bind(this));

    // 分页
    document.getElementById('prevPage').addEventListener('click', () => this.changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => this.changePage(1));
  }

  switchTab(tabName) {
    // 更新导航
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 更新内容
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    this.currentTab = tabName;

    // 特定标签的加载逻辑
    if (tabName === 'history' && this.history.length === 0) {
      this.loadHistory();
    }
  }

  async loadSettings() {
    try {
      const config = await StorageManager.getConfig();
      const preferences = await StorageManager.getPreferences();

      // 基础配置 - 自动填写默认值，如果配置为空则使用默认值
      const appIdField = document.getElementById('appId');
      const appSecretField = document.getElementById('appSecret');
      const baseIdField = document.getElementById('baseId');
      const tableIdField = document.getElementById('tableId');
      
      // 设置实际值（用于保存）
      const actualValues = {
        appId: config.appId || 'cli_a8de0f42f020101c',
        appSecret: config.appSecret || 'xgzYDKAkxPTZaeL9VXuDKh4rMA1SvLB4',
        baseId: config.baseId || 'U2GobH43xaSwFlsN92ZcgDF6nYe',
        tableId: config.tableId || 'tblQWm4ttkQD7QH0'
      };
      
      // 显示带*号的值（用户友好显示）
      appIdField.value = config.appId || 'cli_***************01c';
      appSecretField.value = config.appSecret || '***************************LB4';
      baseIdField.value = config.baseId || 'U2G*********************6nYe';
      tableIdField.value = config.tableId || 'tbl***************7QH0';
      
      // 存储实际值到data属性中
      appIdField.dataset.actualValue = actualValues.appId;
      appSecretField.dataset.actualValue = actualValues.appSecret;
      baseIdField.dataset.actualValue = actualValues.baseId;
      tableIdField.dataset.actualValue = actualValues.tableId;
      
      // 添加占位符文本
      appIdField.placeholder = '已内置默认配置';
      appSecretField.placeholder = '已内置默认配置';
      baseIdField.placeholder = '已内置默认配置';
      tableIdField.placeholder = '已内置默认配置';
      
      // 强制触发change事件确保值被设置
      [appIdField, appSecretField, baseIdField, tableIdField].forEach(field => {
        field.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // 高级设置
      document.getElementById('autoFillDescription').checked = preferences.autoFill !== false;
      document.getElementById('enableNotifications').checked = preferences.notifications !== false;
      document.getElementById('duplicateCheck').checked = preferences.duplicateCheck !== false;
      document.getElementById('maxRetries').value = config.maxRetries || '3';

      // 默认标签
      this.defaultTags = new Set(config.defaultTags || []);
      this.renderDefaultTags();

      // 如果有配置，自动刷新字段列表
      if (config.appId && config.appSecret && config.baseId && config.tableId) {
        this.refreshFields();
      }

    } catch (error) {
      console.error('加载设置失败:', error);
      MessageUtils.showError('加载设置失败: ' + error.message);
    }
  }

  // 获取字段的实际值（优先使用data-actual-value，否则使用输入值）
  getActualValue(field, inputValue) {
    if (!field) return inputValue ? inputValue.trim() : '';
    
    const actualValue = field.dataset.actualValue;
    const currentValue = inputValue ? inputValue.trim() : '';
    
    // 如果当前值包含*号，说明是显示值，使用实际值
    if (currentValue && currentValue.includes('***')) {
      return actualValue || currentValue;
    }
    
    // 如果用户修改了值，使用用户输入的值
    if (currentValue && currentValue !== field.value) {
      return currentValue;
    }
    
    // 否则使用实际值或当前值
    return actualValue || currentValue;
  }

  async saveConfig(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    
    // 获取实际值或输入值
    const appIdField = document.getElementById('appId');
    const appSecretField = document.getElementById('appSecret');
    const baseIdField = document.getElementById('baseId');
    const tableIdField = document.getElementById('tableId');
    
    const config = {
      appId: this.getActualValue(appIdField, formData.get('appId')),
      appSecret: this.getActualValue(appSecretField, formData.get('appSecret')),
      baseId: this.getActualValue(baseIdField, formData.get('baseId')),
      tableId: this.getActualValue(tableIdField, formData.get('tableId')),
      tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4', // 使用预配置的token
      defaultTags: Array.from(this.defaultTags)
    };

    // 验证配置
    const validation = ValidationUtils.validateFeishuConfig(config);
    if (!validation.isValid) {
      this.showFormErrors(validation.errors);
      return;
    }

    try {
      // 保存当前配置
      const currentConfig = await StorageManager.getConfig();
      const newConfig = { ...currentConfig, ...config };
      
      await StorageManager.setConfig(newConfig);
      
      // 更新UI状态
      this.showConnectionStatus('success', '配置保存成功');
      MessageUtils.showSuccess('配置已保存');

      // 刷新字段列表
      setTimeout(() => {
        this.refreshFields();
      }, 1000);

    } catch (error) {
      console.error('保存配置失败:', error);
      this.showConnectionStatus('error', '保存失败: ' + error.message);
      MessageUtils.showError('保存失败: ' + error.message);
    }
  }

  async testConnection() {
    const formData = new FormData(document.getElementById('configForm'));
    
    // 获取实际值或输入值
    const appIdField = document.getElementById('appId');
    const appSecretField = document.getElementById('appSecret');
    const baseIdField = document.getElementById('baseId');
    const tableIdField = document.getElementById('tableId');
    
    const config = {
      appId: this.getActualValue(appIdField, formData.get('appId')),
      appSecret: this.getActualValue(appSecretField, formData.get('appSecret')),
      baseId: this.getActualValue(baseIdField, formData.get('baseId')),
      tableId: this.getActualValue(tableIdField, formData.get('tableId')),
      tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4' // 使用预配置的token
    };

    // 验证配置
    const validation = ValidationUtils.validateFeishuConfig(config);
    if (!validation.isValid) {
      this.showFormErrors(validation.errors);
      return;
    }

    this.showConnectionStatus('testing', '正在测试连接...');

    try {
      const api = new FeishuAPI(config);
      
      // 测试获取访问令牌
      await api.getAccessToken();
      
      // 测试获取表格信息
      const tableInfo = await api.getTableInfo();
      
      this.showConnectionStatus('success', `连接成功！表格: ${tableInfo.name}`);
      MessageUtils.showSuccess('API连接测试成功');
      
    } catch (error) {
      console.error('连接测试失败:', error);
      this.showConnectionStatus('error', '连接失败: ' + error.message);
      MessageUtils.showError('连接测试失败: ' + error.message);
    }
  }

  showConnectionStatus(type, message) {
    const status = document.getElementById('connectionStatus');
    status.className = `connection-status ${type}`;
    status.querySelector('.status-text').textContent = message;
    status.style.display = 'flex';

    if (type === 'success') {
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    }
  }

  showFormErrors(errors) {
    // 清除之前的错误状态
    document.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('error');
      const errorMsg = group.querySelector('.error-message');
      if (errorMsg) errorMsg.remove();
    });

    // 显示新的错误
    Object.keys(errors).forEach(fieldName => {
      const field = document.getElementById(fieldName);
      if (field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 4px;';
        errorMsg.textContent = errors[fieldName];
        formGroup.appendChild(errorMsg);
      }
    });
  }

  togglePassword() {
    const input = document.getElementById('appSecret');
    const button = document.getElementById('toggleSecret');
    
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }

  async refreshFields() {
    const refreshBtn = document.getElementById('refreshFields');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '刷新中...';

    try {
      const config = await StorageManager.getConfig();
      if (!config.appId || !config.appSecret || !config.baseId || !config.tableId) {
        throw new Error('请先配置并保存飞书应用信息');
      }

      const api = new FeishuAPI(config);
      const fields = await api.getTableFields();
      
      this.populateFieldMapping(fields);
      MessageUtils.showSuccess('字段列表已更新');
      
    } catch (error) {
      console.error('刷新字段列表失败:', error);
      MessageUtils.showError('刷新字段列表失败: ' + error.message);
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '刷新字段列表';
    }
  }

  populateFieldMapping(fields) {
    const selects = document.querySelectorAll('.field-mapping select');
    
    selects.forEach(select => {
      // 保存当前选中值
      const currentValue = select.value;
      
      // 清空并重新填充选项
      select.innerHTML = '<option value="">自动检测</option>';
      
      fields.forEach(field => {
        const option = document.createElement('option');
        option.value = field.field_name;
        option.textContent = field.field_name;
        select.appendChild(option);
      });
      
      // 恢复选中值
      if (currentValue) {
        select.value = currentValue;
      }
    });
  }

  handleTagInput(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.target;
      const tag = input.value.trim();
      
      if (tag && !this.defaultTags.has(tag)) {
        this.defaultTags.add(tag);
        this.renderDefaultTags();
        input.value = '';
        this.saveAdvancedSettings();
      }
    }
  }

  renderDefaultTags() {
    const container = document.getElementById('defaultTags');
    container.innerHTML = '';
    
    this.defaultTags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag-item';
      tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove" data-tag="${tag}">×</span>
      `;
      
      tagElement.querySelector('.tag-remove').addEventListener('click', (e) => {
        this.defaultTags.delete(e.target.dataset.tag);
        this.renderDefaultTags();
        this.saveAdvancedSettings();
      });
      
      container.appendChild(tagElement);
    });
  }

  async saveAdvancedSettings() {
    try {
      const preferences = {
        autoFill: document.getElementById('autoFillDescription').checked,
        notifications: document.getElementById('enableNotifications').checked,
        duplicateCheck: document.getElementById('duplicateCheck').checked
      };

      await StorageManager.setPreferences(preferences);

      const config = await StorageManager.getConfig();
      config.maxRetries = parseInt(document.getElementById('maxRetries').value);
      config.defaultTags = Array.from(this.defaultTags);
      
      await StorageManager.setConfig(config);
      
    } catch (error) {
      console.error('保存高级设置失败:', error);
      MessageUtils.showError('保存设置失败: ' + error.message);
    }
  }

  async clearCache() {
    if (!confirm('确定要清理所有缓存数据吗？')) {
      return;
    }

    try {
      await StorageManager.clearCache();
      MessageUtils.showSuccess('缓存已清理');
      this.updateStats();
    } catch (error) {
      console.error('清理缓存失败:', error);
      MessageUtils.showError('清理缓存失败: ' + error.message);
    }
  }

  async clearHistory() {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
      return;
    }

    try {
      await StorageManager.clearHistory();
      this.history = [];
      this.renderHistory();
      MessageUtils.showSuccess('历史记录已清空');
      this.updateStats();
    } catch (error) {
      console.error('清空历史记录失败:', error);
      MessageUtils.showError('清空历史记录失败: ' + error.message);
    }
  }

  async exportConfig() {
    try {
      const data = await StorageManager.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `feishu-bookmark-config-${TimeUtils.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      MessageUtils.showSuccess('配置已导出');
    } catch (error) {
      console.error('导出配置失败:', error);
      MessageUtils.showError('导出失败: ' + error.message);
    }
  }

  importConfig() {
    document.getElementById('importFile').click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      await StorageManager.importData(text);
      
      MessageUtils.showSuccess('配置导入成功，请刷新页面');
      
      // 3秒后自动刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('导入配置失败:', error);
      MessageUtils.showError('导入失败: ' + error.message);
    }
    
    // 清空文件输入
    event.target.value = '';
  }

  async loadHistory() {
    try {
      this.history = await StorageManager.getHistory(500);
      this.filteredHistory = [...this.history];
      this.populateTagFilter();
      this.renderHistory();
    } catch (error) {
      console.error('加载历史记录失败:', error);
      MessageUtils.showError('加载历史记录失败: ' + error.message);
    }
  }

  populateTagFilter() {
    const tagFilter = document.getElementById('tagFilter');
    const allTags = new Set();
    
    this.history.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });

    // 清空并重新填充
    tagFilter.innerHTML = '<option value="all">全部标签</option>';
    
    Array.from(allTags).sort().forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  }

  filterHistory() {
    const searchText = document.getElementById('historySearch').value.toLowerCase();
    const timeFilter = document.getElementById('timeFilter').value;
    const tagFilter = document.getElementById('tagFilter').value;

    let filtered = [...this.history];

    // 文本搜索
    if (searchText) {
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchText) ||
        item.url?.toLowerCase().includes(searchText) ||
        item.description?.toLowerCase().includes(searchText)
      );
    }

    // 时间过滤
    if (timeFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeFilter) {
        case 'today':
          startDate = TimeUtils.getTodayStart();
          break;
        case 'week':
          startDate = TimeUtils.getWeekStart();
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      if (startDate) {
        filtered = filtered.filter(item => 
          new Date(item.savedAt) >= startDate
        );
      }
    }

    // 标签过滤
    if (tagFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(tagFilter)
      );
    }

    this.filteredHistory = filtered;
    this.currentPage = 1;
    this.renderHistory();
  }

  renderHistory() {
    const container = document.getElementById('historyList');
    const pagination = document.getElementById('historyPagination');
    
    if (this.filteredHistory.length === 0) {
      container.innerHTML = `
        <div class="loading-placeholder">
          <p>暂无历史记录</p>
        </div>
      `;
      pagination.style.display = 'none';
      return;
    }

    // 分页数据
    const paginatedData = ArrayUtils.paginate(
      this.filteredHistory, 
      this.currentPage, 
      this.pageSize
    );

    // 渲染历史项目
    container.innerHTML = paginatedData.data.map(item => `
      <div class="history-item">
        <div class="history-info">
          <div class="history-title">${item.title || '无标题'}</div>
          <div class="history-url">${item.url}</div>
          <div class="history-meta">
            <span>保存时间: ${TimeUtils.formatDate(item.savedAt)}</span>
            ${item.tags && item.tags.length > 0 ? 
              `<span>标签: ${item.tags.length}个</span>` : ''
            }
          </div>
          ${item.tags && item.tags.length > 0 ? `
            <div class="history-tags">
              ${item.tags.map(tag => 
                `<span class="history-tag">${tag}</span>`
              ).join('')}
            </div>
          ` : ''}
        </div>
        <div class="history-actions">
          <button type="button" class="btn-link" onclick="window.open('${item.url}')">打开</button>
          <button type="button" class="btn-link" onclick="this.deleteHistoryItem('${item.url}')">删除</button>
        </div>
      </div>
    `).join('');

    // 更新分页
    if (paginatedData.totalPages > 1) {
      pagination.style.display = 'flex';
      document.getElementById('currentPage').textContent = paginatedData.page;
      document.getElementById('totalPages').textContent = paginatedData.totalPages;
      
      document.getElementById('prevPage').disabled = paginatedData.page === 1;
      document.getElementById('nextPage').disabled = paginatedData.page === paginatedData.totalPages;
    } else {
      pagination.style.display = 'none';
    }
  }

  changePage(delta) {
    const maxPage = Math.ceil(this.filteredHistory.length / this.pageSize);
    this.currentPage = Math.max(1, Math.min(maxPage, this.currentPage + delta));
    this.renderHistory();
  }

  async deleteHistoryItem(url) {
    if (!confirm('确定要删除这条历史记录吗？')) {
      return;
    }

    try {
      this.history = this.history.filter(item => item.url !== url);
      await StorageManager.setHistory(this.history);
      
      this.filterHistory(); // 重新过滤和渲染
      MessageUtils.showSuccess('历史记录已删除');
    } catch (error) {
      console.error('删除历史记录失败:', error);
      MessageUtils.showError('删除失败: ' + error.message);
    }
  }

  async exportHistory() {
    try {
      const data = JSON.stringify(this.filteredHistory, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `feishu-bookmark-history-${TimeUtils.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      MessageUtils.showSuccess('历史记录已导出');
    } catch (error) {
      console.error('导出历史记录失败:', error);
      MessageUtils.showError('导出失败: ' + error.message);
    }
  }

  async updateStats() {
    try {
      const stats = await StorageManager.getStats();
      const usage = await StorageManager.getStorageUsage();

      document.getElementById('totalBookmarks').textContent = stats.totalBookmarks || 0;
      document.getElementById('todayBookmarks').textContent = stats.todayBookmarks || 0;
      document.getElementById('storageUsage').textContent = usage.percentage + '%';

    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  }
}

// 初始化设置页面
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});

// 全局函数（供HTML调用）
window.deleteHistoryItem = async function(url) {
  const optionsPage = window.optionsPageInstance;
  if (optionsPage) {
    await optionsPage.deleteHistoryItem(url);
  }
};