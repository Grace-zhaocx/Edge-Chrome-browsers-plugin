// 内容脚本 - 运行在网页上下文中
(function() {
  'use strict';

  // 浏览器兼容性处理
  const browserAPI = globalThis.chrome || globalThis.browser;

  class ContentScript {
    constructor() {
      this.isInitialized = false;
      this.init();
    }

    init() {
      if (this.isInitialized) return;
      
      console.log('飞书收藏插件内容脚本已加载');
      
      // 监听来自popup或background的消息
      browserAPI.runtime.onMessage.addListener(this.handleMessage.bind(this));
      
      // 监听页面选择变化（可选功能）
      document.addEventListener('selectionchange', this.onSelectionChange.bind(this));
      
      // 添加快捷键支持（可选）
      document.addEventListener('keydown', this.handleKeydown.bind(this));
      
      this.isInitialized = true;
    }

    // 处理来自插件其他部分的消息
    handleMessage(message, sender, sendResponse) {
      switch (message.type) {
        case 'GET_PAGE_CONTENT':
          sendResponse(this.getPageContent());
          break;
          
        case 'GET_SELECTED_TEXT':
          sendResponse(this.getSelectedText());
          break;
          
        case 'GET_META_INFO':
          sendResponse(this.getMetaInfo());
          break;
          
        case 'HIGHLIGHT_SELECTION':
          this.highlightSelection();
          sendResponse({ success: true });
          break;
          
        case 'EXTRACT_MAIN_CONTENT':
          sendResponse(this.extractMainContent());
          break;
          
        default:
          console.warn('未知消息类型:', message.type);
      }
    }

    // 获取页面内容信息
    getPageContent() {
      return {
        url: window.location.href,
        title: document.title,
        selectedText: this.getSelectedText(),
        metaDescription: this.getMetaDescription(),
        keywords: this.getKeywords(),
        favicon: this.getFavicon(),
        mainContent: this.extractMainContent(),
        pageInfo: {
          scrollPosition: window.scrollY,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timestamp: new Date().toISOString()
        }
      };
    }

    // 获取选中的文本
    getSelectedText() {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        return {
          text: selectedText,
          range: this.getSelectionRange(selection),
          length: selectedText.length
        };
      }
      
      return null;
    }

    // 获取选择范围信息
    getSelectionRange(selection) {
      if (!selection.rangeCount) return null;
      
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        return {
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          position: {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          }
        };
      } catch (error) {
        console.warn('获取选择范围失败:', error);
        return null;
      }
    }

    // 获取页面元信息
    getMetaInfo() {
      return {
        description: this.getMetaDescription(),
        keywords: this.getKeywords(),
        author: this.getMetaContent('author'),
        publishDate: this.getPublishDate(),
        canonical: this.getCanonicalUrl(),
        ogTitle: this.getMetaContent('og:title'),
        ogDescription: this.getMetaContent('og:description'),
        ogImage: this.getMetaContent('og:image')
      };
    }

    // 获取meta描述
    getMetaDescription() {
      return this.getMetaContent('description') || 
             this.getMetaContent('og:description') || '';
    }

    // 获取关键词
    getKeywords() {
      return this.getMetaContent('keywords') || '';
    }

    // 获取meta标签内容
    getMetaContent(name) {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? meta.getAttribute('content') : '';
    }

    // 获取网站图标
    getFavicon() {
      const favicon = document.querySelector('link[rel*="icon"]');
      if (favicon) {
        return new URL(favicon.href, window.location.origin).href;
      }
      
      // 尝试默认favicon路径
      return new URL('/favicon.ico', window.location.origin).href;
    }

    // 获取发布日期
    getPublishDate() {
      // 尝试多种常见的日期选择器
      const dateSelectors = [
        'time[datetime]',
        '[datetime]',
        '.publish-date',
        '.post-date',
        '.article-date',
        'meta[property="article:published_time"]',
        'meta[name="pubdate"]'
      ];

      for (const selector of dateSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const dateAttr = element.getAttribute('datetime') || 
                          element.getAttribute('content') ||
                          element.textContent;
          
          if (dateAttr) {
            const date = new Date(dateAttr);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
        }
      }

      return null;
    }

    // 获取规范URL
    getCanonicalUrl() {
      const canonical = document.querySelector('link[rel="canonical"]');
      return canonical ? canonical.href : window.location.href;
    }

    // 提取主要内容
    extractMainContent() {
      try {
        // 尝试常见的内容选择器
        const contentSelectors = [
          'article',
          '[role="main"]',
          '.content',
          '.post-content',
          '.article-content',
          '.entry-content',
          '#content',
          'main'
        ];

        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            return this.cleanTextContent(element.textContent);
          }
        }

        // 如果没有找到特定容器，尝试提取body内容
        return this.cleanTextContent(document.body.textContent);
        
      } catch (error) {
        console.warn('提取主要内容失败:', error);
        return '';
      }
    }

    // 清理文本内容
    cleanTextContent(text) {
      if (!text) return '';
      
      return text
        .replace(/\s+/g, ' ')  // 合并多个空白字符
        .replace(/^\s+|\s+$/g, '')  // 去除首尾空白
        .substring(0, 1000);  // 限制长度
    }

    // 高亮选中内容
    highlightSelection() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      try {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'feishu-bookmark-highlight';
        span.style.cssText = `
          background-color: #fef3c7 !important;
          border-radius: 2px !important;
          padding: 1px 2px !important;
        `;

        // 包装选中内容
        try {
          range.surroundContents(span);
        } catch (error) {
          // 如果无法直接包装，使用提取和插入的方式
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }

        // 3秒后移除高亮
        setTimeout(() => {
          if (span.parentNode) {
            const parent = span.parentNode;
            parent.replaceChild(document.createTextNode(span.textContent), span);
            parent.normalize();
          }
        }, 3000);
        
      } catch (error) {
        console.warn('高亮选中内容失败:', error);
      }
    }

    // 处理快捷键
    handleKeydown(event) {
      // Ctrl/Cmd + Shift + S 触发收藏
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        this.triggerBookmark();
      }
    }

    // 触发收藏操作
    triggerBookmark() {
      chrome.runtime.sendMessage({
        type: 'TRIGGER_BOOKMARK',
        data: this.getPageContent()
      });
    }

    // 监听选择变化（用于实时更新选中内容）
    onSelectionChange() {
      // 可以在这里添加选择变化的处理逻辑
      // 例如：显示快速收藏按钮等
    }

    // 检测是否为可收藏页面
    isBookmarkablePage() {
      const url = window.location.href;
      
      // 排除不适合收藏的页面
      const excludePatterns = [
        /^chrome:/,
        /^moz-extension:/,
        /^about:/,
        /^file:/,
        /^data:/
      ];

      return !excludePatterns.some(pattern => pattern.test(url));
    }

    // 获取页面语言
    getPageLanguage() {
      return document.documentElement.lang || 
             document.querySelector('meta[http-equiv="content-language"]')?.content || 
             'zh-CN';
    }

    // 检测页面类型
    detectPageType() {
      const url = window.location.href;
      const title = document.title.toLowerCase();
      const content = document.body.textContent.toLowerCase();

      if (url.includes('github.com')) return 'code';
      if (url.includes('stackoverflow.com')) return 'qa';
      if (url.includes('medium.com') || url.includes('blog')) return 'blog';
      if (title.includes('documentation') || title.includes('docs')) return 'documentation';
      if (content.includes('tutorial') || content.includes('guide')) return 'tutorial';
      
      return 'article';
    }

    // 获取页面结构化数据
    getStructuredData() {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      const structuredData = [];

      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent);
          structuredData.push(data);
        } catch (error) {
          console.warn('解析结构化数据失败:', error);
        }
      });

      return structuredData;
    }
  }

  // 初始化内容脚本
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ContentScript();
    });
  } else {
    new ContentScript();
  }

})();