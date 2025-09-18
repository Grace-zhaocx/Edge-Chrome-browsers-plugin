// 存储管理工具类
import { browserAPI } from './browser-compat.js';

export class StorageManager {
  // 获取配置
  static async getConfig() {
    try {
      const result = await browserAPI.storage.local.get(['config']);
      return result.config || {};
    } catch (error) {
      console.error('获取配置失败:', error);
      return {};
    }
  }

  // 设置配置
  static async setConfig(config) {
    try {
      await browserAPI.storage.local.set({ config });
      console.log('配置已保存');
    } catch (error) {
      console.error('保存配置失败:', error);
      throw new Error('保存配置失败: ' + error.message);
    }
  }

  // 更新部分配置
  static async updateConfig(updates) {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...updates };
      await this.setConfig(newConfig);
      return newConfig;
    } catch (error) {
      console.error('更新配置失败:', error);
      throw new Error('更新配置失败: ' + error.message);
    }
  }

  // 获取历史记录
  static async getHistory(limit = 100) {
    try {
      const result = await browserAPI.storage.local.get(['history']);
      const history = result.history || [];
      
      // 按时间倒序排列，返回最新的记录
      return history
        .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
        .slice(0, limit);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  // 添加历史记录
  static async addToHistory(item) {
    try {
      const history = await this.getHistory(500); // 获取最近500条
      
      // 检查是否已存在相同URL的记录
      const existingIndex = history.findIndex(h => h.url === item.url);
      
      if (existingIndex >= 0) {
        // 更新现有记录
        history[existingIndex] = { ...history[existingIndex], ...item };
      } else {
        // 添加新记录到开头
        history.unshift(item);
      }
      
      // 限制历史记录数量（最多保存500条）
      const limitedHistory = history.slice(0, 500);
      
      await browserAPI.storage.local.set({ history: limitedHistory });
      console.log('历史记录已更新');
    } catch (error) {
      console.error('添加历史记录失败:', error);
      throw new Error('保存历史记录失败: ' + error.message);
    }
  }

  // 设置历史记录
  static async setHistory(history) {
    try {
      await browserAPI.storage.local.set({ history });
    } catch (error) {
      console.error('设置历史记录失败:', error);
      throw new Error('设置历史记录失败: ' + error.message);
    }
  }

  // 清空历史记录
  static async clearHistory() {
    try {
      await browserAPI.storage.local.set({ history: [] });
      console.log('历史记录已清空');
    } catch (error) {
      console.error('清空历史记录失败:', error);
      throw new Error('清空历史记录失败: ' + error.message);
    }
  }

  // 获取缓存数据
  static async getCache(key) {
    try {
      const result = await browserAPI.storage.local.get([`cache_${key}`]);
      const cached = result[`cache_${key}`];
      
      if (!cached) return null;
      
      // 检查是否过期
      if (Date.now() > cached.expiry) {
        await this.removeCache(key);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  // 设置缓存数据
  static async setCache(key, data, ttl = 3600000) { // 默认1小时
    try {
      const cached = {
        data,
        expiry: Date.now() + ttl,
        created: Date.now()
      };
      
      await browserAPI.storage.local.set({ [`cache_${key}`]: cached });
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  }

  // 删除缓存
  static async removeCache(key) {
    try {
      await browserAPI.storage.local.remove([`cache_${key}`]);
    } catch (error) {
      console.error('删除缓存失败:', error);
    }
  }

  // 清空所有缓存
  static async clearCache() {
    try {
      const result = await browserAPI.storage.local.get(null);
      const cacheKeys = Object.keys(result).filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length > 0) {
        await browserAPI.storage.local.remove(cacheKeys);
        console.log(`已清空 ${cacheKeys.length} 个缓存项`);
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  // 获取用户偏好设置
  static async getPreferences() {
    try {
      const result = await browserAPI.storage.sync.get(['preferences']);
      return result.preferences || {
        theme: 'light',
        language: 'zh-CN',
        notifications: true,
        autoFill: true,
        quickSave: false,
        defaultTags: []
      };
    } catch (error) {
      console.error('获取偏好设置失败:', error);
      return {};
    }
  }

  // 设置用户偏好
  static async setPreferences(preferences) {
    try {
      await browserAPI.storage.sync.set({ preferences });
      console.log('偏好设置已保存');
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      throw new Error('保存偏好设置失败: ' + error.message);
    }
  }

  // 获取统计信息
  static async getStats() {
    try {
      const result = await browserAPI.storage.local.get(['stats']);
      return result.stats || {
        totalBookmarks: 0,
        todayBookmarks: 0,
        lastBookmarkDate: null,
        mostUsedTags: {},
        successRate: 100
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {};
    }
  }

  // 更新统计信息
  static async updateStats(action = 'bookmark', success = true) {
    try {
      const stats = await this.getStats();
      const today = new Date().toDateString();
      const lastDate = stats.lastBookmarkDate;
      
      if (action === 'bookmark') {
        stats.totalBookmarks++;
        
        // 重置今日计数（如果是新的一天）
        if (lastDate !== today) {
          stats.todayBookmarks = 1;
        } else {
          stats.todayBookmarks++;
        }
        
        stats.lastBookmarkDate = today;
      }
      
      // 更新成功率
      const total = stats.totalAttempts || stats.totalBookmarks;
      const successful = stats.successfulAttempts || stats.totalBookmarks;
      
      if (success) {
        stats.successfulAttempts = successful + 1;
      }
      stats.totalAttempts = total + 1;
      stats.successRate = Math.round((stats.successfulAttempts / stats.totalAttempts) * 100);
      
      await browserAPI.storage.local.set({ stats });
    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  }

  // 导出数据
  static async exportData() {
    try {
      const [config, history, preferences, stats] = await Promise.all([
        this.getConfig(),
        this.getHistory(),
        this.getPreferences(),
        this.getStats()
      ]);
      
      const exportData = {
        version: browserAPI.runtime.getManifest().version,
        exportDate: new Date().toISOString(),
        config: { ...config, appSecret: '***' }, // 隐藏敏感信息
        history,
        preferences,
        stats
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出数据失败:', error);
      throw new Error('导出数据失败: ' + error.message);
    }
  }

  // 导入数据
  static async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.version || !data.exportDate) {
        throw new Error('无效的导入数据格式');
      }
      
      // 备份当前数据
      const backup = await this.exportData();
      await browserAPI.storage.local.set({ 
        backup: {
          data: backup,
          date: new Date().toISOString()
        }
      });
      
      // 导入新数据（跳过配置中的敏感信息）
      if (data.history) {
        await this.setHistory(data.history);
      }
      
      if (data.preferences) {
        await this.setPreferences(data.preferences);
      }
      
      if (data.stats) {
        await browserAPI.storage.local.set({ stats: data.stats });
      }
      
      console.log('数据导入成功');
    } catch (error) {
      console.error('导入数据失败:', error);
      throw new Error('导入数据失败: ' + error.message);
    }
  }

  // 获取存储使用情况
  static async getStorageUsage() {
    try {
      const usage = await browserAPI.storage.local.getBytesInUse();
      const quota = browserAPI.storage.local.QUOTA_BYTES || 5242880; // 5MB
      
      return {
        used: usage,
        total: quota,
        percentage: Math.round((usage / quota) * 100),
        available: quota - usage
      };
    } catch (error) {
      console.error('获取存储使用情况失败:', error);
      return { used: 0, total: 0, percentage: 0, available: 0 };
    }
  }

  // 清理存储空间
  static async cleanupStorage() {
    try {
      console.log('开始清理存储空间...');
      
      // 清理过期缓存
      await this.clearCache();
      
      // 限制历史记录数量
      const history = await this.getHistory();
      if (history.length > 300) {
        const trimmedHistory = history.slice(0, 300);
        await this.setHistory(trimmedHistory);
        console.log(`历史记录已从 ${history.length} 条减少到 300 条`);
      }
      
      // 删除备份（如果存在且超过7天）
      const result = await browserAPI.storage.local.get(['backup']);
      if (result.backup) {
        const backupDate = new Date(result.backup.date);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (backupDate < sevenDaysAgo) {
          await browserAPI.storage.local.remove(['backup']);
          console.log('已删除过期备份');
        }
      }
      
      console.log('存储空间清理完成');
    } catch (error) {
      console.error('清理存储空间失败:', error);
    }
  }
}

// 监听存储变化的工具函数
export function onStorageChanged(callback) {
  browserAPI.storage.onChanged.addListener((changes, areaName) => {
    callback(changes, areaName);
  });
}

// 工具函数：格式化存储大小
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}