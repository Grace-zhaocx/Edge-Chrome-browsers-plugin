// 调试API的简单脚本
// 在Chrome扩展的popup页面控制台中运行

async function debugFeishuAPI() {
  console.clear();
  console.log('🔍 开始调试飞书API...');
  
  const config = {
    token: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4',
    baseId: 'H5xQwaTxDiDE6SkUulZcRgOoneh',
    tableId: 'tblQWm4ttkQD7QH0'
  };
  
  console.log('配置信息:', config);
  
  try {
    // 步骤1: 测试基础连接
    console.log('\n📡 步骤1: 测试API基础连接...');
    
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}`;
    console.log('请求URL:', url);
    
    const headers = {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    };
    console.log('请求头:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log('HTTP状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    // 步骤2: 检查响应内容
    console.log('\n📄 步骤2: 检查响应内容...');
    
    const rawText = await response.text();
    console.log('原始响应长度:', rawText.length);
    console.log('原始响应前100字符:', rawText.substring(0, 100));
    console.log('原始响应类型:', typeof rawText);
    
    // 步骤3: 尝试解析JSON
    console.log('\n🔧 步骤3: 解析JSON...');
    
    if (!rawText.trim()) {
      throw new Error('响应为空');
    }
    
    let jsonData;
    try {
      jsonData = JSON.parse(rawText);
      console.log('✅ JSON解析成功');
      console.log('解析后的数据:', jsonData);
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError.message);
      console.error('错误位置:', parseError.message);
      
      // 尝试找出问题
      console.log('响应的每个字符:');
      for (let i = 0; i < Math.min(rawText.length, 20); i++) {
        const char = rawText[i];
        const code = rawText.charCodeAt(i);
        console.log(`位置${i}: "${char}" (ASCII: ${code})`);
      }
      
      throw parseError;
    }
    
    // 步骤4: 检查API响应
    console.log('\n✅ 步骤4: 检查API响应结果...');
    
    if (jsonData.code === 0) {
      console.log('🎉 API调用成功!');
      console.log('表格名称:', jsonData.data?.table?.name || '未知');
      console.log('表格ID:', jsonData.data?.table?.table_id);
      return true;
    } else {
      console.log('❌ API返回错误:');
      console.log('错误代码:', jsonData.code);
      console.log('错误信息:', jsonData.msg);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
    console.error('错误堆栈:', error.stack);
    return false;
  }
}

// 简单的配置设置函数
async function setConfig() {
  const config = {
    tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4',
    baseId: 'H5xQwaTxDiDE6SkUulZcRgOoneh',
    tableId: 'tblQWm4ttkQD7QH0',
    fieldMapping: {
      title: '标题',
      url: '链接',
      description: '描述',
      tags: '标签',
      savedAt: '收藏时间'
    }
  };
  
  try {
    await chrome.storage.local.set({ config });
    console.log('✅ 配置已保存');
    return true;
  } catch (error) {
    console.error('❌ 配置保存失败:', error);
    return false;
  }
}

// 使用说明
console.log(`
🚀 飞书API调试工具已加载

使用方法:
1. 运行 setConfig() 来设置配置
2. 运行 debugFeishuAPI() 来调试API连接

示例:
await setConfig();
await debugFeishuAPI();
`);

// 导出函数到全局作用域（在浏览器环境中）
if (typeof window !== 'undefined') {
  window.debugFeishuAPI = debugFeishuAPI;
  window.setConfig = setConfig;
}