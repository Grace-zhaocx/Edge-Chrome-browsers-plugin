# 🚀 快速开始指南

## 问题解决：CORS错误

你遇到的CORS错误是正常的，因为：
- ❌ 在普通网页中直接调用飞书API会被浏览器阻止
- ✅ 在Chrome扩展环境中不会有CORS限制

## 正确的测试方法

### 1. 加载插件到Chrome

1. 打开Chrome浏览器
2. 地址栏输入：`chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择这个项目文件夹

### 2. 在扩展中测试API

#### 方法A：使用popup测试按钮
1. 插件加载后，点击浏览器工具栏的插件图标
2. 点击底部的"测试API"按钮
3. 查看弹出的提示和浏览器控制台日志

#### 方法B：使用开发者控制台
1. 在插件popup页面，按F12打开开发者工具
2. 在Console中运行配置代码：

```javascript
// 配置飞书API
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

chrome.storage.local.set({ config }).then(() => console.log('✅ 配置完成'));
```

### 3. 测试实际功能

1. 访问任意网页（比如百度、知乎等）
2. 点击插件图标
3. 填写收藏信息
4. 点击"保存收藏"
5. 检查你的飞书多维表格是否有新记录

## 多维表格字段设置

确保你的飞书多维表格包含以下字段：

| 字段名 | 类型 | 必需 |
|--------|------|------|
| 标题 | 单行文本 | ✅ |
| 链接 | 单行文本 | ✅ |
| 描述 | 多行文本 | - |
| 标签 | 多选 | - |
| 收藏时间 | 日期时间 | - |

## 常见问题

### Q1: 插件图标显示红色感叹号
**A**: 配置未完成，点击"测试API"按钮进行配置

### Q2: API调用失败
**A**: 检查：
- Token是否正确
- BaseId和TableId是否正确  
- 多维表格字段名称是否匹配

### Q3: 字段名称不匹配
**A**: 修改配置中的fieldMapping:
```javascript
fieldMapping: {
    title: '你的标题字段名',
    url: '你的链接字段名',
    // ...
}
```

## 成功标志

✅ 插件图标显示正常（无感叹号）  
✅ 点击"测试API"显示成功消息  
✅ 收藏网页后飞书表格出现新记录  

需要帮助时，请查看浏览器控制台的详细日志信息。