// 工具函数集合

// DOM操作工具
export class DOMUtils {
  // 创建元素
  static createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'dataset') {
        Object.keys(attributes[key]).forEach(dataKey => {
          element.dataset[dataKey] = attributes[key][dataKey];
        });
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }

  // 显示/隐藏元素
  static show(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.style.display = 'block';
    }
  }

  static hide(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.style.display = 'none';
    }
  }

  // 切换元素显示状态
  static toggle(element) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
  }

  // 添加/移除CSS类
  static addClass(element, className) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.classList.add(className);
    }
  }

  static removeClass(element, className) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    if (element) {
      element.classList.remove(className);
    }
  }

  // 设置加载状态
  static setLoading(button, isLoading = true) {
    if (typeof button === 'string') {
      button = document.getElementById(button);
    }
    
    if (!button) return;

    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.btn-spinner');
    
    if (isLoading) {
      button.disabled = true;
      if (text) text.style.display = 'none';
      if (spinner) spinner.style.display = 'inline-block';
    } else {
      button.disabled = false;
      if (text) text.style.display = 'inline';
      if (spinner) spinner.style.display = 'none';
    }
  }
}

// 数据验证工具
export class ValidationUtils {
  // 验证URL
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // 验证邮箱
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证字符串长度
  static isValidLength(str, minLength = 0, maxLength = Infinity) {
    if (typeof str !== 'string') return false;
    return str.length >= minLength && str.length <= maxLength;
  }

  // 验证必填字段
  static validateRequired(fields) {
    const errors = {};
    
    Object.keys(fields).forEach(key => {
      const value = fields[key];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[key] = '此字段不能为空';
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // 验证飞书配置
  static validateFeishuConfig(config) {
    const errors = {};
    
    // 检查是否有有效的认证方式
    const hasAppCredentials = config.appId && config.appSecret;
    const hasDirectToken = config.tenantAccessToken;
    
    if (!hasAppCredentials && !hasDirectToken) {
      // 如果两种认证方式都没有，则要求填写App ID和Secret
      if (!config.appId || config.appId.trim() === '') {
        errors.appId = '应用ID不能为空';
      }
      if (!config.appSecret || config.appSecret.trim() === '') {
        errors.appSecret = '应用密钥不能为空';
      }
    }
    
    // 基础必需字段
    if (!config.baseId || config.baseId.trim() === '') {
      errors.baseId = '多维表格ID不能为空';
    }
    if (!config.tableId || config.tableId.trim() === '') {
      errors.tableId = '数据表ID不能为空';
    }

    // 验证ID格式
    if (config.appId && !config.appId.startsWith('cli_')) {
      errors.appId = '应用ID格式错误，应以"cli_"开头';
    }

    if (config.baseId && config.baseId.length < 10) {
      errors.baseId = '多维表格ID格式错误';
    }

    if (config.tableId && !config.tableId.startsWith('tbl')) {
      errors.tableId = '数据表ID格式错误，应以"tbl"开头';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// 时间处理工具
export class TimeUtils {
  // 格式化日期
  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  // 相对时间
  static getRelativeTime(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  }

  // 获取今天的开始时间
  static getTodayStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // 获取本周的开始时间
  static getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 周一开始
    return new Date(now.setDate(diff));
  }
}

// 字符串处理工具
export class StringUtils {
  // 截断文本
  static truncate(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    return text.substring(0, maxLength) + suffix;
  }

  // 清理文本（移除多余空白）
  static cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // 提取域名
  static extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (_) {
      return '';
    }
  }

  // 生成随机字符串
  static generateRandomId(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 高亮搜索关键词
  static highlightKeywords(text, keywords) {
    if (!text || !keywords) return text;
    
    const regex = new RegExp(`(${keywords.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // 将HTML转换为纯文本
  static htmlToText(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}

// 消息提示工具
export class MessageUtils {
  // 显示成功消息
  static showSuccess(message, duration = 3000, isHtml = false) {
    this.showMessage(message, 'success', duration, isHtml);
  }

  // 显示错误消息
  static showError(message, duration = 5000) {
    this.showMessage(message, 'error', duration);
  }

  // 显示警告消息
  static showWarning(message, duration = 4000) {
    this.showMessage(message, 'warning', duration);
  }

  // 显示信息消息
  static showInfo(message, duration = 3000) {
    this.showMessage(message, 'info', duration);
  }

  // 通用消息显示
  static showMessage(message, type = 'info', duration = 3000, isHtml = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    if (isHtml) {
      messageEl.innerHTML = message;
    } else {
      messageEl.textContent = message;
    }
    
    // 样式
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    // 根据类型设置背景颜色
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
    }, duration);
  }
}

// 数组工具
export class ArrayUtils {
  // 数组去重
  static unique(array, key = null) {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const val = item[key];
        if (seen.has(val)) {
          return false;
        }
        seen.add(val);
        return true;
      });
    }
    return [...new Set(array)];
  }

  // 数组分组
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  // 数组排序
  static sortBy(array, key, order = 'asc') {
    return array.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (order === 'desc') {
        return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
  }

  // 数组分页
  static paginate(array, page, pageSize) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      data: array.slice(startIndex, endIndex),
      total: array.length,
      page,
      pageSize,
      totalPages: Math.ceil(array.length / pageSize)
    };
  }
}

// 异步工具
export class AsyncUtils {
  // 延迟执行
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 重试执行
  static async retry(fn, maxAttempts = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxAttempts - 1) {
          await this.delay(delay * (i + 1)); // 递增延迟
        }
      }
    }
    
    throw lastError;
  }

  // 并发限制
  static async concurrency(tasks, limit = 3) {
    const results = [];
    const executing = [];
    
    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });
      
      results.push(promise);
      executing.push(promise);
      
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
    
    return Promise.all(results);
  }
}

// 导出便捷函数（向后兼容）
export const showLoading = () => DOMUtils.show('loading');
export const hideLoading = () => DOMUtils.hide('loading');
export const showError = (message) => MessageUtils.showError(message);
export const showSuccess = (message) => MessageUtils.showSuccess(message);
export const showWarning = (message) => MessageUtils.showWarning(message);