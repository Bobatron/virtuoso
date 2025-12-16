/**
 * IPC (Inter-Process Communication) type definitions for Virtuoso
 */

import type { AccountData } from './account';
import type { Template } from './template';
import type { Performance } from './performance';

export interface IpcResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  send: (channel: string, ...args: any[]) => void;
  off: (channel: string, listener: (...args: any[]) => void) => void;
  loadPerformances?: () => Promise<Performance[]>;
  getPerformance?: (performanceId: string) => Promise<Performance | null>;
  savePerformance?: (performance: Performance) => Promise<{ success: boolean }>;
  deletePerformance?: (performanceId: string) => Promise<{ success: boolean }>;
  exportPerformance?: (performanceId: string, filePath: string) => Promise<{ success: boolean }>;
  importPerformance?: (
    filePath: string
  ) => Promise<{ success: boolean; performance?: Performance | undefined }>;
}

// Main process to renderer IPC channels
export type MainToRendererChannels =
  | 'stanza-response'
  | 'account-status';

// Renderer to main process IPC channels
export type RendererToMainChannels =
  | 'subscribe-stanza'
  | 'get-accounts'
  | 'add-account'
  | 'connect-account'
  | 'send-stanza'
  | 'disconnect-account'
  | 'remove-account'
  | 'get-templates'
  | 'save-template'
  | 'delete-template'
  | 'load-performances'
  | 'get-performance'
  | 'save-performance'
  | 'delete-performance'
  | 'export-performance'
  | 'import-performance';

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}
