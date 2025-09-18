// 飞书API测试脚本
import { FeishuAPI } from './utils/api.js';

async function testFeishuAPI() {
  console.log('开始测试飞书API...');
  
  // 配置信息
  const config = {
    tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4', // 你提供的token
    baseId: 'H5xQwaTxDiDE6SkUulZcRgOoneh', // 从URL解析的app_token
    tableId: 'tblQWm4ttkQD7QH0' // 从URL解析的table_id
  };

  try {
    const api = new FeishuAPI(config);
    console.log('FeishuAPI实例创建成功');

    // 测试1: 获取访问令牌
    console.log('\n测试1: 获取访问令牌');
    const token = await api.getAccessToken();
    console.log('✓ 访问令牌获取成功:', token ? '已获取' : '获取失败');

    // 测试2: 获取表格信息
    console.log('\n测试2: 获取表格信息');
    const tableInfo = await api.getTableInfo();
    console.log('✓ 表格信息:', tableInfo);

    // 测试3: 获取表格字段信息
    console.log('\n测试3: 获取表格字段信息');
    const fields = await api.getTableFields();
    console.log('✓ 表格字段数量:', fields ? fields.length : 0);
    if (fields && fields.length > 0) {
      console.log('字段列表:');
      fields.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field.field_name} (${field.type})`);
      });
    }

    // 测试4: 创建测试记录
    console.log('\n测试4: 创建测试记录');
    const testRecord = {
      '标题': '测试网页标题 - ' + new Date().toLocaleString(),
      '链接': 'https://example.com/test',
      '描述': '这是一个API测试记录',
      '标签': ['测试', 'API'],
      '收藏时间': new Date().toISOString()
    };

    const createdRecord = await api.createRecord(testRecord);
    console.log('✓ 测试记录创建成功:', createdRecord ? '已创建' : '创建失败');
    if (createdRecord) {
      console.log('记录ID:', createdRecord.record_id);
    }

    console.log('\n🎉 所有测试通过！飞书API集成成功！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    
    // 提供调试信息
    if (error.message.includes('1001')) {
      console.log('\n💡 调试建议: 检查App ID是否正确');
    } else if (error.message.includes('1002')) {
      console.log('\n💡 调试建议: 检查App Secret是否正确');
    } else if (error.message.includes('1003')) {
      console.log('\n💡 调试建议: 访问令牌已过期，需要重新获取');
    } else if (error.message.includes('1004')) {
      console.log('\n💡 调试建议: 检查应用权限配置');
    } else if (error.message.includes('1006')) {
      console.log('\n💡 调试建议: 检查BaseId是否正确');
    } else if (error.message.includes('1007')) {
      console.log('\n💡 调试建议: 检查TableId是否正确');
    }
  }
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testFeishuAPI();
}

export { testFeishuAPI };