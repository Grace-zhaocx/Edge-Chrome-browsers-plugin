// 验证飞书Token的脚本
// 在Chrome扩展popup的控制台中运行

async function verifyToken() {
  console.clear();
  console.log('🔑 开始验证飞书Token...');
  
  const token = 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4';
  
  try {
    // 1. 测试token基础有效性 - 调用用户信息接口
    console.log('1️⃣ 测试token基础有效性...');
    
    const userInfoResponse = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('用户信息接口状态:', userInfoResponse.status);
    const userInfoText = await userInfoResponse.text();
    console.log('用户信息响应:', userInfoText);
    
    // 2. 测试应用信息接口
    console.log('\n2️⃣ 测试应用信息接口...');
    
    const appInfoResponse = await fetch('https://open.feishu.cn/open-apis/application/v6/applications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('应用信息接口状态:', appInfoResponse.status);
    const appInfoText = await appInfoResponse.text();
    console.log('应用信息响应:', appInfoText);
    
    // 3. 测试多维表格权限
    console.log('\n3️⃣ 测试多维表格权限...');
    
    const baseId = 'H5xQwaTxDiDE6SkUulZcRgOoneh';
    
    // 先测试获取所有表格
    const tablesResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${baseId}/tables`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('获取表格列表状态:', tablesResponse.status);
    const tablesText = await tablesResponse.text();
    console.log('表格列表响应:', tablesText);
    
    // 4. 解析并分析响应
    console.log('\n4️⃣ 分析响应...');
    
    if (tablesResponse.status === 200) {
      try {
        const tablesData = JSON.parse(tablesText);
        if (tablesData.code === 0) {
          console.log('✅ Token有效，权限正常');
          console.log('找到的表格数量:', tablesData.data?.items?.length || 0);
          
          if (tablesData.data?.items?.length > 0) {
            console.log('表格列表:');
            tablesData.data.items.forEach((table, index) => {
              console.log(`  ${index + 1}. ${table.name} (ID: ${table.table_id})`);
            });
            
            // 查找目标表格
            const targetTableId = 'tblQWm4ttkQD7QH0';
            const targetTable = tablesData.data.items.find(t => t.table_id === targetTableId);
            
            if (targetTable) {
              console.log(`✅ 找到目标表格: ${targetTable.name}`);
              return true;
            } else {
              console.log(`❌ 未找到目标表格 ID: ${targetTableId}`);
              console.log('可用的表格ID:', tablesData.data.items.map(t => t.table_id));
            }
          }
        } else {
          console.log('❌ API返回错误:', tablesData.code, tablesData.msg);
        }
      } catch (e) {
        console.error('JSON解析失败:', e);
      }
    } else if (tablesResponse.status === 401) {
      console.log('❌ Token无效或已过期');
    } else if (tablesResponse.status === 403) {
      console.log('❌ 权限不足，无法访问该多维表格');
    } else {
      console.log(`❌ HTTP错误: ${tablesResponse.status}`);
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ 验证过程中出错:', error);
    return false;
  }
}

// 快捷函数 - 直接验证并显示结果
async function quickCheck() {
  const result = await verifyToken();
  if (result) {
    alert('✅ Token验证成功！可以正常使用API');
  } else {
    alert('❌ Token验证失败！请检查控制台详细信息');
  }
}

console.log(`
🔑 Token验证工具已加载

使用方法:
- 运行 verifyToken() 查看详细验证过程
- 运行 quickCheck() 快速检查并显示结果

示例:
await verifyToken();
// 或
await quickCheck();
`);

// 导出到全局
if (typeof window !== 'undefined') {
  window.verifyToken = verifyToken;
  window.quickCheck = quickCheck;
}