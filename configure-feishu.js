// 飞书配置脚本
// 在浏览器控制台运行此脚本以配置飞书API

function configureFeishu() {
  const config = {
    tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4',
    baseId: 'U2GobH43xaSwFlsN92ZcgDF6nYe', // 你验证过的app_token
    tableId: 'tblQWm4ttkQD7QH0', // table_id
    
    // 字段映射配置
    fieldMapping: {
      title: '标题',
      url: '链接',
      description: '描述', 
      notes: '备注',
      tags: '标签',
      summary: '摘要',
      savedAt: '收藏时间'
    },
    
    // 其他设置
    defaultTags: ['网页收藏', '知识管理'],
    autoFillDescription: true,
    enableNotifications: true,
    maxRetries: 3
  };

  // 保存配置到Chrome扩展存储
  chrome.storage.local.set({ config: config })
    .then(() => {
      console.log('✅ 飞书配置保存成功！');
      console.log('配置详情:', {
        baseId: config.baseId,
        tableId: config.tableId,
        tokenConfigured: !!config.tenantAccessToken,
        fieldMapping: config.fieldMapping
      });
    })
    .catch(error => {
      console.error('❌ 配置保存失败:', error);
    });
}

// 验证配置
function verifyConfig() {
  chrome.storage.local.get(['config'])
    .then(result => {
      const config = result.config;
      console.log('当前配置:', config);
      
      if (!config) {
        console.log('❌ 没有找到配置');
        return;
      }
      
      const checks = {
        token: !!config.tenantAccessToken,
        baseId: !!config.baseId,
        tableId: !!config.tableId,
        fieldMapping: !!config.fieldMapping
      };
      
      console.log('配置检查:', checks);
      
      const allValid = Object.values(checks).every(check => check);
      console.log(allValid ? '✅ 配置完整' : '❌ 配置不完整');
    })
    .catch(error => {
      console.error('验证配置失败:', error);
    });
}

console.log('飞书配置脚本已加载');
console.log('运行 configureFeishu() 来设置配置');
console.log('运行 verifyConfig() 来验证配置');