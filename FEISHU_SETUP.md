# 飞书多维表格API集成配置指南

## 🎯 配置信息

从你提供的多维表格URL分析得出：
- **多维表格地址**: https://x6upmg45zs.feishu.cn/wiki/H5xQwaTxDiDE6SkUulZcRgOoneh?table=tblQWm4ttkQD7QH0&view=vewiTYyjNc
- **App Token (baseId)**: `H5xQwaTxDiDE6SkUulZcRgOoneh`
- **Table ID**: `tblQWm4ttkQD7QH0`
- **访问令牌**: `t-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4`

## 🚀 快速开始

### 方法1: 使用配置脚本（推荐）

1. 在Chrome浏览器中加载插件
2. 打开浏览器开发者工具 (F12)
3. 在Console中运行：

```javascript
// 复制粘贴下面的代码到控制台执行
const config = {
    tenantAccessToken: 't-g1049ffnJ7Z6E65FESDLBPIHQ6MAEQUOFFI6G5C4',
    baseId: 'H5xQwaTxDiDE6SkUulZcRgOoneh',
    tableId: 'tblQWm4ttkQD7QH0',
    fieldMapping: {
        title: '标题',
        url: '链接',
        description: '描述',
        notes: '备注',
        tags: '标签',
        summary: '摘要',
        savedAt: '收藏时间'
    },
    defaultTags: ['网页收藏', '知识管理'],
    autoFillDescription: true,
    enableNotifications: true,
    maxRetries: 3
};

chrome.storage.local.set({ config: config })
    .then(() => console.log('✅ 飞书配置设置成功！'))
    .catch(error => console.error('❌ 配置失败:', error));
```

### 方法2: 使用测试页面

1. 双击打开 `test-page.html`
2. 点击"设置配置"按钮
3. 点击"验证配置"按钮
4. 依次测试各项功能

## 🧪 测试步骤

### 1. 基础连接测试
打开 `test-page.html`，按顺序执行：
- 设置配置
- 验证配置
- 测试连接
- 获取表格信息
- 获取字段信息

### 2. 数据操作测试
- 创建测试记录
- 搜索记录
- 获取所有记录

### 3. 插件功能测试
- 加载插件到Chrome
- 访问任意网页
- 点击插件图标测试收藏功能

## 🔧 代码修改说明

### 已完成的修改：

1. **API类增强** (`utils/api.js`):
   - 支持直接使用提供的 `tenantAccessToken`
   - 自动处理token认证

2. **配置检查更新** (`popup/popup.js`):
   - 支持两种认证方式：`appId+appSecret` 或 `tenantAccessToken`
   - 更新了配置验证逻辑

3. **默认配置修正** (`background.js`):
   - 修正了 `baseId` 为正确的app_token值

4. **测试工具**:
   - `test-page.html`: 完整的API测试界面
   - `configure-feishu.js`: 浏览器控制台配置脚本
   - `test-feishu-api.js`: Node.js测试脚本

## 📋 多维表格字段要求

根据代码分析，你的多维表格需要包含以下字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 标题 | 单行文本 | 网页标题 |
| 链接 | 单行文本 | 网页URL |
| 描述 | 多行文本 | 网页描述 |
| 备注 | 多行文本 | 用户备注 |
| 标签 | 多选 | 标签列表 |
| 摘要 | 多行文本 | 选中文本 |
| 收藏时间 | 日期时间 | 收藏时间戳 |

## 🚨 常见问题排查

### 1. Token权限问题
如果遇到权限错误，检查：
- Token是否有效
- 应用是否有多维表格的读写权限
- BaseId和TableId是否正确

### 2. 字段名称不匹配
如果字段名称不匹配，修改 `fieldMapping` 配置：

```javascript
const config = {
    fieldMapping: {
        title: '你的标题字段名',
        url: '你的链接字段名',
        // ... 其他字段映射
    }
};
```

### 3. CORS问题
如果在网页中测试时遇到CORS错误，这是正常的。插件环境不会有这个问题。

## 🎉 完成后的功能

配置完成后，插件将支持：
- ✅ 一键收藏网页到飞书多维表格
- ✅ 自动提取网页标题、URL、描述
- ✅ 支持添加标签和备注
- ✅ 重复检查防止重复收藏
- ✅ 离线时本地保存，联网时同步
- ✅ 收藏历史记录查看

## 📞 调试帮助

如果遇到问题：
1. 先运行 `test-page.html` 确认API连接正常
2. 检查浏览器控制台的错误信息
3. 验证多维表格的字段名称是否匹配
4. 确认token权限是否充足