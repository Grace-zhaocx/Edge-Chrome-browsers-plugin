// 浏览器兼容性处理
// 确保在Chrome和Edge中都能正常工作

// 统一的浏览器API接口
export const browserAPI = (() => {
  // 检测浏览器类型
  const isEdge = navigator.userAgent.includes('Edg/');
  const isChrome = navigator.userAgent.includes('Chrome/') && !isEdge;

  // 使用chrome API
  const api = globalThis.chrome;

  if (!api) {
    throw new Error('浏览器扩展API不可用');
  }

  return {
    // 运行时API
    runtime: {
      onInstalled: api.runtime.onInstalled,
      onStartup: api.runtime.onStartup,
      onMessage: api.runtime.onMessage,
      sendMessage: api.runtime.sendMessage,
      openOptionsPage: api.runtime.openOptionsPage,
      getManifest: api.runtime.getManifest,
      getURL: api.runtime.getURL,
      id: api.runtime.id
    },

    // 存储API
    storage: {
      local: api.storage.local,
      sync: api.storage.sync,
      onChanged: api.storage.onChanged
    },

    // 标签页API
    tabs: {
      query: api.tabs.query,
      get: api.tabs.get,
      update: api.tabs.update,
      create: api.tabs.create,
      sendMessage: api.tabs.sendMessage,
      executeScript: api.tabs.executeScript
    },

    // 脚本注入API (Manifest V3)
    scripting: api.scripting ? {
      executeScript: api.scripting.executeScript,
      insertCSS: api.scripting.insertCSS,
      removeCSS: api.scripting.removeCSS
    } : null,

    // 警报API
    alarms: api.alarms ? {
      create: api.alarms.create,
      clear: api.alarms.clear,
      onAlarm: api.alarms.onAlarm
    } : null,


    // 权限API
    permissions: api.permissions ? {
      request: api.permissions.request,
      contains: api.permissions.contains,
      remove: api.permissions.remove
    } : null,

    // 获取浏览器信息
    getBrowserInfo: () => ({
      isEdge,
      isChrome,
      name: isEdge ? 'Edge' : 'Chrome',
      version: navigator.userAgent.match(
        isEdge ? /Edg\/(\d+)/ :
        /Chrome\/(\d+)/
      )?.[1] || 'unknown'
    })
  };
})();

// 为了向后兼容，也导出为默认的browser对象
export const browser = browserAPI;
export default browserAPI;