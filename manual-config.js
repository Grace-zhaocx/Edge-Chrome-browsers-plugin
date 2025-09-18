// 手动设置配置值的脚本
// 在插件设置页面的控制台中运行

function setConfigValues() {
  console.log('🔧 开始手动设置配置值...');
  
  // 设置字段值
  const appIdField = document.getElementById('appId');
  const appSecretField = document.getElementById('appSecret');
  const baseIdField = document.getElementById('baseId');
  const tableIdField = document.getElementById('tableId');
  
  if (appIdField) {
    appIdField.value = 'cli_a8de0f42f020101c';
    console.log('✅ App ID 已设置');
  }
  
  if (appSecretField) {
    appSecretField.value = 'xgzYDKAkxPTZaeL9VXuDKh4rMA1SvLB4';
    console.log('✅ App Secret 已设置');
  }
  
  if (baseIdField) {
    baseIdField.value = 'U2GobH43xaSwFlsN92ZcgDF6nYe';
    console.log('✅ Base ID 已设置');
  }
  
  if (tableIdField) {
    tableIdField.value = 'tblQWm4ttkQD7QH0';
    console.log('✅ Table ID 已设置');
  }
  
  // 触发表单验证
  [appIdField, appSecretField, baseIdField, tableIdField].forEach(field => {
    if (field) {
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  console.log('🎉 所有配置值已设置完成！现在可以点击"保存配置"了');
}

// 直接保存配置的函数
async function saveConfigDirectly() {
  console.log('💾 直接保存配置...');
  
  const config = {
    appId: 'cli_a8de0f42f020101c',
    appSecret: 'xgzYDKAkxPTZaeL9VXuDKh4rMA1SvLB4',
    baseId: 'U2GobH43xaSwFlsN92ZcgDF6nYe',
    tableId: 'tblQWm4ttkQD7QH0',
    defaultTags: ['网页收藏', '知识管理'],
    autoFillDescription: true,
    enableNotifications: true,
    maxRetries: 3
  };
  
  try {
    await chrome.storage.local.set({ config });
    console.log('✅ 配置已直接保存到存储');
    
    // 更新页面显示
    setConfigValues();
    
    alert('✅ 配置保存成功！可以开始使用插件了');
  } catch (error) {
    console.error('❌ 保存失败:', error);
    alert('❌ 保存失败: ' + error.message);
  }
}

console.log(`
🛠️ 手动配置工具已加载

使用方法:
1. 运行 setConfigValues() 来设置表单字段值
2. 运行 saveConfigDirectly() 来直接保存配置

建议运行: saveConfigDirectly()
`);

// 导出到全局
if (typeof window !== 'undefined') {
  window.setConfigValues = setConfigValues;
  window.saveConfigDirectly = saveConfigDirectly;
}