#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 构建多浏览器支持的插件版本
class MultiPlatformBuilder {
  constructor() {
    this.sourceDir = __dirname;
    this.distDir = path.join(__dirname, 'dist');

    this.browsers = {
      chrome: {
        name: 'Chrome',
        manifest: 'manifest.json',
        description: '一键收藏网页文章信息并同步到飞书多维表格（支持Chrome浏览器）'
      },
      edge: {
        name: 'Edge',
        manifest: 'manifest.json',
        description: '一键收藏网页文章信息并同步到飞书多维表格（支持Edge浏览器）'
      }
    };
  }

  async build() {
    console.log('🚀 开始构建多浏览器版本...');

    // 创建dist目录
    await this.ensureDir(this.distDir);

    for (const [browserName, config] of Object.entries(this.browsers)) {
      console.log(`\n📦 构建 ${config.name} 版本...`);

      const targetDir = path.join(this.distDir, browserName);
      await this.ensureDir(targetDir);

      // 复制文件
      await this.copyFiles(targetDir, browserName);

      // 修改manifest
      await this.updateManifest(targetDir, config, browserName);

      console.log(`✅ ${config.name} 版本构建完成: ${targetDir}`);
    }

    console.log('\n🎉 所有版本构建完成！');

    // 创建README
    await this.createReadme();
  }

  async ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async copyFiles(targetDir, browserName) {
    const filesToCopy = [
      'background.js',
      'content-script.js',
      'popup/',
      'options/',
      'utils/',
      'assets/'
    ];

    // 排除文件
    const excludeFiles = [
      'build.js',
      'dist/',
      'node_modules/',
      '.git/',
      '.DS_Store',
      'README.md'
    ];

    for (const file of filesToCopy) {
      const sourcePath = path.join(this.sourceDir, file);
      const targetPath = path.join(targetDir, file);

      if (fs.existsSync(sourcePath)) {
        await this.copyRecursive(sourcePath, targetPath, excludeFiles);
      }
    }
  }

  async copyRecursive(source, target, excludeFiles = []) {
    const stats = fs.statSync(source);

    if (stats.isDirectory()) {
      await this.ensureDir(target);
      const files = fs.readdirSync(source);

      for (const file of files) {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        // 检查是否在排除列表中
        if (!excludeFiles.some(exclude => sourcePath.includes(exclude))) {
          await this.copyRecursive(sourcePath, targetPath, excludeFiles);
        }
      }
    } else {
      fs.copyFileSync(source, target);
    }
  }

  async updateManifest(targetDir, config, browserName) {
    const manifestPath = path.join(this.sourceDir, config.manifest);

    if (!fs.existsSync(manifestPath)) {
      console.warn(`⚠️ 找不到manifest文件: ${manifestPath}`);
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 更新描述
    manifest.description = config.description;


    // 保存manifest
    const targetManifestPath = path.join(targetDir, 'manifest.json');
    fs.writeFileSync(targetManifestPath, JSON.stringify(manifest, null, 2));
  }

  async createReadme() {
    const readmeContent = `# 飞书知识收藏插件 - 多浏览器版本

这个插件支持Chrome和Edge浏览器，能够一键收藏网页信息并同步到飞书多维表格。

## 构建输出

\`\`\`
dist/
├── chrome/     # Chrome浏览器版本
└── edge/       # Edge浏览器版本
\`\`\`

## 安装说明

### Chrome / Edge
1. 打开浏览器扩展管理页面
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择对应的文件夹（chrome/ 或 edge/）

## 配置要求

1. 在[飞书开放平台](https://open.feishu.cn/app)创建应用
2. 获取App ID和App Secret
3. 创建多维表格并获取Base ID和Table ID
4. 在插件设置中填写这些配置信息

## 功能特性

- ✅ 一键收藏当前网页
- ✅ 自动提取页面信息
- ✅ 自定义标签和备注
- ✅ 同步到飞书多维表格
- ✅ 历史记录管理
- ✅ 重复内容检测

## 浏览器特性对比

| 功能 | Chrome | Edge |
|------|---------|------|
| 网页收藏 | ✅ | ✅ |
| 飞书同步 | ✅ | ✅ |
| 快捷键 | ✅ | ✅ |

构建时间: ${new Date().toLocaleString()}
`;

    fs.writeFileSync(path.join(this.distDir, 'README.md'), readmeContent);
  }
}

// 运行构建
if (require.main === module) {
  const builder = new MultiPlatformBuilder();
  builder.build().catch(console.error);
}

module.exports = MultiPlatformBuilder;