// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Feature 01 and 02: Sandbox and Results
  runCode: (code: string, lang: string) => ipcRenderer.invoke('run-code', { code, lang }),

  // Feature 03: Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', { key, value }),


  // Persistent Tabs
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  saveTab: (tab: any) => ipcRenderer.invoke('save-tab', tab),
  deleteTab: (id: string) => ipcRenderer.invoke('delete-tab', id),

  // Package installation
  installPackages: (packages: string[], language: string) =>
    ipcRenderer.invoke('install-packages', { packages, language })
});
