// 飞书API封装类
export class FeishuAPI {
  constructor(config) {
    this.config = config;
    this.baseURL = 'https://open.feishu.cn/open-apis';
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // 如果直接提供了token，则使用提供的token
    if (config.tenantAccessToken) {
      this.accessToken = config.tenantAccessToken;
      this.tokenExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2小时后过期
    }
  }

  // 获取访问令牌
  async getAccessToken() {
    // 检查现有token是否有效
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // 如果直接提供了token，直接返回
    if (this.config.tenantAccessToken) {
      this.accessToken = this.config.tenantAccessToken;
      this.tokenExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2小时后过期
      return this.accessToken;
    }

    try {
      const tryFetch = async (path) => {
        const res = await fetch(`${this.baseURL}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_id: this.config.appId,
            app_secret: this.config.appSecret
          })
        });
        return res.json();
      };

      // 先尝试 internal（企业自建应用），失败再回退通用路径
      let data = await tryFetch('/auth/v3/tenant_access_token/internal');
      if (data.code !== 0) {
        data = await tryFetch('/auth/v3/tenant_access_token/');
      }

      if (data.code !== 0) {
        throw new Error(data.msg || '获取访问令牌失败');
      }

      this.accessToken = data.tenant_access_token;
      this.tokenExpiry = Date.now() + (data.expire - 300) * 1000;
      return this.accessToken;
    } catch (error) {
      console.error('获取访问令牌失败:', error);
      throw new Error('API认证失败: ' + error.message);
    }
  }

  // 通用API请求方法
  async request(endpoint, options = {}) {
    const token = await this.getAccessToken();
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...defaultOptions,
      ...options
    });

    const data = await response.json();
    
    if (data.code !== 0) {
      const errorMessage = this.getErrorMessage(data.code, data.msg);
      throw new Error(errorMessage);
    }

    return data.data;
  }

  // 获取表格信息
  async getTableInfo() {
    try {
      const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}`;
      const data = await this.request(endpoint);
      return data.table;
    } catch (error) {
      console.error('获取表格信息失败:', error);
      throw new Error('获取表格信息失败: ' + error.message);
    }
  }

  // 获取表格字段信息
  async getTableFields() {
    try {
      const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}/fields`;
      const data = await this.request(endpoint);
      return data.items;
    } catch (error) {
      console.error('获取表格字段失败:', error);
      throw new Error('获取表格字段失败: ' + error.message);
    }
  }

  // 创建记录
  async createRecord(record) {
    try {
      const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}/records`;
      
      const requestBody = {
        fields: this.formatRecord(record)
      };

      const data = await this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return data.record;
    } catch (error) {
      console.error('创建记录失败:', error);
      throw new Error('保存失败: ' + error.message);
    }
  }

  // 批量创建记录
  async createRecords(records) {
    try {
      const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}/records/batch_create`;
      
      const requestBody = {
        records: records.map(record => ({
          fields: this.formatRecord(record)
        }))
      };

      const data = await this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return data.records;
    } catch (error) {
      console.error('批量创建记录失败:', error);
      throw new Error('批量保存失败: ' + error.message);
    }
  }

  // 更新记录
  async updateRecord(recordId, record) {
    try {
      const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}/records/${recordId}`;
      
      const requestBody = {
        fields: this.formatRecord(record)
      };

      const data = await this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      return data.record;
    } catch (error) {
      console.error('更新记录失败:', error);
      throw new Error('更新失败: ' + error.message);
    }
  }

  // 查询记录
  async searchRecords(fieldName, value, operator = 'is') {
    try {
      const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}/records/search`;
      
      const requestBody = {
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: fieldName,
              operator: operator,
              value: [value]
            }
          ]
        }
      };

      const data = await this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return data.items;
    } catch (error) {
      console.error('查询记录失败:', error);
      throw new Error('查询失败: ' + error.message);
    }
  }

  // 获取所有记录（分页）
  async getAllRecords(pageSize = 100) {
    try {
      let allRecords = [];
      let pageToken = null;
      
      do {
        const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}/records`;
        const params = new URLSearchParams({
          page_size: pageSize.toString()
        });
        
        if (pageToken) {
          params.append('page_token', pageToken);
        }

        const data = await this.request(`${endpoint}?${params}`);
        
        allRecords = allRecords.concat(data.items);
        pageToken = data.page_token;
        
      } while (pageToken);

      return allRecords;
    } catch (error) {
      console.error('获取记录失败:', error);
      throw new Error('获取记录失败: ' + error.message);
    }
  }

  // 删除记录
  async deleteRecord(recordId) {
    try {
      const endpoint = `/bitable/v1/apps/${this.config.baseId}/tables/${this.config.tableId}/records/${recordId}`;
      
      await this.request(endpoint, {
        method: 'DELETE'
      });

      return true;
    } catch (error) {
      console.error('删除记录失败:', error);
      throw new Error('删除失败: ' + error.message);
    }
  }

  // 格式化记录数据
  formatRecord(record) {
    const formatted = {};
    
    Object.keys(record).forEach(key => {
      const value = record[key];
      
      if (value === null || value === undefined || value === '') {
        return; // 跳过空值
      }
      
      // 处理不同类型的字段
      if (Array.isArray(value)) {
        // 多选字段
        formatted[key] = value;
      } else if (typeof value === 'string' && this.isValidDate(value)) {
        // 日期时间字段
        formatted[key] = new Date(value).getTime();
      } else {
        // 文本字段
        formatted[key] = value.toString();
      }
    });
    
    return formatted;
  }

  // 检查是否为有效日期字符串
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // 获取错误消息
  getErrorMessage(code, msg) {
    const errorMap = {
      1001: '无效的App ID',
      1002: '无效的App Secret',
      1003: '访问令牌过期',
      1004: '权限不足',
      1005: '请求频次超限',
      1006: '表格不存在',
      1007: '记录不存在',
      1008: '字段不存在',
      1009: '数据格式错误',
      1010: '网络连接失败'
    };
    
    return errorMap[code] || msg || '未知错误';
  }

  // 重试机制包装器
  async withRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`操作失败，第 ${i + 1} 次重试:`, error.message);
        
        if (i < maxRetries - 1) {
          // 指数退避延迟
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  }
}

// 工具函数：验证配置
export function validateConfig(config) {
  const required = ['appId', 'appSecret', 'baseId', 'tableId'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必需配置: ${missing.join(', ')}`);
  }
  
  return true;
}