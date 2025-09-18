// Chrome扩展环境测试脚本
// 这个脚本需要在Chrome扩展的context中运行（比如popup或background）

// 测试飞书API连接的扩展脚本
async function testFeishuInExtension() {
  console.log('🚀 开始在扩展环境中测试飞书API...');
  
  // 配置信息
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
    // 1. 保存配置到扩展存储
    console.log('1. 保存配置...');
    await chrome.storage.local.set({ config });
    console.log('✅ 配置保存成功');

    // 2. 验证配置
    console.log('2. 验证配置...');
    const result = await chrome.storage.local.get(['config']);
    const savedConfig = result.config;
    if (savedConfig && savedConfig.tenantAccessToken && savedConfig.baseId && savedConfig.tableId) {
      console.log('✅ 配置验证通过');
    } else {
      throw new Error('配置验证失败');
    }

    // 3. 测试API连接 - 获取表格信息
    console.log('3. 测试API连接...');
    const tableResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.tenantAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const tableData = await tableResponse.json();
    console.log('API响应:', tableData);

    if (tableData.code === 0) {
      console.log('✅ API连接成功');
      console.log('表格名称:', tableData.data?.table?.name || '未知');
    } else {
      console.log('❌ API连接失败:', tableData.msg);
      console.log('错误代码:', tableData.code);
      return false;
    }

    // 4. 获取字段信息
    console.log('4. 获取字段信息...');
    const fieldsResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.baseId}/tables/${config.tableId}/fields`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.tenantAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const fieldsData = await fieldsResponse.json();
    if (fieldsData.code === 0) {
      console.log('✅ 字段获取成功');
      console.log(`共找到 ${fieldsData.data?.items?.length || 0} 个字段:`);
      fieldsData.data?.items?.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field.field_name} (${field.type})`);
      });
    } else {
      console.log('❌ 字段获取失败:', fieldsData.msg);
    }

    // 5. 创建测试记录
    console.log('5. 创建测试记录...');
    const testRecord = {
      fields: {
        '标题': '测试记录 - ' + new Date().toLocaleString(),
        '链接': 'https://example.com/test-' + Date.now(),
        '描述': '这是一个从Chrome扩展创建的测试记录',
        '标签': ['测试', 'Chrome扩展'],
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

    const createData = await createResponse.json();
    if (createData.code === 0) {
      console.log('✅ 测试记录创建成功');
      console.log('记录ID:', createData.data?.record?.record_id);
    } else {
      console.log('❌ 记录创建失败:', createData.msg);
      console.log('错误详情:', createData);
    }

    console.log('🎉 所有测试完成！');
    return true;

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
    return false;
  }
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFeishuInExtension };
}