// 配置设置脚本
// 这个脚本用于将飞书配置信息保存到插件的存储中

// 模拟Chrome扩展环境
const mockChrome = {
  storage: {
    local: {
      data: {},
      async set(items) {
        Object.assign(this.data, items);
        console.log('配置已保存:', items);
      },
      async get(keys) {
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (this.data[key] !== undefined) {
              result[key] = this.data[key];
            }
          });
          return result;
        }
        return this.data[keys] !== undefined ? { [keys]: this.data[keys] } : {};
      }
    }
  }
};

// 在测试环境中使用mock
if (typeof chrome === 'undefined') {
  global.chrome = mockChrome;
}

async function setupFeishuConfig() {
  console.log('开始设置飞书配置...');
  
  const config = {
    // 你提供的token信息
    tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4',
    appAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4', // 同上
    
    // 从URL解析的信息
    baseId: 'H5xQwaTxDiDE6SkUulZcRgOoneh', // app_token
    tableId: 'tblQWm4ttkQD7QH0', // table_id
    
    // 其他配置
    defaultTags: ['网页收藏', '知识管理'],
    autoFillDescription: true,
    enableNotifications: true,
    cacheEnabled: true,
    maxRetries: 3,
    
    // 字段映射（根据你的多维表格实际字段调整）
    fieldMapping: {
      title: '标题',
      url: '链接', 
      description: '描述',
      tags: '标签',
      savedAt: '收藏时间',
      selectedText: '选中文本',
      keywords: '关键词'
    }
  };

  try {
    // 保存配置
    await chrome.storage.local.set({ config });
    
    console.log('✅ 飞书配置设置成功!');
    console.log('配置详情:');
    console.log('- BaseId (app_token):', config.baseId);
    console.log('- TableId:', config.tableId);
    console.log('- Token状态: 已设置');
    console.log('- 字段映射:', config.fieldMapping);
    
    return config;
  } catch (error) {
    console.error('❌ 配置设置失败:', error);
    throw error;
  }
}

// 验证配置
async function verifyConfig() {
  console.log('\n验证配置...');
  
  try {
    const result = await chrome.storage.local.get(['config']);
    const config = result.config;
    
    if (!config) {
      throw new Error('配置未找到');
    }
    
    const requiredFields = ['tenantAccessToken', 'baseId', 'tableId'];
    const missing = requiredFields.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`缺少必需配置: ${missing.join(', ')}`);
    }
    
    console.log('✅ 配置验证通过');
    return true;
  } catch (error) {
    console.error('❌ 配置验证失败:', error);
    return false;
  }
}

// 如果直接运行此脚本
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  setupFeishuConfig()
    .then(() => verifyConfig())
    .catch(console.error);
}

export { setupFeishuConfig, verifyConfig };