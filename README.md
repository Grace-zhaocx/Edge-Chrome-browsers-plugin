# 飞书知识收藏插件

一款简单易用的 Chrome 浏览器插件，帮助用户一键收藏网页文章信息并自动同步到飞书多维表格，方便知识管理和后续查阅。

## 🌟 主要功能

- ✨ **一键收藏** - 点击插件图标快速保存当前网页
- 🔄 **自动同步** - 数据实时同步到飞书多维表格
- 🏷️ **标签管理** - 支持自定义标签分类
- 📝 **内容编辑** - 可编辑网站说明和备注信息
- 🔍 **重复检测** - 自动检测重复收藏内容
- 📊 **历史记录** - 完整的收藏历史管理
- ⚙️ **灵活配置** - 丰富的个性化设置

## 🚀 快速开始

### 1. 前置准备

在使用插件前，你需要：

1. **创建飞书应用**
   - 登录 [飞书开放平台](https://open.feishu.cn/)
   - 创建企业自建应用
   - 获取 App ID 和 App Secret

2. **准备多维表格**
   - 创建或准备一个飞书多维表格
   - 确保表格包含以下字段（名称可自定义）：
     - 网站地址（文本）
     - 网站标题（文本）
     - 网站说明（文本）
     - 网站备注（多行文本）
     - 网站标签（多选）
     - 页面摘要（多行文本）
     - 创建时间（日期时间）

3. **配置应用权限**
   - 为应用添加以下权限：
     - `bitable:app`（查看、编辑多维表格）

### 2. 安装插件

1. **下载源码**
   ```bash
   git clone <repository-url>
   cd feishu-browsers-plugin
   ```

2. **加载到 Chrome**
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目文件夹

3. **配置插件**
   - 右键插件图标选择"选项"
   - 填入飞书应用配置信息
   - 测试连接确保配置正确

### 3. 使用插件

1. **收藏网页**
   - 浏览到要收藏的网页
   - 点击浏览器工具栏中的插件图标
   - 编辑标题、描述、标签等信息
   - 点击"保存收藏"

2. **查看历史**
   - 在插件设置页面的"历史记录"标签中
   - 可以搜索、过滤和管理历史收藏

3. **管理设置**
   - 在设置页面配置默认标签、重试次数等
   - 导入/导出配置数据

## 📁 项目结构

```
feishu-browsers-plugin/
├── manifest.json          # 插件配置文件
├── background.js          # 后台服务脚本
├── content-script.js      # 内容脚本
├── popup/                 # 弹窗界面
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/               # 设置页面
│   ├── options.html
│   ├── options.js
│   └── options.css
├── utils/                 # 工具库
│   ├── api.js            # 飞书 API 封装
│   ├── storage.js        # 存储管理
│   └── utils.js          # 通用工具
├── assets/               # 资源文件
│   ├── icons/           # 图标
│   └── styles/          # 公共样式
└── README.md
```

## ⚙️ 配置说明

### 基础配置

| 配置项 | 说明 | 示例 |
|--------|------|------|
| App ID | 飞书应用ID | cli_a8de0f42f020101c |
| App Secret | 飞书应用密钥 | xgzYDKAkxPTZaeL9VXuDKh4rMA1SvLB4 |
| Base ID | 多维表格ID | U2GobH43xaSwFlsN92ZcgDF6nYe |
| Table ID | 数据表ID | tblQWm4ttkQD7QH0 |

### 高级设置

- **默认标签** - 新收藏自动添加的标签
- **自动填充描述** - 从页面 meta 信息提取描述
- **启用通知** - 显示操作结果通知
- **重复内容检测** - 收藏前检查重复
- **最大重试次数** - 网络错误时的重试次数

## 🔧 开发指南

### 开发环境

- Node.js 18+（可选，用于代码检查）
- Chrome 浏览器 88+

### 调试方法

1. **后台脚本调试**
   ```javascript
   // 在 background.js 中
   console.log('Debug info:', data);
   ```
   在 `chrome://extensions/` 的插件详情中点击"背景页"查看日志

2. **弹窗调试**
   - 右键弹窗选择"检查"
   - 或在弹窗中按 F12

3. **内容脚本调试**
   - 在网页中按 F12
   - 在 Console 中查看内容脚本日志

### 构建和打包

```bash
# 创建发布包
zip -r feishu-bookmark-plugin.zip . -x ".*" "*.md" "node_modules/*"
```

## 🔐 隐私与安全

- 所有数据仅存储在本地浏览器中
- API 密钥使用浏览器存储 API 安全保存
- 不会收集或传输用户个人信息
- 仅访问用户明确配置的飞书表格

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 常见问题

### Q: 无法连接到飞书 API？
A: 请检查：
- App ID 和 App Secret 是否正确
- 应用是否已启用并发布
- 网络连接是否正常
- 是否添加了正确的 API 权限

### Q: 数据没有同步到表格？
A: 请确认：
- Base ID 和 Table ID 是否正确
- 应用是否有表格的读写权限
- 表格字段名称是否匹配

### Q: 插件图标显示感叹号？
A: 表示配置不完整，请：
- 打开插件设置页面
- 完善所有必需的配置项
- 测试连接确保配置正确

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系开发者。

---

❤️ 如果这个插件对你有帮助，请给个 Star！