import { contextBridge, ipcRenderer } from 'electron';
console.log("Preload script loading..."); // Debug
contextBridge.exposeInMainWorld('electron', {
    // Add API exposures here as needed
    platform: process.platform,
    db: {
        read: () => ipcRenderer.invoke('db:read'),
        write: (data) => ipcRenderer.invoke('db:write', data)
    },
    extractColor: (url) => ipcRenderer.invoke('app:extract-color', url),
    // Data Persistence Config
    getPathConfig: () => ipcRenderer.invoke('app:get-path-config'),
    selectFolder: () => ipcRenderer.invoke('app:select-folder'),
    setDataPath: (path) => ipcRenderer.invoke('app:set-data-path', path)
});
//# sourceMappingURL=preload.js.map