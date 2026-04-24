const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appAPI', {
  listModules: () => ipcRenderer.invoke('app:listModules'),
  ptyAvailable: () => ipcRenderer.invoke('app:ptyAvailable'),
  webviewPreloadUrl: () => ipcRenderer.invoke('app:webviewPreloadUrl'),
  openLoginWindow: (url) => ipcRenderer.invoke('app:openLoginWindow', url),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  clearSiteCookies: (domains) => ipcRenderer.invoke('app:clearSiteCookies', domains),
  importChromeCookies: (options) => ipcRenderer.invoke('app:importChromeCookies', options),
  saveModule: (module, previousId) => ipcRenderer.invoke('app:saveModule', module, previousId),
  deleteModule: (id) => ipcRenderer.invoke('app:deleteModule', id),
});

contextBridge.exposeInMainWorld('termAPI', {
  spawn: (id, opts) => ipcRenderer.invoke('term:spawn', id, opts),
  write: (id, data) => ipcRenderer.send('term:write', id, data),
  resize: (id, cols, rows) => ipcRenderer.send('term:resize', id, cols, rows),
  kill: (id) => ipcRenderer.send('term:kill', id),
  onData: (id, cb) => {
    const listener = (_e, tid, data) => { if (tid === id) cb(data); };
    ipcRenderer.on('term:data', listener);
    return () => ipcRenderer.removeListener('term:data', listener);
  },
  onExit: (id, cb) => {
    const listener = (_e, tid, code) => { if (tid === id) cb(code); };
    ipcRenderer.on('term:exit', listener);
    return () => ipcRenderer.removeListener('term:exit', listener);
  },
});
