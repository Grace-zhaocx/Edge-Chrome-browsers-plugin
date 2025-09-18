// 详细的调试脚本 - 在Chrome扩展popup控制台中运行
// 这个脚本会逐步检查每个环节，帮助找出问题所在

async function detailedDebug() {
  console.clear();
  console.log('🔍 开始详细调试...');
  console.log('时间:', new Date().toLocaleString());
  
  try {
    // 步骤1: 检查Chrome扩展API可用性
    console.log('\n📋 步骤1: 检查扩展环境...');
    console.log('chrome对象:', typeof chrome);
    console.log('chrome.storage:', typeof chrome?.storage);
    console.log('chrome.storage.local:', typeof chrome?.storage?.local);
    
    // 步骤2: 配置信息
    console.log('\n⚙️ 步骤2: 准备配置...');
    const config = {
      tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4',
      baseId: 'U2GobH43xaSwFlsN92ZcgDF6nYe',
      tableId: 'tblQWm4ttkQD7QH0'
    };
    
    console.log('配置信息:');
    console.log('- Token长度:', config.tenantAccessToken.length);
    console.log('- BaseId:', config.baseId);
    console.log('- TableId:', config.tableId);
    
    // 步骤3: 保存配置
    console.log('\n💾 步骤3: 保存配置到扩展存储...');
    try {
      await chrome.storage.local.set({ config });
      console.log('✅ 配置保存成功');
    } catch (storageError) {
      console.error('❌ 配置保存失败:', storageError);
      throw storageError;
    }
    
    // 步骤4: 验证配置保存
    console.log('\n🔍 步骤4: 验证配置是否正确保存...');
    try {
      const saved = await chrome.storage.local.get(['config']);
      console.log('保存的配置:', saved.config);
      
      if (!saved.config) {
        throw new Error('配置未保存成功');
      }
    } catch (verifyError) {
      console.error('❌ 配置验证失败:', verifyError);
      throw verifyError;
    }
    
    // 步骤5: 构造API请求URL
    console.log('\n🔗 步骤5: 构造API请求...');
    const apiUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}`;
    console.log('API URL:', apiUrl);
    
    const headers = {
      'Authorization': `Bearer ${config.tenantAccessToken}`,
      'Content-Type': 'application/json'
    };
    console.log('请求头:', headers);
    
    // 步骤6: 发送API请求
    console.log('\n📡 步骤6: 发送API请求...');
    console.log('开始请求时间:', new Date().toLocaleTimeString());
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });
    } catch (fetchError) {
      console.error('❌ Fetch请求失败:', fetchError);
      console.error('错误类型:', fetchError.name);
      console.error('错误消息:', fetchError.message);
      throw fetchError;
    }
    
    console.log('请求完成时间:', new Date().toLocaleTimeString());
    console.log('HTTP状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('响应类型:', response.type);
    console.log('响应OK:', response.ok);
    
    // 步骤7: 检查响应头
    console.log('\n📄 步骤7: 检查响应头...');
    const responseHeaders = {};
    for (let [key, value] of response.headers.entries()) {
      responseHeaders[key] = value;
    }
    console.log('响应头:', responseHeaders);
    
    // 步骤8: 读取响应内容
    console.log('\n📖 步骤8: 读取响应内容...');
    let responseText;
    try {
      responseText = await response.text();
    } catch (textError) {
      console.error('❌ 读取响应文本失败:', textError);
      throw textError;
    }
    
    console.log('响应文本长度:', responseText.length);
    console.log('响应文本类型:', typeof responseText);
    console.log('响应文本前200字符:', responseText.substring(0, 200));
    
    // 步骤9: 分析响应内容
    console.log('\n🔍 步骤9: 分析响应内容...');
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('响应为空');
    }
    
    // 检查是否是HTML错误页面
    if (responseText.trim().startsWith('<')) {
      console.error('❌ 响应是HTML页面，可能是错误页面');
      console.log('HTML内容:', responseText.substring(0, 500));
      throw new Error('API返回了HTML页面而不是JSON');
    }
    
    // 检查响应的第一个字符
    const firstChar = responseText.charAt(0);
    console.log('第一个字符:', firstChar, '(ASCII:', responseText.charCodeAt(0), ')');
    
    if (firstChar !== '{' && firstChar !== '[') {
      console.error('❌ 响应不是有效的JSON格式');
      console.log('前20个字符的ASCII码:');
      for (let i = 0; i < Math.min(20, responseText.length); i++) {
        console.log(`位置${i}: "${responseText[i]}" (ASCII: ${responseText.charCodeAt(i)})`);
      }
      throw new Error('响应不是JSON格式');
    }
    
    // 步骤10: 解析JSON
    console.log('\n🔧 步骤10: 解析JSON...');
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError);
      console.error('解析错误位置:', parseError.message);
      
      // 尝试找出问题字符
      const errorMatch = parseError.message.match(/position (\d+)/);
      if (errorMatch) {
        const position = parseInt(errorMatch[1]);
        console.log(`错误位置 ${position} 附近的字符:`);
        const start = Math.max(0, position - 10);
        const end = Math.min(responseText.length, position + 10);
        console.log(`"${responseText.substring(start, end)}"`);
      }
      
      throw parseError;
    }
    
    console.log('✅ JSON解析成功');
    console.log('解析后的数据:', jsonData);
    
    // 步骤11: 检查API响应
    console.log('\n✅ 步骤11: 检查API响应结果...');
    
    if (jsonData.code === 0) {
      console.log('🎉 API调用成功!');
      console.log('表格信息:', jsonData.data);
      
      if (jsonData.data?.table) {
        console.log('表格名称:', jsonData.data.table.name);
        console.log('表格ID:', jsonData.data.table.table_id);
      }
      
      alert('🎉 调试成功!\n\nAPI连接正常，可以正常使用插件了！');
      return true;
    } else {
      console.log('❌ API返回错误:');
      console.log('错误代码:', jsonData.code);
      console.log('错误信息:', jsonData.msg);
      alert(`❌ API错误: ${jsonData.msg}\n错误代码: ${jsonData.code}`);
      return false;
    }
    
  } catch (error) {
    console.error('\n💥 调试过程中出现错误:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    alert(`❌ 调试失败:\n${error.message}\n\n请查看控制台获取详细信息`);
    return false;
  }
}

// 快速测试函数
async function quickTest() {
  try {
    const result = await detailedDebug();
    console.log('\n🏁 调试完成，结果:', result ? '成功' : '失败');
  } catch (error) {
    console.error('快速测试失败:', error);
  }
}

console.log(`
🚀 详细调试脚本已加载

使用方法:
- 运行 detailedDebug() 进行详细调试
- 运行 quickTest() 快速测试

建议运行: quickTest()
`);

// 导出到全局
if (typeof window !== 'undefined') {
  window.detailedDebug = detailedDebug;
  window.quickTest = quickTest;
}