// 后台服务脚本
import { StorageManager } from './utils/storage.js';
import { browserAPI } from './utils/browser-compat.js';

class BackgroundService {
  constructor() {
    this.init();
  }

  init() {
    // 监听插件安装
    browserAPI.runtime.onInstalled.addListener(this.onInstalled.bind(this));

    // 监听扩展启动
    browserAPI.runtime.onStartup.addListener(this.onStartup.bind(this));

    // 监听来自popup的消息
    browserAPI.runtime.onMessage.addListener(this.onMessage.bind(this));

    // 监听存储变化
    browserAPI.storage.onChanged.addListener(this.onStorageChanged.bind(this));
  }

  async onInstalled(details) {
    console.log('插件已安装:', details);
    
    if (details.reason === 'install') {
      // 首次安装，初始化默认配置
      await this.initializeDefaultConfig();
      
      // 打开设置页面
      browserAPI.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
      // 插件更新
      console.log('插件已更新到版本:', browserAPI.runtime.getManifest().version);
      await this.handleUpdate(details.previousVersion);
    }
  }

  async onStartup() {
    console.log('插件启动');
    await this.checkConfiguration();
  }

  async onMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'GET_PAGE_INFO':
          return await this.getPageInfo(sender.tab);
          
        case 'CHECK_CONFIGURATION':
          return await this.checkConfiguration();
          
        case 'TEST_API_CONNECTION':
          return await this.testApiConnection(message.config);
          
        case 'FEISHU_API_CALL':
          return await this.handleFeishuApiCall(message.config, message.endpoint, message.options);
          
        case 'OPEN_OPTIONS':
          browserAPI.runtime.openOptionsPage();
          return { success: true };
          
        default:
          console.warn('未知消息类型:', message.type);
          return { error: '未知消息类型' };
      }
    } catch (error) {
      console.error('处理消息失败:', error);
      return { error: error.message };
    }
  }

  async onStorageChanged(changes, areaName) {
    if (areaName === 'local' && changes.config) {
      console.log('配置已更新');
      await this.updateBadge();
    }
  }

  async initializeDefaultConfig() {
    const defaultConfig = {
      defaultTags: ['网页收藏', '知识管理', '技术文章', '学习资料', '工作参考'],
      autoFillDescription: true,
      enableNotifications: true,
      duplicateCheck: true,
      cacheEnabled: true,
      maxRetries: 3
    };

    await StorageManager.setConfig(defaultConfig);
    console.log('默认配置已初始化');
  }

  async handleUpdate(previousVersion) {
    // 处理版本更新逻辑
    const currentVersion = browserAPI.runtime.getManifest().version;
    console.log(`从版本 ${previousVersion} 更新到 ${currentVersion}`);
    
    // 可以在这里添加数据迁移逻辑
    await this.migrateData(previousVersion, currentVersion);
  }

  async migrateData(fromVersion, toVersion) {
    // 数据迁移逻辑
    console.log('执行数据迁移:', fromVersion, '->', toVersion);
  }

  async getPageInfo(tab) {
    if (!tab) {
      throw new Error('无法获取标签页信息');
    }

    try {
      // 获取页面选中文本
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            selectedText: window.getSelection().toString().trim(),
            metaDescription: document.querySelector('meta[name="description"]')?.content || '',
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            favicon: document.querySelector('link[rel="icon"]')?.href || 
                    document.querySelector('link[rel="shortcut icon"]')?.href || ''
          };
        }
      });

      const pageData = results[0]?.result || {};

      return {
        success: true,
        data: {
          url: tab.url,
          title: tab.title || '',
          favicon: tab.favIconUrl || pageData.favicon,
          selectedText: pageData.selectedText,
          description: pageData.metaDescription,
          keywords: pageData.keywords,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('获取页面信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkConfiguration() {
    try {
      const config = await StorageManager.getConfig();
      const isConfigured = !!(config.appId && config.appSecret && config.baseId && config.tableId);
      
      await this.updateBadge(isConfigured);
      
      return {
        success: true,
        configured: isConfigured,
        config: isConfigured ? config : null
      };
    } catch (error) {
      console.error('检查配置失败:', error);
      await this.updateBadge(false);
      return {
        success: false,
        configured: false,
        error: error.message
      };
    }
  }

  async testApiConnection(config) {
    try {
      const { FeishuAPI } = await import('./utils/api.js');
      const api = new FeishuAPI(config);
      
      // 测试获取访问令牌
      await api.getAccessToken();
      
      // 测试获取表格信息
      await api.getTableInfo();
      
      return {
        success: true,
        message: 'API连接测试成功'
      };
    } catch (error) {
      console.error('API连接测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateBadge(isConfigured = null) {
    if (isConfigured === null) {
      const result = await this.checkConfiguration();
      isConfigured = result.configured;
    }

    if (isConfigured) {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    } else {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    }
  }

  async handleFeishuApiCall(config, endpoint, options = {}) {
    try {
      console.log('Background处理飞书API调用:', endpoint);
      
      // 动态获取访问令牌
      let accessToken;
      if (config.appId && config.appSecret) {
        const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_id: config.appId,
            app_secret: config.appSecret
          })
        });
        
        const tokenData = await tokenResponse.json();
        console.log('Token获取响应:', tokenData);
        
        if (tokenData.code !== 0) {
          throw new Error(`获取访问令牌失败: ${tokenData.msg}`);
        }
        
        accessToken = tokenData.tenant_access_token;
        console.log('成功获取访问令牌，长度:', accessToken?.length);
      } else {
        throw new Error('缺少应用认证信息');
      }
      
      const defaultHeaders = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: { ...defaultHeaders, ...options.headers }
      };
      
      // 处理请求体
      if (options.body) {
        if (typeof options.body === 'object') {
          requestOptions.body = JSON.stringify(options.body);
        } else {
          requestOptions.body = options.body;
        }
      }
      
      console.log('API请求详情:', {
        url: `https://open.feishu.cn/open-apis${endpoint}`,
        method: requestOptions.method,
        headers: requestOptions.headers,
        bodyLength: requestOptions.body?.length
      });
      
      const response = await fetch(`https://open.feishu.cn/open-apis${endpoint}`, requestOptions);
      
      console.log('Background API响应状态:', response.status);
      
      const responseText = await response.text();
      console.log('Background API响应内容:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Background JSON解析失败:', parseError);
        return {
          success: false,
          error: `响应解析失败: ${responseText.substring(0, 200)}`
        };
      }
      
      return {
        success: true,
        data: responseData,
        status: response.status
      };
      
    } catch (error) {
      console.error('Background API调用失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 清理过期的缓存数据
  async cleanupExpiredData() {
    try {
      const history = await StorageManager.getHistory();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const filteredHistory = history.filter(item => 
        new Date(item.savedAt) > thirtyDaysAgo
      );
      
      if (filteredHistory.length !== history.length) {
        await StorageManager.setHistory(filteredHistory);
        console.log(`清理了 ${history.length - filteredHistory.length} 条过期记录`);
      }
    } catch (error) {
      console.error('清理过期数据失败:', error);
    }
  }
}

// 初始化后台服务
const backgroundService = new BackgroundService();

// 定期清理过期数据（每天一次）
chrome.alarms.create('cleanup', { delayInMinutes: 1, periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    backgroundService.cleanupExpiredData();
  }
});