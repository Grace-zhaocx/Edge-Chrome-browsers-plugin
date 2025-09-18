// 使用新的app_token测试配置
// 在Chrome扩展popup页面控制台中运行

async function testNewConfig() {
  console.clear();
  console.log('🔄 使用新的app_token测试配置...');
  
  // 使用新的正确的app_token
  const config = {
    tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4',
    baseId: 'U2GobH43xaSwFlsN92ZcgDF6nYe', // 新的正确的app_token
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
    // 1. 保存新配置
    console.log('1️⃣ 保存新配置...');
    await chrome.storage.local.set({ config });
    console.log('✅ 新配置已保存');
    
    // 2. 测试获取表格信息
    console.log('2️⃣ 测试获取表格信息...');
    const tableResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.tenantAccessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('HTTP状态:', tableResponse.status);
    const tableText = await tableResponse.text();
    console.log('响应内容:', tableText);
    
    if (tableResponse.status === 200) {
      const tableData = JSON.parse(tableText);
      
      if (tableData.code === 0) {
        console.log('✅ 表格信息获取成功!');
        console.log('表格名称:', tableData.data?.table?.name);
        console.log('表格ID:', tableData.data?.table?.table_id);
        
        // 3. 测试获取字段信息
        console.log('\n3️⃣ 测试获取字段信息...');
        const fieldsResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/fields`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.tenantAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const fieldsText = await fieldsResponse.text();
        const fieldsData = JSON.parse(fieldsText);
        
        if (fieldsData.code === 0) {
          console.log('✅ 字段信息获取成功!');
          console.log(`共 ${fieldsData.data?.items?.length || 0} 个字段:`);
          
          fieldsData.data?.items?.forEach((field, index) => {
            console.log(`  ${index + 1}. ${field.field_name} (${field.type})`);
          });
          
          // 4. 测试创建记录
          console.log('\n4️⃣ 测试创建记录...');
          const testRecord = {
            fields: {
              '标题': '新配置测试记录 - ' + new Date().toLocaleString(),
              '链接': 'https://example.com/new-config-test-' + Date.now(),
              '描述': '使用新app_token创建的测试记录',
              '标签': ['新配置', '测试成功'],
              '收藏时间': Date.now()
            }
          };
          
          const createResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.tenantAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testRecord)
          });
          
          const createText = await createResponse.text();
          console.log('创建记录响应:', createText);
          
          if (createResponse.status === 200) {
            const createData = JSON.parse(createText);
            if (createData.code === 0) {
              console.log('🎉 测试记录创建成功!');
              console.log('记录ID:', createData.data?.record?.record_id);
              
              alert('🎉 飞书API配置成功!\n\n✅ 连接正常\n✅ 字段识别成功\n✅ 记录创建成功\n\n现在可以正常使用插件了!');
              return true;
            }
          }
        }
      } else {
        console.log('❌ API返回错误:', tableData.code, tableData.msg);
      }
    } else {
      console.log('❌ HTTP请求失败:', tableResponse.status);
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error);
    alert('❌ 配置测试失败: ' + error.message);
  }
  
  return false;
}

console.log('🚀 新配置测试脚本已加载');
console.log('运行 testNewConfig() 开始测试');

// 导出到全局
if (typeof window !== 'undefined') {
  window.testNewConfig = testNewConfig;
}