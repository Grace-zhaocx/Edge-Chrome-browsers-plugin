// 使用动态导入来避免模块加载问题
let FeishuAPI, StorageManager, showLoading, hideLoading, showError, showSuccess, browserAPI;

class BookmarkPopup {
  constructor() {
    this.tags = new Set();
    this.currentPageData = null;
    this.isDuplicate = false;
    this.existingRecord = null;
    this.defaultTags = new Set();

    this.init();
  }

  async init() {
    try {
      // 动态加载模块
      const apiModule = await import('../utils/api.js');
      const storageModule = await import('../utils/storage.js');
      const utilsModule = await import('../utils/utils.js');
      const compatModule = await import('../utils/browser-compat.js');

      FeishuAPI = apiModule.FeishuAPI;
      StorageManager = storageModule.StorageManager;
      showLoading = utilsModule.showLoading;
      hideLoading = utilsModule.hideLoading;
      showError = utilsModule.showError;
      showSuccess = utilsModule.showSuccess;
      browserAPI = compatModule.browserAPI;
      
      this.bindEvents();
      await this.loadDefaultTags();
      await this.loadCurrentPageInfo();
      await this.checkConfiguration();
    } catch (error) {
      console.error('初始化失败:', error);
      this.showSimpleError('插件初始化失败: ' + error.message);
    }
  }

  // 简单的错误显示函数
  showSimpleError(message) {
    const container = document.getElementById('formContainer') || document.body;
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ef4444;">
        <h3>加载失败</h3>
        <p>${message}</p>
        <button onclick="window.location.reload()" style="
          background: #3b82f6; 
          color: white; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 4px; 
          cursor: pointer;
        ">重试</button>
      </div>
    `;
    container.style.display = 'block';
  }

  bindEvents() {
    // 表单提交
    document.getElementById('bookmarkForm').addEventListener('submit', this.handleSave.bind(this));
    
    // 标签输入
    const tagInput = document.getElementById('tagInput');
    tagInput.addEventListener('keypress', this.handleTagInput.bind(this));
    tagInput.addEventListener('input', this.handleTagInputChange.bind(this));
    
    // 按钮事件
    document.getElementById('cancelBtn').addEventListener('click', this.handleCancel.bind(this));
    document.getElementById('updateBtn').addEventListener('click', this.handleUpdate.bind(this));
    document.getElementById('skipBtn').addEventListener('click', this.handleCancel.bind(this));
    document.getElementById('retryBtn').addEventListener('click', this.handleRetry.bind(this));
    document.getElementById('settingsBtn').addEventListener('click', this.openSettings.bind(this));
    document.getElementById('settingsLink').addEventListener('click', this.openSettings.bind(this));
    document.getElementById('testApiBtn').addEventListener('click', this.testApiConnection.bind(this));
  }

  async loadCurrentPageInfo() {
    try {
      showLoading();

      // 获取当前标签页信息
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        throw new Error('无法获取当前页面信息');
      }

      // 检查是否为受限制的URL
      const restrictedProtocols = ['chrome:', 'edge:', 'chrome-extension:', 'about:', 'file:'];
      const isRestrictedUrl = restrictedProtocols.some(protocol => tab.url.startsWith(protocol));

      // 注入内容脚本获取页面选中文本
      let selectedText = '';
      if (!isRestrictedUrl) {
        try {
          const results = await browserAPI.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString().trim()
          });
          selectedText = results[0]?.result || '';
        } catch (error) {
          console.warn('无法获取选中文本:', error);
        }
      } else {
        console.warn('跳过受限制的URL，无法注入脚本:', tab.url);
      }

      this.currentPageData = {
        url: tab.url,
        title: tab.title || '',
        selectedText,
        timestamp: new Date().toISOString()
      };

      this.populateForm();
      await this.checkDuplicate();
      
    } catch (error) {
      console.error('加载页面信息失败:', error);
      this.showError('获取页面信息失败: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  populateForm() {
    const form = document.getElementById('bookmarkForm');
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const summaryGroup = document.getElementById('summaryGroup');
    const summaryInput = document.getElementById('summary');

    titleInput.value = this.currentPageData.title;
    urlInput.value = this.currentPageData.url;

    // 检查是否为受限制的URL
    const restrictedProtocols = ['chrome:', 'edge:', 'chrome-extension:', 'about:', 'file:'];
    const isRestrictedUrl = restrictedProtocols.some(protocol => this.currentPageData.url.startsWith(protocol));

    if (isRestrictedUrl) {
      // 为受限制的URL显示友好提示
      titleInput.value = titleInput.value || '浏览器内部页面';

      // 添加说明信息
      const descriptionTextarea = document.getElementById('description');
      if (descriptionTextarea && !descriptionTextarea.value) {
        descriptionTextarea.value = '注意：此页面为浏览器内部页面，无法获取详细信息。';
      }
    } else if (this.currentPageData.selectedText) {
      summaryInput.value = this.currentPageData.selectedText;
      summaryGroup.style.display = 'block';
    }

    // 显示表单
    document.getElementById('formContainer').style.display = 'block';
  }

  async checkConfiguration() {
    try {
      const config = await StorageManager.getConfig();
      const statusIndicator = document.getElementById('statusIndicator');

      // 检查飞书配置
      const hasAppCredentials = config.appId && config.appSecret;
      const hasRequiredIds = config.baseId && config.tableId;

      if (!hasAppCredentials || !hasRequiredIds) {
        statusIndicator.className = 'status-indicator error';
        this.showConfigError();
        return false;
      }

      statusIndicator.className = 'status-indicator';

      return true;
    } catch (error) {
      console.error('检查配置失败:', error);
      return false;
    }
  }


  async checkDuplicate() {
    try {
      const config = await StorageManager.getConfig();
      const hasAuth = config.appId && config.appSecret;
      if (!hasAuth || !config.baseId || !config.tableId) return;

      // 通过background script查询重复记录
      const endpoint = `/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/records/search`;
      
      const response = await browserAPI.runtime.sendMessage({
        type: 'FEISHU_API_CALL',
        config: config,
        endpoint: endpoint,
        options: {
          method: 'POST',
          body: {
            filter: {
              conjunction: 'and',
              conditions: [{
                field_name: '网站地址',
                operator: 'is',
                value: [this.currentPageData.url]
              }]
            }
          }
        }
      });
      
      if (response?.error) {
        console.warn('查询重复记录失败:', response?.error);
        return;
      }

      const records = response?.data?.items || [];
      if (records.length > 0) {
        this.isDuplicate = true;
        this.existingRecord = records[0];
        this.showDuplicateWarning();
      }
    } catch (error) {
      console.warn('检查重复记录失败:', error);
    }
  }

  showDuplicateWarning() {
    const warning = document.getElementById('duplicateWarning');
    warning.style.display = 'block';
  }

  showConfigError() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
      <div class="config-error">
        <div class="error-icon">⚠️</div>
        <h3>配置未完成</h3>
        <p>请先配置飞书API信息</p>
        <button type="button" id="configBtn" class="btn-primary">前往配置</button>
      </div>
    `;
    container.style.display = 'block';
    
    document.getElementById('configBtn').addEventListener('click', this.openSettings.bind(this));
  }

  handleTagInput(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.target;
      const tag = input.value.trim();
      
      if (tag && !this.tags.has(tag)) {
        this.tags.add(tag);
        this.renderTags();
        input.value = '';
      }
    }
  }

  renderTags() {
    const container = document.getElementById('tagsList');
    container.innerHTML = '';
    
    this.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag-item';
      tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove" data-tag="${tag}">×</span>
      `;
      
      tagElement.querySelector('.tag-remove').addEventListener('click', (e) => {
        this.tags.delete(e.target.dataset.tag);
        this.renderTags();
      });
      
      container.appendChild(tagElement);
    });
  }

  async handleSave(event) {
    event.preventDefault();
    
    if (!(await this.checkConfiguration())) {
      return;
    }

    const formData = this.getFormData();
    if (!this.validateForm(formData)) {
      return;
    }

    await this.saveBookmark(formData);
  }

  async handleUpdate() {
    const formData = this.getFormData();
    if (!this.validateForm(formData)) {
      return;
    }

    await this.saveBookmark(formData, true);
  }

  async handleRetry() {
    const formData = this.getFormData();
    await this.saveBookmark(formData);
  }

  getFormData() {
    return {
      title: document.getElementById('title').value.trim(),
      url: document.getElementById('url').value.trim(),
      description: document.getElementById('description').value.trim(),
      notes: document.getElementById('notes').value.trim(),
      summary: document.getElementById('summary').value.trim(),
      tags: Array.from(this.tags),
      timestamp: this.currentPageData.timestamp
    };
  }

  validateForm(formData) {
    let isValid = true;
    
    // 清除之前的错误状态
    document.querySelectorAll('.form-group').forEach(group => {
      group.classList.remove('error');
    });

    if (!formData.title) {
      this.showFieldError('title', '标题不能为空');
      isValid = false;
    }

    if (!formData.url) {
      this.showFieldError('url', '网址不能为空');
      isValid = false;
    }

    return isValid;
  }

  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    // 添加错误消息
    let errorMsg = formGroup.querySelector('.error-message');
    if (!errorMsg) {
      errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      formGroup.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
  }

  async saveBookmark(formData, isUpdate = false) {
    const saveBtn = document.getElementById('saveBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnSpinner = saveBtn.querySelector('.btn-spinner');
    
    try {
      // 显示加载状态
      saveBtn.disabled = true;
      btnText.style.display = 'none';
      btnSpinner.style.display = 'inline-block';

      const config = await StorageManager.getConfig();
      
      // 调试：检查配置详情
      console.log('🔍 检查飞书配置:', {
        appId: config.appId ? `${config.appId.slice(0,8)}...` : '❌ 未配置',
        appSecret: config.appSecret ? `${config.appSecret.slice(0,8)}...` : '❌ 未配置',
        baseId: config.baseId || '❌ 未配置',
        tableId: config.tableId || '❌ 未配置'
      });
      
      // 检查是否配置了飞书API
      const hasAuth = config.appId && config.appSecret;
      const isConfigured = hasAuth && config.baseId && config.tableId;
      
      console.log('📋 配置检查结果:', {
        hasAuth: hasAuth,
        isConfigured: isConfigured
      });
      
      if (isConfigured) {
        try {
          // 通过background script调用飞书API
          const record = this.buildFeishuRecord(formData, config.fieldMapping);
          
          let endpoint, method;
          if (isUpdate && this.existingRecord) {
            endpoint = `/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/records/${this.existingRecord.record_id}`;
            method = 'PUT';
          } else {
            endpoint = `/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/records`;
            method = 'POST';
          }
          
          console.log('准备发送飞书API请求:', {
            baseId: config.baseId,
            tableId: config.tableId,
            endpoint: endpoint,
            method: method,
            record: record,
            requestBody: { fields: record }
          });
          
          console.log('⚠️ 请确认 tableId 对应的是"网站收藏数据表"');

          const response = await browserAPI.runtime.sendMessage({
            type: 'FEISHU_API_CALL',
            config: config,
            endpoint: endpoint,
            options: {
              method: method,
              body: { fields: record }
            }
          });
          
          console.log('收到飞书API响应:', response);
          
          if (response?.error) {
            throw new Error(response?.error);
          }

          console.log('🎉 飞书API响应:', response);

          if (response?.success !== false && !response?.error) {
            console.log('✅ 数据成功写入飞书表格！');
            // 飞书API保存成功
            this.showSuccess('已同步到飞书多维表格');
          } else {
            console.error('❌ 飞书API调用虽然有响应，但可能失败:', response);
            throw new Error(response?.error || '未知的API响应错误');
          }
          
        } catch (apiError) {
          console.warn('飞书API保存失败，改为本地保存:', apiError);
          // API失败时降级到本地保存
          await this.saveToLocal(formData);
          this.showSuccess('已保存到本地，飞书同步失败');
        }
      } else {
        // 没有配置API，直接本地保存
        await this.saveToLocal(formData);
        this.showSuccess('已保存到本地，请配置飞书API以启用同步');
      }
      
      // 保存到本地历史记录
      await StorageManager.addToHistory({
        ...formData,
        savedAt: new Date().toISOString(),
        syncStatus: isConfigured ? 'synced' : 'local'
      });

    } catch (error) {
      console.error('保存失败:', error);
      this.showError(error.message);
    } finally {
      // 恢复按钮状态
      saveBtn.disabled = false;
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  }

  // 根据字段映射构建飞书记录
  buildFeishuRecord(formData, fieldMapping = {}) {
    // 确保使用飞书表格中的确切字段名
    const fallback = {
      url: '网站地址',
      title: '网站标题', 
      description: '网站说明',
      notes: '网站备注',
      tags: '网站标签',
      summary: '页面摘要',
      time: '创建时间'
    };
    
    console.log('🔍 使用的字段映射:', fieldMapping);
    console.log('🔍 默认字段映射:', fallback);
    
    const mapName = (key) => {
      const mapped = fieldMapping?.[key] || fallback[key];
      console.log(`📝 字段映射: ${key} -> ${mapped}`);
      return mapped;
    };
    
    const record = {};
    
    // 必填字段 - 使用确切的飞书字段名
    record['网站地址'] = formData.url;
    record['网站标题'] = formData.title;
    
    // 可选字段
    if (formData.description) record['网站说明'] = formData.description;
    if (formData.notes) record['网站备注'] = formData.notes;
    if (formData.tags && formData.tags.length > 0) record['网站标签'] = formData.tags;
    if (formData.summary) record['页面摘要'] = formData.summary;
    
    // 时间字段转换为时间戳  
    if (formData.timestamp) {
      record['创建时间'] = new Date(formData.timestamp).getTime();
    }

    // 格式化记录
    return this.formatFeishuRecord(record);
  }

  formatFeishuRecord(record) {
    const formatted = {};
    
    Object.keys(record).forEach(key => {
      const value = record[key];
      
      if (value === null || value === undefined || value === '') {
        return; // 跳过空值
      }
      
      // 处理不同类型的字段
      if (key === '网站地址') {
        // URL字段直接使用字符串格式
        formatted[key] = value;
      } else if (key === '网站标签') {
        // 多选字段，直接发送数组
        if (Array.isArray(value)) {
          formatted[key] = value; // 直接使用数组格式
        } else {
          formatted[key] = [value.toString()]; // 将单个值转换为数组
        }
      } else if (Array.isArray(value)) {
        // 其他数组字段
        formatted[key] = value;
      } else if (typeof value === 'number') {
        // 数字字段（时间戳）
        formatted[key] = value;
      } else {
        // 文本字段
        formatted[key] = value.toString();
      }
    });
    
    console.log('格式化后的飞书记录:', formatted);
    return formatted;
  }

  // 本地保存方法
  async saveToLocal(formData) {
    try {
      // 保存到历史记录
      const result = await browserAPI.storage.local.get(['history']);
      const history = result.history || [];
      
      history.unshift({
        ...formData,
        savedAt: new Date().toISOString(),
        syncStatus: 'local'
      });
      
      await browserAPI.storage.local.set({ 
        history: history.slice(0, 500) // 只保留最新500条
      });
      
      // 同时保存为CSV格式，便于导入飞书
      const csvData = await this.getCSVData();
      const newCsvLine = this.formatAsCSV(formData);
      const updatedCSV = csvData ? csvData + '\n' + newCsvLine : this.getCSVHeader() + '\n' + newCsvLine;
      
      await browserAPI.storage.local.set({ 
        csvData: updatedCSV
      });
      
      console.log('保存到本地存储成功');
      
    } catch (error) {
      console.error('保存到本地存储失败:', error);
      throw error;
    }
  }

  async getCSVData() {
    try {
      const result = await browserAPI.storage.local.get(['csvData']);
      return result.csvData || '';
    } catch (error) {
      return '';
    }
  }

  getCSVHeader() {
    return '网站标题,网站地址,网站说明,网站备注,网站标签,页面摘要,创建时间';
  }

  formatAsCSV(data) {
    const escapeCSV = (str) => {
      if (!str) return '';
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [
      escapeCSV(data.title),
      escapeCSV(data.url),
      escapeCSV(data.description),
      escapeCSV(data.notes),
      escapeCSV(data.tags.join(';')),
      escapeCSV(data.summary),
      escapeCSV(data.timestamp)
    ].join(',');
  }

  showSuccess(message = '收藏成功！') {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'block';
    
    const successContainer = document.getElementById('resultSuccess');
    successContainer.style.display = 'block';
    
    // 更新成功消息
    successContainer.innerHTML = `
      <div class="success-icon">✅</div>
      <h3>收藏成功！</h3>
      <p>${message}</p>
      <button type="button" id="viewHistoryBtn" class="btn-link">
        查看历史记录
      </button>
    `;
    
    // 打开设置页并跳到历史标签
    const btn = document.getElementById('viewHistoryBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        const url = browserAPI.runtime.getURL('options/options.html#history');
        browserAPI.tabs.create({ url });
      });
    }
    
    // 调试期间：暂时禁用自动关闭，方便查看日志
    // setTimeout(() => {
    //   window.close();
    // }, 3000);
  }


  showError(message) {
    document.getElementById('formContainer').style.display = 'none';
    document.getElementById('resultContainer').style.display = 'block';
    document.getElementById('resultError').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
  }

  handleCancel() {
    window.close();
  }

  openSettings() {
    browserAPI.runtime.openOptionsPage();
  }


  async testApiConnection() {
    console.log('🚀 开始测试飞书API连接...');

    try {
      // 获取当前配置
      const config = await StorageManager.getConfig();

      if (!config.appId || !config.appSecret || !config.baseId || !config.tableId) {
        alert('⚠️ 请先在设置中配置飞书应用信息');
        this.openSettings();
        return;
      }

      console.log('1. 使用当前配置进行测试...');

      console.log('2. 通过background script测试API连接...');

      // 通过background script调用API
      const tableResult = await browserAPI.runtime.sendMessage({
        type: 'FEISHU_API_CALL',
        config: config,
        endpoint: `/bitable/v1/apps/${config.baseId}/tables/${config.tableId}`,
        options: { method: 'GET' }
      });

      console.log('表格API调用结果:', tableResult);

      if (tableResult.success && tableResult.data.code === 0) {
        console.log('✅ API连接成功');
        console.log('表格名称:', tableResult.data.data?.table?.name || '未知');
        
        // 测试创建记录
        console.log('3. 测试创建记录...');
        const testRecord = {
          fields: {
            '标题': '测试记录 - ' + new Date().toLocaleString(),
            '链接': 'https://example.com/test-' + Date.now(),
            '描述': '这是一个从Chrome扩展创建的测试记录',
            '标签': ['测试', 'Chrome扩展'],
            '收藏时间': Date.now()
          }
        };

        const createResult = await browserAPI.runtime.sendMessage({
          type: 'FEISHU_API_CALL',
          config: config,
          endpoint: `/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/records`,
          options: {
            method: 'POST',
            body: testRecord
          }
        });

        console.log('创建记录结果:', createResult);
        
        if (createResult.success && createResult.data.code === 0) {
          console.log('✅ 测试记录创建成功');
          console.log('记录ID:', createResult.data.data?.record?.record_id);
          alert('🎉 飞书API测试成功！\n\n✅ 连接正常\n✅ 测试记录已创建\n\n请查看浏览器控制台获取详细信息');
        } else {
          console.log('❌ 记录创建失败:', createResult.error || createResult.data?.msg);
          alert('⚠️  API连接成功，但记录创建失败：\n' + (createResult.error || createResult.data?.msg));
        }
        
      } else {
        console.log('❌ API连接失败:', tableResult.error || tableResult.data?.msg);
        console.log('错误代码:', tableResult.data?.code);
        alert('❌ API连接失败：\n' + (tableResult.error || tableResult.data?.msg));
      }

    } catch (error) {
      console.error('❌ 测试过程中出错:', error);
      alert('❌ 测试失败：\n' + error.message);
    }
  }


  // 加载默认标签
  async loadDefaultTags() {
    try {
      const config = await StorageManager.getConfig();
      this.defaultTags = new Set(config.defaultTags || []);
      this.renderSuggestedTags();
    } catch (error) {
      console.error('加载默认标签失败:', error);
    }
  }

  // 渲染预置标签
  renderSuggestedTags(filterText = '') {
    const container = document.getElementById('suggestedTagsList');
    const suggestedContainer = document.getElementById('suggestedTags');

    if (!container || !suggestedContainer) return;

    if (this.defaultTags.size === 0) {
      suggestedContainer.style.display = 'none';
      return;
    }

    container.innerHTML = '';
    suggestedContainer.style.display = 'block';

    // 过滤和排序标签
    const filteredTags = Array.from(this.defaultTags).filter(tag => {
      if (!filterText) return true;
      return tag.toLowerCase().includes(filterText.toLowerCase());
    }).sort((a, b) => {
      if (!filterText) return a.localeCompare(b);

      // 匹配度排序：完全匹配 > 开头匹配 > 包含匹配
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const filterLower = filterText.toLowerCase();

      const aExact = aLower === filterLower;
      const bExact = bLower === filterLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aLower.startsWith(filterLower);
      const bStarts = bLower.startsWith(filterLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return a.localeCompare(b);
    });

    filteredTags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'suggested-tag';
      tagElement.textContent = tag;

      // 如果已选择，添加选中样式
      if (this.tags.has(tag)) {
        tagElement.classList.add('selected');
      }

      // 如果匹配搜索，添加匹配样式
      if (filterText && tag.toLowerCase().includes(filterText.toLowerCase())) {
        tagElement.classList.add('matched');
      }

      tagElement.addEventListener('click', () => {
        this.toggleTag(tag);
        this.renderSuggestedTags(filterText);
      });

      container.appendChild(tagElement);
    });
  }

  // 处理标签输入变化（用于搜索匹配）
  handleTagInputChange(event) {
    const inputValue = event.target.value.trim();
    this.renderSuggestedTags(inputValue);
  }

  // 切换标签选择状态
  toggleTag(tag) {
    if (this.tags.has(tag)) {
      this.tags.delete(tag);
    } else {
      this.tags.add(tag);
    }
    this.renderTags();
  }
}

// 初始化弹窗
document.addEventListener('DOMContentLoaded', () => {
  new BookmarkPopup();
});