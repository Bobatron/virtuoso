/**
 * Preload script for Electron
 * Provides a secure bridge between the main process and renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { ElectronAPI } from '../types/ipc';

// Track wrapped listeners so we can remove them correctly
const listenerMap = new Map<(...args: any[]) => void, (event: IpcRendererEvent, ...args: any[]) => void>();

const electronAPI: ElectronAPI = {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: (...args: any[]) => void) => {
    // Create a wrapper that strips the event and forwards args
    const wrapper = (_event: IpcRendererEvent, ...args: any[]) => callback(...args);
    // Store the mapping so we can remove it later
    listenerMap.set(callback, wrapper);
    ipcRenderer.on(channel, wrapper);
  },
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  off: (channel: string, listener: (...args: any[]) => void) => {
    // Find the wrapped listener and remove it
    const wrapper = listenerMap.get(listener);
    if (wrapper) {
      ipcRenderer.removeListener(channel, wrapper);
      listenerMap.delete(listener);
    }
  },
  loadCompositions: () => ipcRenderer.invoke('load-compositions'),
  getComposition: (compositionId: string) => ipcRenderer.invoke('get-composition', compositionId),
  saveComposition: (composition: unknown) => ipcRenderer.invoke('save-composition', composition),
  deleteComposition: (compositionId: string) => ipcRenderer.invoke('delete-composition', compositionId),
  exportComposition: (compositionId: string, filePath: string) =>
    ipcRenderer.invoke('export-composition', compositionId, filePath),
  importComposition: (filePath: string) => ipcRenderer.invoke('import-composition', filePath),
};

contextBridge.exposeInMainWorld('electron', electronAPI);
