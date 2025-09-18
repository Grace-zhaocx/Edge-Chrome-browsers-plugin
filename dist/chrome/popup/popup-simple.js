// 简化版弹窗脚本 - 避免模块加载问题
(function() {
  'use strict';
  
  class SimpleBookmarkPopup {
    constructor() {
      this.tags = new Set();
      this.currentPageData = null;
      this.init();
    }

    init() {
      console.log('开始初始化简化版弹窗...');
      
      // 先隐藏加载状态，显示表单
      this.hideLoading();
      this.showForm();
      
      // 绑定事件
      this.bindEvents();
      
      // 加载页面信息
      this.loadCurrentPageInfo();
    }

    hideLoading() {
      const loading = document.getElementById('loading');
      if (loading) {
        loading.style.display = 'none';
      }
    }

    showForm() {
      const formContainer = document.getElementById('formContainer');
      if (formContainer) {
        formContainer.style.display = 'block';
      }
    }

    bindEvents() {
      // 表单提交
      const form = document.getElementById('bookmarkForm');
      if (form) {
        form.addEventListener('submit', (e) => this.handleSave(e));
      }

      // 取消按钮
      const cancelBtn = document.getElementById('cancelBtn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => window.close());
      }

      // 设置按钮
      const settingsBtn = document.getElementById('settingsLink');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
          chrome.runtime.openOptionsPage();
        });
      }

      // 标签输入
      const tagInput = document.getElementById('tagInput');
      if (tagInput) {
        tagInput.addEventListener('keypress', (e) => this.handleTagInput(e));
      }
    }

    async loadCurrentPageInfo() {
      try {
        console.log('开始获取页面信息...');
        
        // 获取当前标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
          throw new Error('无法获取当前页面信息');
        }

        console.log('当前页面:', tab.title, tab.url);

        // 填充表单
        const titleInput = document.getElementById('title');
        const urlInput = document.getElementById('url');
        
        if (titleInput) titleInput.value = tab.title || '';
        if (urlInput) urlInput.value = tab.url || '';

        this.currentPageData = {
          url: tab.url,
          title: tab.title,
          timestamp: new Date().toISOString()
        };

        // 尝试获取选中文本
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString().trim()
          });
          
          const selectedText = results[0]?.result || '';
          if (selectedText) {
            const summaryGroup = document.getElementById('summaryGroup');
            const summaryInput = document.getElementById('summary');
            if (summaryGroup && summaryInput) {
              summaryInput.value = selectedText;
              summaryGroup.style.display = 'block';
            }
          }
        } catch (error) {
          console.warn('无法获取选中文本:', error);
        }

      } catch (error) {
        console.error('获取页面信息失败:', error);
        this.showError('获取页面信息失败: ' + error.message);
      }
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
      if (!container) return;
      
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
      
      console.log('开始保存收藏...');
      
      const formData = this.getFormData();
      console.log('表单数据:', formData);
      
      // 显示保存状态
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
      }

      try {
        // 这里应该调用飞书API，暂时模拟成功
        await this.simulateSave(formData);
        
        this.showSuccess();
        
      } catch (error) {
        console.error('保存失败:', error);
        this.showError('保存失败: ' + error.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = '保存收藏';
        }
      }
    }

    getFormData() {
      return {
        title: document.getElementById('title')?.value?.trim() || '',
        url: document.getElementById('url')?.value?.trim() || '',
        description: document.getElementById('description')?.value?.trim() || '',
        notes: document.getElementById('notes')?.value?.trim() || '',
        summary: document.getElementById('summary')?.value?.trim() || '',
        tags: Array.from(this.tags),
        timestamp: this.currentPageData?.timestamp || new Date().toISOString()
      };
    }

    async simulateSave(formData) {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 保存到本地存储
      try {
        const history = await this.getLocalHistory();
        history.unshift({
          ...formData,
          savedAt: new Date().toISOString()
        });
        
        await chrome.storage.local.set({ 
          history: history.slice(0, 100) // 只保留最新100条
        });
        
        console.log('保存到本地存储成功');
        
      } catch (error) {
        console.warn('保存到本地存储失败:', error);
      }
    }

    async getLocalHistory() {
      try {
        const result = await chrome.storage.local.get(['history']);
        return result.history || [];
      } catch (error) {
        console.error('获取本地历史失败:', error);
        return [];
      }
    }

    showSuccess() {
      document.getElementById('formContainer').style.display = 'none';
      document.getElementById('resultContainer').style.display = 'block';
      document.getElementById('resultSuccess').style.display = 'block';
      
      // 3秒后自动关闭
      setTimeout(() => {
        window.close();
      }, 2000);
    }

    showError(message) {
      const container = document.getElementById('formContainer');
      if (container) {
        container.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <div style="color: #ef4444; margin-bottom: 16px;">
              <h3>❌ 出现错误</h3>
              <p>${message}</p>
            </div>
            <button onclick="window.location.reload()" style="
              background: #3b82f6; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 6px; 
              cursor: pointer;
              margin-right: 8px;
            ">重试</button>
            <button onclick="chrome.runtime.openOptionsPage()" style="
              background: #6b7280; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 6px; 
              cursor: pointer;
            ">设置</button>
          </div>
        `;
      }
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new SimpleBookmarkPopup();
    });
  } else {
    new SimpleBookmarkPopup();
  }

})();