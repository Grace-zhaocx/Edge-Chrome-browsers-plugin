// 简化版设置页面
(function() {
  'use strict';
  
  class SimpleOptionsPage {
    constructor() {
      this.history = [];
      this.filteredHistory = [];
      this.defaultTags = new Set();
      this.init();
    }

    init() {
      console.log('初始化设置页面...');
      this.bindEvents();
      this.loadSettings();
      this.switchTab('basic'); // 默认显示基础配置
      // 根据URL hash切换到指定标签
      this.applyHashTab();
      window.addEventListener('hashchange', () => this.applyHashTab());
      this.loadHistory(); // 加载历史记录
    }

    bindEvents() {
      // 标签切换
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          this.switchTab(e.target.dataset.tab);
        });
      });

      // 配置表单
      const configForm = document.getElementById('configForm');
      if (configForm) {
        configForm.addEventListener('submit', (e) => this.saveConfig(e));
      }

      // 测试连接
      const testBtn = document.getElementById('testConnection');
      if (testBtn) {
        testBtn.addEventListener('click', () => this.testConnection());
      }

      // 刷新字段列表
      const refreshBtn = document.getElementById('refreshFields');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.refreshFields());
      }

      // 密码显示切换
      const toggleBtn = document.getElementById('toggleSecret');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.togglePassword());
      }

      // 历史记录相关事件
      const clearHistoryBtn = document.getElementById('clearHistory');
      if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => this.clearHistory());
      }

      const exportFilteredBtn = document.getElementById('exportFilteredHistory');
      if (exportFilteredBtn) {
        exportFilteredBtn.addEventListener('click', () => this.exportHistory('filtered'));
      }
      const exportAllBtn = document.getElementById('exportAllHistory');
      if (exportAllBtn) {
        exportAllBtn.addEventListener('click', () => this.exportHistory('all'));
      }

      // 历史记录筛选与搜索
      const searchInput = document.getElementById('historySearch');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.applyFilters());
      }
      const timeFilter = document.getElementById('timeFilter');
      if (timeFilter) {
        timeFilter.addEventListener('change', () => this.applyFilters());
      }
      const tagFilter = document.getElementById('tagFilter');
      if (tagFilter) {
        tagFilter.addEventListener('change', () => this.applyFilters());
      }

      // 默认标签输入
      const defaultTagInput = document.getElementById('defaultTagInput');
      if (defaultTagInput) {
        defaultTagInput.addEventListener('keypress', (e) => this.handleTagInput(e));
      }
    }

    // 根据URL哈希切换标签，如 #history / #advanced / #basic
    applyHashTab() {
      const hash = (location.hash || '').replace('#', '').trim();
      const validTabs = ['basic', 'advanced', 'history', 'about'];
      if (validTabs.includes(hash)) {
        this.switchTab(hash);
      }
    }

    switchTab(tabName) {
      // 更新导航
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
      if (activeTab) {
        activeTab.classList.add('active');
      }

      // 更新内容
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      const activeContent = document.getElementById(`${tabName}Tab`);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    }

    async loadSettings() {
      try {
        const result = await chrome.storage.local.get(['config']);
        const config = result.config || {};

        // 填充表单
        const appIdField = document.getElementById('appId');
        const appSecretField = document.getElementById('appSecret');
        const baseIdField = document.getElementById('baseId');
        const tableIdField = document.getElementById('tableId');

        // 直接使用用户保存的配置值
        appIdField.value = config.appId || '';
        appSecretField.value = config.appSecret || '';
        baseIdField.value = config.baseId || '';
        tableIdField.value = config.tableId || '';

        console.log('设置已加载');

        // 如果已有字段映射，回填
        if (config.fieldMapping) {
          this.applyFieldMappingToUI(config.fieldMapping);
        }

        // 加载默认标签
        this.defaultTags = new Set(config.defaultTags || []);
        this.renderDefaultTags();

        // 检查是否已配置
        const isConfigured = config.appId && config.appSecret && config.baseId && config.tableId;

        if (isConfigured) {
          this.showMessage('✅ 配置已加载，建议测试连接确保正常', 'success');
        } else {
          this.showMessage('⚠️ 请完成飞书应用配置', 'warning');
        }
      } catch (error) {
        console.error('加载设置失败:', error);
        this.showMessage('加载设置失败: ' + error.message, 'error');
      }
    }

    // 获取字段的实际值
    getActualValue(fieldId, formValue) {
      return formValue ? formValue.trim() : '';
    }

    async saveConfig(event) {
      event.preventDefault();

      const formData = new FormData(event.target);
      const config = {
        appId: this.getActualValue('appId', formData.get('appId')),
        appSecret: this.getActualValue('appSecret', formData.get('appSecret')),
        baseId: this.getActualValue('baseId', formData.get('baseId')),
        tableId: this.getActualValue('tableId', formData.get('tableId'))
      };

      // 验证配置
      if (!config.appId || !config.appSecret) {
        this.showMessage('请填写完整的应用认证信息', 'error');
        return;
      }
      
      if (!config.baseId || !config.tableId) {
        this.showMessage('请填写多维表格ID和数据表ID', 'error');
        return;
      }

      if (!config.appId.startsWith('cli_')) {
        this.showMessage('App ID格式错误，应以"cli_"开头', 'error');
        return;
      }

      if (!config.tableId.startsWith('tbl')) {
        this.showMessage('Table ID格式错误，应以"tbl"开头', 'error');
        return;
      }

      try {
        // 合并字段映射
        const existing = (await chrome.storage.local.get(['config'])).config || {};
        if (existing.fieldMapping) {
          config.fieldMapping = existing.fieldMapping;
        }
        await chrome.storage.local.set({ config });
        this.showMessage('配置保存成功！', 'success');
        console.log('配置已保存:', config);
      } catch (error) {
        console.error('保存配置失败:', error);
        this.showMessage('保存失败: ' + error.message, 'error');
      }
    }

    async testConnection() {
      const formData = new FormData(document.getElementById('configForm'));
      const config = {
        appId: this.getActualValue('appId', formData.get('appId')),
        appSecret: this.getActualValue('appSecret', formData.get('appSecret')),
        baseId: this.getActualValue('baseId', formData.get('baseId')),
        tableId: this.getActualValue('tableId', formData.get('tableId'))
      };

      console.log('测试连接配置:', {
        appId: config.appId,
        appSecretLength: config.appSecret ? config.appSecret.length : 0,
        baseId: config.baseId,
        tableId: config.tableId
      });

      // 验证配置
      if (!config.appId || !config.appSecret) {
        this.showMessage('请填写完整的应用认证信息', 'error');
        return;
      }
      
      if (!config.baseId || !config.tableId) {
        this.showMessage('请填写多维表格ID和数据表ID', 'error');
        return;
      }

      const testBtn = document.getElementById('testConnection');
      testBtn.disabled = true;
      testBtn.textContent = '测试中...';

      try {
        // 使用 app_id/app_secret 获取访问令牌
        console.log('使用 app_id/app_secret 获取访问令牌');
        console.log('测试连接配置:', {
          appId: config.appId,
          appSecretLength: config.appSecret.length,
          baseId: config.baseId,
          tableId: config.tableId
        });

        const requestBody = {
          app_id: config.appId,
          app_secret: config.appSecret
        };
        console.log('发送认证请求:', requestBody);

        const tokenData = await this.fetchTenantToken(requestBody);
        console.log('Token响应:', tokenData);

        if (tokenData.code !== 0) {
          let errorMsg = tokenData.msg || '获取访问令牌失败';
          if (tokenData.code === 10003) {
            errorMsg = 'App ID或App Secret无效，请检查是否正确';
          }
          throw new Error(`错误代码: ${tokenData.code}, ${errorMsg}`);
        }
        
        const accessToken = tokenData.tenant_access_token;

        // 先测试访问Base下的所有表格列表
        const tablesListUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables`;
        console.log('测试获取表格列表:', tablesListUrl);
        
        const tablesListResponse = await fetch(tablesListUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!tablesListResponse.ok) {
          const raw = await tablesListResponse.text();
          throw new Error(`访问Base失败: HTTP ${tablesListResponse.status}. ${raw.slice(0, 120)}... \nURL: ${tablesListUrl}`);
        }
        
        const tablesListData = await tablesListResponse.json();
        console.log('Base下的表格列表:', tablesListData);
        
        if (tablesListData.code !== 0) {
          throw new Error(`获取表格列表失败: ${tablesListData.msg}`);
        }

        // 显示所有可用的表格
        const availableTables = tablesListData.data?.items?.map(t => ({
          table_id: t.table_id,
          name: t.name
        })) || [];
        
        console.log('=== 可用的表格列表 ===');
        availableTables.forEach((table, index) => {
          console.log(`${index + 1}. 表格ID: ${table.table_id}, 名称: ${table.name}`);
          if (table.table_id === config.tableId) {
            console.log(`   👆 这是当前配置的目标表格`);
          }
        });
        console.log('========================');
        console.log(`当前配置的 tableId: ${config.tableId}`);

        // 检查目标表格是否存在
        const targetTable = tablesListData.data?.items?.find(table => table.table_id === config.tableId);
        if (!targetTable) {
          const tablesList = availableTables.map((t, i) => `${i + 1}. ${t.table_id} (${t.name})`).join('\n');
          throw new Error(`表格ID "${config.tableId}" 不存在。\n\n可用的表格：\n${tablesList}\n\n请从上面选择正确的表格ID并更新配置。`);
        }

        console.log(`✅ 找到目标表格: ${targetTable.name} (${targetTable.table_id})`);

        // 测试获取表格的字段信息（这个API通常权限要求更低）
        const fieldsUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/fields`;
        console.log('测试获取字段信息:', fieldsUrl);
        
        const fieldsResponse = await fetch(fieldsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!fieldsResponse.ok) {
          const raw = await fieldsResponse.text();
          console.warn(`获取字段信息失败: HTTP ${fieldsResponse.status}. ${raw.slice(0, 120)}...`);
          // 如果字段API也失败，那就直接用表格列表的信息
          this.showMessage(`✅ 连接成功！找到表格: ${targetTable.name}`, 'success');
        } else {
          const fieldsData = await fieldsResponse.json();
          console.log('字段信息:', fieldsData);
          
          if (fieldsData.code === 0) {
            const fieldCount = fieldsData.data?.items?.length || 0;
            this.showMessage(`✅ 连接成功！表格: ${targetTable.name}，共 ${fieldCount} 个字段`, 'success');
          } else {
            this.showMessage(`✅ 连接成功！找到表格: ${targetTable.name}`, 'success');
          }
        }

      } catch (error) {
        console.error('连接测试失败:', error);
        this.showMessage('连接测试失败: ' + error.message, 'error');
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = '测试连接';
      }
    }

    // 刷新字段列表并填充映射下拉框
    async refreshFields() {
      try {
        const { config } = await chrome.storage.local.get(['config']);
        
        // 检查是否有有效配置
        if (!config || !config.appId || !config.appSecret || !config.baseId || !config.tableId) {
          this.showMessage('请先填写并保存基础配置', 'warning');
          return;
        }

        // 获取 token（internal 优先）
        const tokenData = await this.fetchTenantToken({ app_id: config.appId, app_secret: config.appSecret });
        if (tokenData.code !== 0) throw new Error(tokenData.msg || '获取token失败');

        // 获取字段列表
        const fieldsUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/fields`;
        const fieldsResp = await fetch(fieldsUrl, {
          headers: {
            'Authorization': `Bearer ${tokenData.tenant_access_token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!fieldsResp.ok) {
          const raw = await fieldsResp.text();
          throw new Error(`获取字段失败: HTTP ${fieldsResp.status}. ${raw.slice(0,120)}... \nURL: ${fieldsUrl}`);
        }
        const fieldsData = await fieldsResp.json();
        if (fieldsData.code !== 0) throw new Error(fieldsData.msg || '获取字段失败');

        const fieldNames = (fieldsData.data?.items || []).map(f => f.field_name);
        const mappingIds = ['urlField','titleField','descField','notesField','tagsField','summaryField','timeField'];
        mappingIds.forEach(id => {
          const select = document.querySelector(`.field-mapping select[name="${id}"]`) || document.getElementById(id);
          if (!select) return;
          const current = select.value;
          select.innerHTML = '<option value="">自动检测</option>' + fieldNames.map(n => `<option value="${n}">${n}</option>`).join('');
          if (current) select.value = current; 
          select.onchange = () => this.saveFieldMappingFromUI();
        });

        this.showMessage('字段列表已刷新', 'success');
      } catch (e) {
        console.error(e);
        this.showMessage('刷新字段失败: ' + e.message, 'error');
      }
    }

    // 优先 internal 的 tenant_access_token 获取
    async fetchTenantToken(body) {
      const tryFetch = async (path) => {
        const resp = await fetch(`https://open.feishu.cn/open-apis${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(body)
        });
        if (!resp.ok) throw new Error(`HTTP错误: ${resp.status} ${resp.statusText}`);
        return resp.json();
      };
      let data = await tryFetch('/auth/v3/tenant_access_token/internal');
      if (data.code !== 0) data = await tryFetch('/auth/v3/tenant_access_token/');
      return data;
    }

    // 从UI读取字段映射并保存到config
    async saveFieldMappingFromUI() {
      try {
        const mapping = this.readFieldMappingFromUI();
        const { config } = await chrome.storage.local.get(['config']);
        const newConfig = { ...(config || {}), fieldMapping: mapping };
        await chrome.storage.local.set({ config: newConfig });
      } catch (e) {
        console.error('保存字段映射失败', e);
      }
    }

    readFieldMappingFromUI() {
      const getVal = (name) => {
        const el = document.querySelector(`.field-mapping select[name="${name}"]`) || document.getElementById(name);
        return el ? el.value : '';
      };
      return {
        url: getVal('urlField'),
        title: getVal('titleField'),
        description: getVal('descField'),
        notes: getVal('notesField'),
        tags: getVal('tagsField'),
        summary: getVal('summaryField'),
        time: getVal('timeField')
      };
    }

    applyFieldMappingToUI(mapping) {
      const setVal = (name, val) => {
        const el = document.querySelector(`.field-mapping select[name="${name}"]`) || document.getElementById(name);
        if (el && val) el.value = val;
      };
      setVal('urlField', mapping.url);
      setVal('titleField', mapping.title);
      setVal('descField', mapping.description);
      setVal('notesField', mapping.notes);
      setVal('tagsField', mapping.tags);
      setVal('summaryField', mapping.summary);
      setVal('timeField', mapping.time);
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

    hideMessage() {
      // 隐藏现有的消息元素
      const existingMessages = document.querySelectorAll('[data-temp-message]');
      existingMessages.forEach(msg => {
        msg.style.transform = 'translateX(100%)';
        setTimeout(() => msg.remove(), 300);
      });
    }

    showMessage(message, type = 'info') {
      // 创建消息元素
      const messageEl = document.createElement('div');
      messageEl.textContent = message;
      messageEl.setAttribute('data-temp-message', 'true');
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      `;

      // 根据类型设置颜色
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      messageEl.style.backgroundColor = colors[type] || colors.info;

      document.body.appendChild(messageEl);

      // 动画显示
      setTimeout(() => {
        messageEl.style.transform = 'translateX(0)';
      }, 10);

      // 自动隐藏
      setTimeout(() => {
        messageEl.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
          }
        }, 300);
      }, type === 'error' ? 5000 : 3000);
    }

    // 加载历史记录
    async loadHistory() {
      try {
        const result = await chrome.storage.local.get(['history']);
        this.history = result.history || [];
        
        // 初始化标签筛选选项
        this.populateTagFilter();
        
        console.log('加载到的历史记录:', this.history.length, '条');
        this.applyFilters();
      } catch (error) {
        console.error('加载历史记录失败:', error);
        this.showMessage('加载历史记录失败: ' + error.message, 'error');
      }
    }

    // 生成标签筛选选项
    populateTagFilter() {
      const tagSelect = document.getElementById('tagFilter');
      if (!tagSelect) return;
      const allTags = new Set();
      this.history.forEach(item => {
        (item.tags || []).forEach(t => allTags.add(t));
      });
      tagSelect.innerHTML = '<option value="all">全部标签</option>' +
        Array.from(allTags).sort().map(t => `<option value="${t}">${t}</option>`).join('');
    }

    // 应用搜索与筛选
    applyFilters() {
      const q = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();
      const timeVal = document.getElementById('timeFilter')?.value || 'all';
      const tagVal = document.getElementById('tagFilter')?.value || 'all';

      let list = [...this.history];

      // 关键字过滤：标题/URL/说明/备注/标签
      if (q) {
        list = list.filter(item => {
          const haystacks = [
            item.title || '',
            item.url || '',
            item.description || '',
            item.notes || '',
            (item.tags || []).join(' ')
          ].join(' ').toLowerCase();
          return haystacks.includes(q);
        });
      }

      // 时间过滤
      const start = this.getStartDateByFilter(timeVal);
      if (start) {
        list = list.filter(item => new Date(item.savedAt || item.timestamp) >= start);
      }

      // 标签过滤
      if (tagVal !== 'all') {
        list = list.filter(item => (item.tags || []).includes(tagVal));
      }

      // 按时间倒序
      list.sort((a, b) => new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp));

      this.filteredHistory = list;
      this.displayHistory(this.filteredHistory);
    }

    // 根据筛选值返回开始日期
    getStartDateByFilter(val) {
      const now = new Date();
      if (val === 'today') {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      if (val === 'week') {
        const day = now.getDay() || 7; // 1..7, 周一为1
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() - (day - 1));
        return monday;
      }
      if (val === 'month') {
        return new Date(now.getFullYear(), now.getMonth(), 1);
      }
      return null;
    }

    // 显示历史记录
    displayHistory(history) {
      const historyContainer = document.getElementById('historyList');
      if (!historyContainer) {
        console.warn('找不到历史记录容器');
        return;
      }

      if (history.length === 0) {
        historyContainer.innerHTML = `
          <div class="loading-placeholder">
            <p>暂无收藏记录</p>
            <small style="color: #6b7280;">使用插件收藏网页后，记录将显示在这里</small>
          </div>
        `;
        return;
      }

      // 按时间倒序排列
      const sortedHistory = history.sort((a, b) => 
        new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp)
      );

      historyContainer.innerHTML = sortedHistory.map((item, index) => {
        const savedTime = new Date(item.savedAt || item.timestamp);
        const timeStr = savedTime.toLocaleString('zh-CN');
        const tagsHtml = item.tags && item.tags.length > 0 
          ? `<div class="history-tags">${item.tags.map(tag => `<span class="history-tag">${tag}</span>`).join('')}</div>`
          : '';

        return `
          <div class="history-item" style="
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            background: white;
          ">
            <div class="history-info">
              <div class="history-title" style="
                font-weight: 600;
                font-size: 16px;
                color: #1f2937;
                margin-bottom: 8px;
                word-break: break-all;
              ">${item.title || '无标题'}</div>
              
              <div class="history-url" style="
                font-size: 14px;
                color: #3b82f6;
                margin-bottom: 8px;
                word-break: break-all;
              ">
                <a href="${item.url}" target="_blank" style="text-decoration: none; color: inherit;">
                  ${item.url}
                </a>
              </div>
              
              ${item.description ? `
                <div class="history-description" style="
                  font-size: 14px;
                  color: #6b7280;
                  margin-bottom: 8px;
                  line-height: 1.5;
                ">${item.description}</div>
              ` : ''}
              
              ${tagsHtml}
              
              <div class="history-meta" style="
                font-size: 12px;
                color: #9ca3af;
                margin-top: 8px;
              ">
                <span>保存时间: ${timeStr}</span>
              </div>
            </div>
            
            <div class="history-actions" style="
              margin-top: 12px;
              display: flex;
              gap: 8px;
            ">
              <button data-action="open" data-url="${item.url}" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
              ">打开链接</button>
              
              <button data-action="copy" data-url="${item.url}" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
              ">复制链接</button>
              
              <button data-action="delete" data-index="${index}" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
              ">删除</button>
            </div>
          </div>
        `;
      }).join('');

      // 事件委托处理操作按钮（open/copy/delete）
      historyContainer.addEventListener('click', (e) => {
        const action = e.target?.dataset?.action;
        if (!action) return;

        if (action === 'delete') {
          const index = parseInt(e.target.dataset.index);
          this.deleteHistoryItem(index);
          return;
        }

        if (action === 'open') {
          const url = e.target.dataset.url;
          if (url) window.open(url, '_blank');
          return;
        }

        if (action === 'copy') {
          const url = e.target.dataset.url || '';
          if (!url) return;
          navigator.clipboard.writeText(url)
            .then(() => this.showMessage('链接已复制', 'success'))
            .catch(() => this.showMessage('复制失败，请手动复制', 'error'));
          return;
        }
      });
    }

    // 清空历史记录
    async clearHistory() {
      if (!confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
        return;
      }

      try {
        await chrome.storage.local.set({ history: [] });
        await chrome.storage.local.set({ csvData: '' });
        this.history = [];
        this.filteredHistory = [];
        this.displayHistory([]);
        this.showMessage('历史记录已清空', 'success');
      } catch (error) {
        console.error('清空历史记录失败:', error);
        this.showMessage('清空失败: ' + error.message, 'error');
      }
    }

    // 导出历史记录
    async exportHistory(mode = 'filtered') {
      try {
        const result = await chrome.storage.local.get(['history', 'csvData']);
        const all = result.history || [];
        const history = mode === 'all' ? all : (this.filteredHistory || all);
        
        if (history.length === 0) {
          this.showMessage('没有可导出的历史记录', 'warning');
          return;
        }

        // 构建CSV内容：
        // - 导出全部：若已有缓存csvData则直接使用，否则实时生成
        // - 导出当前结果：始终根据过滤后的history实时生成，避免导出全部
        let csvContent;
        if (mode === 'all' && result.csvData) {
          csvContent = result.csvData;
        } else {
          const header = '网站标题,网站地址,网站说明,网站备注,网站标签,页面摘要,创建时间';
          const rows = history.map(item => {
            const escapeCSV = (str) => {
              if (!str) return '';
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            };
            return [
              escapeCSV(item.title || ''),
              escapeCSV(item.url || ''),
              escapeCSV(item.description || ''),
              escapeCSV(item.notes || ''),
              escapeCSV((item.tags || []).join(';')),
              escapeCSV(item.summary || ''),
              escapeCSV(item.savedAt || item.timestamp || '')
            ].join(',');
          });
          csvContent = header + '\n' + rows.join('\n');
        }

        // 创建下载
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = mode === 'all'
          ? `飞书收藏历史_全部_${date}.csv`
          : `飞书收藏历史_当前结果_${date}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showMessage(mode === 'all' ? '已导出全部历史记录' : '已导出当前筛选结果', 'success');
        
      } catch (error) {
        console.error('导出历史记录失败:', error);
        this.showMessage('导出失败: ' + error.message, 'error');
      }
    }

    // 删除单条历史记录
    async deleteHistoryItem(index) {
      if (!confirm('确定要删除这条记录吗？')) {
        return;
      }

      try {
        const result = await chrome.storage.local.get(['history']);
        const saved = result.history || [];
        if (index >= 0 && index < this.filteredHistory.length) {
          // 找到要删除项在原始数组中的位置（通过url+timestamp判定）
          const item = this.filteredHistory[index];
          const pos = saved.findIndex(h => h.url === item.url && (h.savedAt || h.timestamp) === (item.savedAt || item.timestamp));
          if (pos >= 0) saved.splice(pos, 1);
          await chrome.storage.local.set({ history: saved });
          this.history = saved;
          this.applyFilters();
          this.showMessage('记录已删除', 'success');
        }
      } catch (error) {
        console.error('删除记录失败:', error);
        this.showMessage('删除失败: ' + error.message, 'error');
      }
    }

    // 处理标签输入
    handleTagInput(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const input = event.target;
        const tag = input.value.trim();

        if (tag && !this.defaultTags.has(tag)) {
          this.defaultTags.add(tag);
          this.renderDefaultTags();
          input.value = '';
          this.saveDefaultTags();
        }
      }
    }

    // 渲染默认标签
    renderDefaultTags() {
      const container = document.getElementById('defaultTags');
      if (!container) return;

      container.innerHTML = '';

      this.defaultTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.style.cssText = `
          display: inline-block;
          background: #e5e7eb;
          color: #374151;
          padding: 4px 8px;
          margin: 2px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        `;
        tagElement.innerHTML = `
          ${tag}
          <span class="tag-remove" data-tag="${tag}" style="
            margin-left: 4px;
            color: #ef4444;
            font-weight: bold;
            cursor: pointer;
          ">×</span>
        `;

        tagElement.querySelector('.tag-remove').addEventListener('click', (e) => {
          this.defaultTags.delete(e.target.dataset.tag);
          this.renderDefaultTags();
          this.saveDefaultTags();
        });

        container.appendChild(tagElement);
      });
    }

    // 保存默认标签
    async saveDefaultTags() {
      try {
        const result = await chrome.storage.local.get(['config']);
        const config = result.config || {};
        config.defaultTags = Array.from(this.defaultTags);
        await chrome.storage.local.set({ config });
        console.log('默认标签已保存:', config.defaultTags);
      } catch (error) {
        console.error('保存默认标签失败:', error);
      }
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new SimpleOptionsPage();
    });
  } else {
    new SimpleOptionsPage();
  }

})();