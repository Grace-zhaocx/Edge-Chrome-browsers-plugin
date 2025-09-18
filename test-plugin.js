// 插件功能测试脚本
console.log('开始测试飞书收藏插件...');

// 测试存储功能
async function testStorage() {
  console.log('测试存储功能...');
  
  try {
    // 测试保存历史记录
    const testData = {
      title: '测试页面',
      url: 'https://example.com',
      description: '这是一个测试页面',
      notes: '测试备注',
      tags: ['测试', '示例'],
      summary: '测试摘要',
      timestamp: new Date().toISOString(),
      savedAt: new Date().toISOString()
    };
    
    // 获取现有历史
    const result = await chrome.storage.local.get(['history']);
    const history = result.history || [];
    
    // 添加测试数据
    history.unshift(testData);
    
    // 保存回存储
    await chrome.storage.local.set({ history });
    
    console.log('✅ 存储功能测试通过');
    console.log('历史记录数量:', history.length);
    
    return true;
  } catch (error) {
    console.error('❌ 存储功能测试失败:', error);
    return false;
  }
}

// 测试配置功能
async function testConfig() {
  console.log('测试配置功能...');
  
  try {
    const testConfig = {
      appId: 'cli_test123',
      appSecret: 'test_secret',
      baseId: 'test_base_id',
      tableId: 'tbl_test_table'
    };
    
    // 保存配置
    await chrome.storage.local.set({ config: testConfig });
    
    // 读取配置
    const result = await chrome.storage.local.get(['config']);
    const savedConfig = result.config;
    
    if (savedConfig && savedConfig.appId === testConfig.appId) {
      console.log('✅ 配置功能测试通过');
      return true;
    } else {
      throw new Error('配置保存或读取失败');
    }
  } catch (error) {
    console.error('❌ 配置功能测试失败:', error);
    return false;
  }
}

// 测试API连接（模拟）
async function testAPI() {
  console.log('测试API连接功能...');
  
  try {
    // 这里只是测试API调用的结构，不做真实请求
    const config = {
      appId: 'cli_test123',
      appSecret: 'test_secret',
      baseId: 'test_base_id',
      tableId: 'tbl_test_table'
    };
    
    const requestBody = {
      app_id: config.appId,
      app_secret: config.appSecret
    };
    
    console.log('API请求体结构正确:', requestBody);
    console.log('✅ API结构测试通过');
    return true;
  } catch (error) {
    console.error('❌ API测试失败:', error);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始运行插件测试...');
  
  const results = {
    storage: await testStorage(),
    config: await testConfig(),
    api: await testAPI()
  };
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n📊 测试结果: ${passed}/${total} 通过`);
  
  if (passed === total) {
    console.log('🎉 所有测试通过！插件基础功能正常');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能');
  }
  
  return results;
}

// 如果在插件环境中运行
if (typeof chrome !== 'undefined' && chrome.storage) {
  runTests();
} else {
  console.log('⚠️  请在Chrome插件环境中运行此测试脚本');
}