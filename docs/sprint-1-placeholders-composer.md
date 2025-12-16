# Sprint 1: Template Placeholders & Core Composing (2-3 weeks)

## 🎯 Sprint Goal

Implement the template placeholder system and core Composer functionality, enabling users to create and play back basic Performances.

## 📋 Success Criteria

- [x] Templates support `{{placeholder}}` syntax
- [x] Placeholders automatically generate input fields in UI
- [x] `{{$id}}` generates unique IDs and displays them
- [x] Performance data model implemented (types scaffolded)
- [ ] Composer captures connect/disconnect/send actions
- [ ] Basic sequential playback works
- [ ] Performances saved to JSON files
- [ ] Right sidebar shows Performances list

## 📦 Prerequisites

- Sprint 0 (Lean Foundation) completed
- All backend code in TypeScript
- Type definitions in place

---

## 🔨 Work Items

### 1. Create Performance Type Definitions
**Priority:** 🔴 CRITICAL  
**Estimate:** 2-3 hours

**Description:**  
Add TypeScript interfaces for Performances, Stanzas, Movements, and related types.

**Tasks:**
- [x] Create `src/types/performance.ts`
- [x] Add Performance interface
- [x] Add Stanza interface with all types
- [x] Add Movement interface
- [x] Add PlaybackResult interfaces
- [x] Export from `src/types/index.ts`

**New File - `src/types/performance.ts`:**
```typescript
export interface Performance {
  id: string;
  name: string;
  description: string;
  version: string;  // Schema version for compatibility
  created: string;  // ISO timestamp
  updated: string;  // ISO timestamp
  
  // Account references (credentials loaded at runtime)
  accounts: AccountReference[];
  
  // Sequential list of stanzas
  stanzas: Stanza[];
  
  // Optional: Movements for logical grouping
  movements?: Movement[];
  
  // Performance-level variables
  variables: Record<string, string>;
  
  // Metadata
  tags: string[];
  author?: string;
}

export interface AccountReference {
  alias: string;      // Reference name used in stanzas (e.g., "bob")
  jid: string;        // Full JID or variable pattern (e.g., "{{BOB_JID}}")
}

export interface Movement {
  id: string;
  name: string;       // e.g., "Setup", "Main Test", "Teardown"
  description?: string;
  stanzaIds: string[]; // References to stanza IDs in this movement
}

export interface Stanza {
  id: string;
  type: StanzaType;
  accountAlias: string;
  description: string;
  data: StanzaData;
  assertions?: Assertion[];
}

export type StanzaType = 'connect' | 'disconnect' | 'send' | 'cue' | 'assert';

export type StanzaData = 
  | ConnectData 
  | DisconnectData 
  | SendData 
  | CueData 
  | AssertData;

export interface ConnectData {
  type: 'connect';
}

export interface DisconnectData {
  type: 'disconnect';
}

export interface SendData {
  type: 'send';
  xml: string;  // The XML stanza (with placeholders resolved)
  generatedIds?: Record<string, string>;  // Track {{$id}} values
}

export interface CueData {
  type: 'cue';
  description: string;
  matchType: 'contains' | 'xpath' | 'regex' | 'id';
  matchExpression: string;
  timeout: number;  // ms, default 10000
  correlatedId?: string;  // For id matching
}

export interface AssertData {
  type: 'assert';
  assertionType: 'xpath' | 'contains' | 'regex' | 'equals';
  expression: string;
  expected?: string;
}

export interface Assertion {
  id: string;
  name: string;
  type: 'xpath' | 'contains' | 'regex' | 'equals' | 'exists' | 'count';
  expression: string;
  expected: string | number | boolean;
  negate?: boolean;
}

// Playback results
export interface PlaybackResult {
  performanceId: string;
  status: 'passed' | 'failed' | 'error' | 'stopped';
  startTime: string;
  endTime: string;
  duration: number;
  stanzaResults: StanzaResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

export interface StanzaResult {
  stanzaId: string;
  status: 'passed' | 'failed' | 'error' | 'skipped';
  duration: number;
  sentXml?: string;
  receivedXml?: string;
  assertionResults?: AssertionResult[];
  error?: {
    message: string;
    details?: string;
  };
}

export interface AssertionResult {
  assertionId: string;
  passed: boolean;
  actual?: string;
  expected?: string;
  error?: string;
}
```

**Verification:**
- Types compile without errors
- Types can be imported in other files

---

### 2. Create Placeholder Type Definitions
**Priority:** 🔴 CRITICAL  
**Estimate:** 1 hour

**Description:**  
Add TypeScript interfaces for the placeholder system.

**Tasks:**
- [x] Create `src/types/placeholder.ts`
- [x] Add Placeholder interface
- [x] Add parsed placeholder types
- [x] Export from `src/types/index.ts`

**New File - `src/types/placeholder.ts`:**
```typescript
export interface Placeholder {
  name: string;           // The placeholder name (without braces)
  fullMatch: string;      // The full match including braces, e.g., "{{name}}"
  type: PlaceholderType;
  startIndex: number;     // Position in the original string
  endIndex: number;
}

export type PlaceholderType = 
  | 'user'        // {{name}} - user provides value
  | 'id'          // {{$id}} - auto-generated unique ID
  | 'timestamp'   // {{$timestamp}} - auto-generated timestamp
  | 'env';        // {{ENV_VAR}} - environment variable (all caps)

export interface ParsedTemplate {
  original: string;
  placeholders: Placeholder[];
  hasAutoGeneratedFields: boolean;
}

export interface PlaceholderValues {
  [key: string]: string;
}

export interface ResolvedTemplate {
  xml: string;
  generatedIds: Record<string, string>;  // Maps placeholder name to generated ID
}
```

**Verification:**
- Types compile without errors

---

### 3. Implement Placeholder Parser
**Priority:** 🔴 CRITICAL  
**Estimate:** 3-4 hours

**Description:**  
Create a utility module to parse and resolve placeholders in templates.

**Tasks:**
- [x] Create `src/main/placeholderParser.ts`
- [x] Implement `parsePlaceholders()` function
- [x] Implement `resolvePlaceholders()` function
- [x] Implement `generateUniqueId()` function
- [x] Add unit tests

**Notes:**
- User-entered values can request an auto-generated, labelled ID using the pattern `${id-label}`; the resolver generates an ID, stores it under `label`, and replaces the placeholder with that value for later assertions/correlation.

**New File - `src/main/placeholderParser.ts`:**
```typescript
import type { 
  Placeholder, 
  PlaceholderType, 
  ParsedTemplate, 
  PlaceholderValues,
  ResolvedTemplate 
} from '../types/placeholder';

// Regex to match {{placeholder}} patterns
const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Determines the type of a placeholder based on its name
 */
function getPlaceholderType(name: string): PlaceholderType {
  if (name.startsWith('$id')) {
    return 'id';
  }
  if (name === '$timestamp') {
    return 'timestamp';
  }
  if (name === name.toUpperCase() && /^[A-Z_]+$/.test(name)) {
    return 'env';
  }
  return 'user';
}

/**
 * Parse a template string and extract all placeholders
 */
export function parsePlaceholders(template: string): ParsedTemplate {
  const placeholders: Placeholder[] = [];
  let match: RegExpExecArray | null;
  let hasAutoGeneratedFields = false;

  // Reset regex state
  PLACEHOLDER_REGEX.lastIndex = 0;

  while ((match = PLACEHOLDER_REGEX.exec(template)) !== null) {
    const name = match[1].trim();
    const type = getPlaceholderType(name);
    
    if (type === 'id' || type === 'timestamp') {
      hasAutoGeneratedFields = true;
    }

    placeholders.push({
      name,
      fullMatch: match[0],
      type,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return {
    original: template,
    placeholders,
    hasAutoGeneratedFields,
  };
}

/**
 * Generate a unique ID for {{$id}} placeholders
 */
export function generateUniqueId(prefix: string = 'virt'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a timestamp for {{$timestamp}} placeholders
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Resolve all placeholders in a template with provided values
 */
export function resolvePlaceholders(
  template: string,
  values: PlaceholderValues,
  autoGenerate: boolean = true
): ResolvedTemplate {
  const parsed = parsePlaceholders(template);
  const generatedIds: Record<string, string> = {};
  let result = template;

  // Process placeholders in reverse order to maintain correct indices
  const sortedPlaceholders = [...parsed.placeholders].sort(
    (a, b) => b.startIndex - a.startIndex
  );

  for (const placeholder of sortedPlaceholders) {
    let value: string;

    switch (placeholder.type) {
      case 'id':
        if (autoGenerate) {
          // Check if we already generated this ID (for multiple uses of same placeholder)
          if (!generatedIds[placeholder.name]) {
            generatedIds[placeholder.name] = generateUniqueId();
          }
          value = generatedIds[placeholder.name];
        } else {
          value = values[placeholder.name] || placeholder.fullMatch;
        }
        break;

      case 'timestamp':
        value = autoGenerate ? generateTimestamp() : (values[placeholder.name] || placeholder.fullMatch);
        break;

      case 'env':
        value = process.env[placeholder.name] || values[placeholder.name] || '';
        break;

      case 'user':
      default:
        value = values[placeholder.name] || placeholder.fullMatch;
        break;
    }

    result = result.slice(0, placeholder.startIndex) + value + result.slice(placeholder.endIndex);
  }

  return {
    xml: result,
    generatedIds,
  };
}

/**
 * Get list of user-input placeholders (excluding auto-generated ones)
 */
export function getUserPlaceholders(template: string): Placeholder[] {
  const parsed = parsePlaceholders(template);
  return parsed.placeholders.filter(p => p.type === 'user');
}

/**
 * Validate that all required placeholders have values
 */
export function validatePlaceholders(
  template: string, 
  values: PlaceholderValues
): { valid: boolean; missing: string[] } {
  const userPlaceholders = getUserPlaceholders(template);
  const missing = userPlaceholders
    .filter(p => !values[p.name] || values[p.name].trim() === '')
    .map(p => p.name);

  return {
    valid: missing.length === 0,
    missing,
  };
}
```

**Verification:**
- Can parse `{{name}}` placeholders
- Can parse `{{$id}}` placeholders
- Can parse `{{$timestamp}}` placeholders
- Can parse `{{ENV_VAR}}` placeholders
- `resolvePlaceholders()` replaces all placeholders with values
- `{{$id}}` generates unique IDs
- Same `{{$id}}` placeholder used multiple times gets same ID

---

### 4. Create Placeholder Input Fields Component
**Priority:** 🔴 CRITICAL  
**Estimate:** 4-5 hours

**Description:**  
Create a React component that automatically renders input fields for each placeholder found in a template.

**Tasks:**
- [x] Create placeholder field rendering (implemented inline in `App.tsx` instead of a separate component)
- [x] Parse template text to find placeholders (single-brace supported)
- [x] Render input field for each user placeholder
- [x] Show guidance for auto-generated IDs via `${id-label}` tokens
- [x] Handle value changes
- [x] Style inputs consistently (reusing existing form styles)

**New File - `src/renderer/components/PlaceholderFields.tsx`:**
```tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Placeholder, PlaceholderValues } from '../../types/placeholder';

**Notes on implementation:**
- Implemented directly inside `App.tsx` using the shared parser; supports `{placeholder}` and `${id-label}` alias tokens for any field.
- Reuses existing form styles; no separate component/CSS file was added.

**Verification:**
- Placeholder-driven inputs render for placeholders in the stanza text.
- Alias tokens `${id-label}` are hinted and resolve to generated IDs at send time.
- Values update correctly; duplicate placeholders are de-duplicated in the parameter list.

.placeholder-fields-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.placeholder-fields-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.placeholder-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.placeholder-field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.placeholder-auto-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent-color);
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

.placeholder-input {
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.placeholder-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
}

.placeholder-input-readonly {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: not-allowed;
  font-family: monospace;
}
```

**Verification:**
- Component renders input fields for `{{name}}` placeholders
- Component shows read-only field for `{{$id}}` with generated value
- Values update correctly when typing
- Duplicate placeholders only show one field

---

### 5. Integrate Placeholder Fields into Stanza Editor
**Priority:** 🔴 CRITICAL  
**Estimate:** 2-3 hours

**Description:**  
Integrate the PlaceholderFields component into the existing stanza editor in App.tsx.

**Tasks:**
- [x] Import and render placeholder fields (implemented inline in `App.tsx`)
- [x] Add placeholder values state
- [x] Show placeholder inputs above the stanza textarea when text contains placeholders
- [x] Resolve placeholders before sending stanza (supports `{}` and `${id-label}`)
- [x] Track generated IDs for response correlation

**Files to Modify:**
- `src/renderer/App.tsx`

**Notes on implementation:**
- Implemented within `App.tsx` (no separate component), using the shared placeholder parser.
- Inputs render whenever the stanza text contains placeholders; works for both loaded templates and freeform text.
- Resolution happens at send time; `${id-label}` is honored for any field and tracked for later correlation.

**Verification:**
- Placeholder inputs appear for `{placeholders}` in the editor.
- Values substitute correctly on send; alias-generated IDs are stored.

---

### 6. Create Performance Store
**Priority:** 🔴 CRITICAL  
**Estimate:** 3-4 hours

**Description:**  
Create a storage module for Performances, similar to accountStore and templateStore.

**Tasks:**
- [x] Create `src/main/performanceStore.ts`
- [x] Implement CRUD operations
- [x] Save to `performances.json` file
- [x] Add IPC handlers in main.ts

**New File - `src/main/performanceStore.ts`:**
```typescript
import fs from 'fs';
import path from 'path';
import type { Performance } from '../types/performance';

const performancesFile: string = path.join(__dirname, '../../performances.json');

export function loadPerformances(): Performance[] {
  try {
    if (fs.existsSync(performancesFile)) {
      const data = fs.readFileSync(performancesFile, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.performances || [];
    }
  } catch (error) {
    console.error('Error loading performances:', error);
  }
  return [];
}

export function savePerformances(performances: Performance[]): void {
  try {
    fs.writeFileSync(
      performancesFile, 
      JSON.stringify({ performances }, null, 2)
    );
  } catch (error) {
    console.error('Error saving performances:', error);
  }
}

export function getPerformance(performanceId: string): Performance | null {
  const performances = loadPerformances();
  return performances.find(p => p.id === performanceId) || null;
}

export function addPerformance(performance: Performance): void {
  const performances = loadPerformances();
  const existingIndex = performances.findIndex(p => p.id === performance.id);
  
  if (existingIndex >= 0) {
    performances[existingIndex] = {
      ...performance,
      updated: new Date().toISOString(),
    };
  } else {
    performances.push({
      ...performance,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });
  }
  
  savePerformances(performances);
}

export function deletePerformance(performanceId: string): void {
  const performances = loadPerformances();
  const filtered = performances.filter(p => p.id !== performanceId);
  savePerformances(filtered);
}

export function exportPerformance(performanceId: string, filePath: string): boolean {
  try {
    const performance = getPerformance(performanceId);
    if (!performance) {
      return false;
    }
    fs.writeFileSync(filePath, JSON.stringify(performance, null, 2));
    return true;
  } catch (error) {
    console.error('Error exporting performance:', error);
    return false;
  }
}

export function importPerformance(filePath: string): Performance | null {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const performance = JSON.parse(data) as Performance;
    
    // Generate new ID to avoid conflicts
    performance.id = `perf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    performance.created = new Date().toISOString();
    performance.updated = new Date().toISOString();
    
    addPerformance(performance);
    return performance;
  } catch (error) {
    console.error('Error importing performance:', error);
    return null;
  }
}
```

**Add IPC handlers to `src/main/main.ts`:**
```typescript
import {
  loadPerformances,
  getPerformance,
  addPerformance,
  deletePerformance,
  exportPerformance,
  importPerformance,
} from './performanceStore';

// Performance IPC handlers
ipcMain.handle('load-performances', async (): Promise<Performance[]> => {
  return loadPerformances();
});

ipcMain.handle('get-performance', async (_event, performanceId: string): Promise<Performance | null> => {
  return getPerformance(performanceId);
});

ipcMain.handle('save-performance', async (_event, performance: Performance): Promise<{ success: boolean }> => {
  addPerformance(performance);
  return { success: true };
});

ipcMain.handle('delete-performance', async (_event, performanceId: string): Promise<{ success: boolean }> => {
  deletePerformance(performanceId);
  return { success: true };
});

ipcMain.handle('export-performance', async (_event, performanceId: string, filePath: string): Promise<{ success: boolean }> => {
  const success = exportPerformance(performanceId, filePath);
  return { success };
});

ipcMain.handle('import-performance', async (_event, filePath: string): Promise<{ success: boolean; performance?: Performance }> => {
  const performance = importPerformance(filePath);
  return { success: !!performance, performance: performance || undefined };
});
```

**Update preload.ts:**
```typescript
// Add to VirtuosoAPI interface and implementation
loadPerformances: () => ipcRenderer.invoke('load-performances'),
getPerformance: (performanceId: string) => ipcRenderer.invoke('get-performance', performanceId),
savePerformance: (performance: unknown) => ipcRenderer.invoke('save-performance', performance),
deletePerformance: (performanceId: string) => ipcRenderer.invoke('delete-performance', performanceId),
exportPerformance: (performanceId: string, filePath: string) => ipcRenderer.invoke('export-performance', performanceId, filePath),
importPerformance: (filePath: string) => ipcRenderer.invoke('import-performance', filePath),
```

**Verification:**
- Can save a Performance
- Can load all Performances
- Can get a single Performance
- Can delete a Performance
- Can export to file
- Can import from file

**Notes:**
- Backend + IPC implemented and covered by unit tests (`src/main/__tests__/performanceStore.test.ts`); renderer/UI wiring is not yet implemented, so the feature is not exposed in the app.

---

### 7. Create Composer State Hook
**Priority:** 🔴 CRITICAL  
**Estimate:** 4-5 hours

**Description:**  
Create a React hook to manage Composer state (recording mode, captured stanzas, etc.).

**Tasks:**
- [x] Create `src/renderer/hooks/useComposer.ts`
- [x] Implement start/stop composing
- [x] Capture actions as stanzas
- [x] Generate Performance from captured stanzas
- [x] Handle account references

**Notes on implementation:**
- Implemented with a reducer-based hook in `src/renderer/hooks/useComposer.ts` and pure helpers for ID generation and performance building.
- Unit tests added at `src/renderer/hooks/__tests__/useComposer.test.ts` covering start/stop, stanza capture, account tracking, and performance generation.

**Verification:**
- Hook tracks composing state
- Can start/stop/cancel composing
- Captures connect actions
- Captures disconnect actions
- Captures send actions
- Generates valid Performance object

---

### 8. Create Performances Sidebar Component
**Priority:** 🔴 CRITICAL  
**Estimate:** 6-8 hours

**Description:**  
Create the right sidebar UI for Performances (list, compose button, recording state).

**Tasks:**
- [ ] Create `src/renderer/components/performances/PerformancesSidebar.tsx`
- [ ] Create `src/renderer/components/performances/PerformanceList.tsx`
- [ ] Create `src/renderer/components/performances/ComposerPanel.tsx`
- [ ] Create `src/renderer/components/performances/StanzaItem.tsx`
- [ ] Add styles

**New File - `src/renderer/components/performances/PerformancesSidebar.tsx`:**
```tsx
import React, { useState, useEffect } from 'react';
import { PerformanceList } from './PerformanceList';
import { ComposerPanel } from './ComposerPanel';
import type { Performance, Stanza } from '../../../types/performance';

interface PerformancesSidebarProps {
  isComposing: boolean;
  composedStanzas: Stanza[];
  onStartComposing: () => void;
  onStopComposing: () => void;
  onCancelComposing: () => void;
  onPlayPerformance: (performance: Performance) => void;
  onEditPerformance: (performance: Performance) => void;
  onDeletePerformance: (performanceId: string) => void;
}

export function PerformancesSidebar({
  isComposing,
  composedStanzas,
  onStartComposing,
  onStopComposing,
  onCancelComposing,
  onPlayPerformance,
  onEditPerformance,
  onDeletePerformance,
}: PerformancesSidebarProps): JSX.Element {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformances();
  }, []);

  const loadPerformances = async () => {
    setLoading(true);
    try {
      const loaded = await window.virtuoso.loadPerformances();
      setPerformances(loaded as Performance[]);
    } catch (error) {
      console.error('Failed to load performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (performanceId: string) => {
    await window.virtuoso.deletePerformance(performanceId);
    onDeletePerformance(performanceId);
    loadPerformances();
  };

  return (
    <div className="performances-sidebar">
      <div className="performances-sidebar-header">
        <h2>Performances</h2>
        {!isComposing && (
          <button 
            className="compose-button"
            onClick={onStartComposing}
          >
            + Compose New
          </button>
        )}
      </div>

      {isComposing ? (
        <ComposerPanel
          stanzas={composedStanzas}
          onStop={onStopComposing}
          onCancel={onCancelComposing}
        />
      ) : (
        <PerformanceList
          performances={performances}
          loading={loading}
          onPlay={onPlayPerformance}
          onEdit={onEditPerformance}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
```

**New File - `src/renderer/components/performances/PerformanceList.tsx`:**
```tsx
import React from 'react';
import type { Performance } from '../../../types/performance';

interface PerformanceListProps {
  performances: Performance[];
  loading: boolean;
  onPlay: (performance: Performance) => void;
  onEdit: (performance: Performance) => void;
  onDelete: (performanceId: string) => void;
}

export function PerformanceList({
  performances,
  loading,
  onPlay,
  onEdit,
  onDelete,
}: PerformanceListProps): JSX.Element {
  if (loading) {
    return <div className="performance-list-loading">Loading...</div>;
  }

  if (performances.length === 0) {
    return (
      <div className="performance-list-empty">
        <p>No performances yet.</p>
        <p className="hint">Click "Compose New" to create one.</p>
      </div>
    );
  }

  return (
    <div className="performance-list">
      {performances.map((performance) => (
        <div key={performance.id} className="performance-item">
          <div className="performance-item-info">
            <span className="performance-item-name">{performance.name}</span>
            <span className="performance-item-meta">
              {performance.stanzas.length} stanzas
            </span>
          </div>
          <div className="performance-item-actions">
            <button 
              className="btn-icon" 
              onClick={() => onPlay(performance)}
              title="Play"
            >
              ▶
            </button>
            <button 
              className="btn-icon" 
              onClick={() => onEdit(performance)}
              title="Edit"
            >
              ✎
            </button>
            <button 
              className="btn-icon btn-danger" 
              onClick={() => onDelete(performance.id)}
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**New File - `src/renderer/components/performances/ComposerPanel.tsx`:**
```tsx
import React from 'react';
import { StanzaItem } from './StanzaItem';
import type { Stanza } from '../../../types/performance';

interface ComposerPanelProps {
  stanzas: Stanza[];
  onStop: () => void;
  onCancel: () => void;
}

export function ComposerPanel({
  stanzas,
  onStop,
  onCancel,
}: ComposerPanelProps): JSX.Element {
  return (
    <div className="composer-panel">
      <div className="composer-indicator">
        <span className="recording-dot"></span>
        <span>Composing...</span>
      </div>

      <div className="composer-stanzas">
        {stanzas.length === 0 ? (
          <div className="composer-empty">
            <p>Perform actions to capture them.</p>
            <p className="hint">Connect, send stanzas, add assertions...</p>
          </div>
        ) : (
          stanzas.map((stanza, index) => (
            <StanzaItem 
              key={stanza.id} 
              stanza={stanza} 
              index={index + 1}
            />
          ))
        )}
      </div>

      <div className="composer-actions">
        <button 
          className="btn-primary"
          onClick={onStop}
          disabled={stanzas.length === 0}
        >
          Stop & Save
        </button>
        <button 
          className="btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

**New File - `src/renderer/components/performances/StanzaItem.tsx`:**
```tsx
import React from 'react';
import type { Stanza } from '../../../types/performance';

interface StanzaItemProps {
  stanza: Stanza;
  index: number;
  status?: 'pending' | 'running' | 'passed' | 'failed';
}

const TYPE_ICONS: Record<string, string> = {
  connect: '🔌',
  disconnect: '⏏',
  send: '📤',
  cue: '⏳',
  assert: '✓',
};

export function StanzaItem({ 
  stanza, 
  index,
  status = 'pending',
}: StanzaItemProps): JSX.Element {
  const icon = TYPE_ICONS[stanza.type] || '•';
  
  return (
    <div className={`stanza-item stanza-item-${status}`}>
      <span className="stanza-index">{index}</span>
      <span className="stanza-icon">{icon}</span>
      <span className="stanza-description">{stanza.description}</span>
      {status === 'passed' && <span className="stanza-status">✓</span>}
      {status === 'failed' && <span className="stanza-status">✗</span>}
    </div>
  );
}
```

**Verification:**
- Sidebar renders on the right side
- "Compose New" button starts composing
- Composing state shows recording indicator
- Captured stanzas appear in real-time
- Stop saves the Performance
- Cancel discards and exits
- Performance list shows saved Performances
- Can play/edit/delete Performances

---

### 9. Integrate Composer into Main App
**Priority:** 🔴 CRITICAL  
**Estimate:** 4-5 hours

**Description:**  
Wire up the Composer to capture actions from the main App.tsx.

**Tasks:**
- [ ] Add useComposer hook to App.tsx
- [ ] Pass composer callbacks to action handlers
- [ ] Add PerformancesSidebar to layout
- [ ] Update CSS for three-column layout
- [ ] Save Performance when composing stops

**Verification:**
- Three-column layout renders correctly
- Clicking connect while composing captures it
- Clicking disconnect while composing captures it
- Sending stanza while composing captures it
- Stopping saves Performance to list

---

### 10. Implement Basic Playback
**Priority:** 🔴 CRITICAL  
**Estimate:** 6-8 hours

**Description:**  
Create a basic playback engine that executes Stanzas sequentially.

**Tasks:**
- [ ] Create `src/main/performanceRunner.ts`
- [ ] Implement sequential stanza execution
- [ ] Handle connect/disconnect/send stanzas
- [ ] Add IPC handlers for playback
- [ ] Create basic playback UI

**New File - `src/main/performanceRunner.ts`:**
```typescript
import type { 
  Performance, 
  Stanza, 
  PlaybackResult, 
  StanzaResult 
} from '../types/performance';
import { connectAccount, disconnectAccount, sendStanza } from './xmppManager';
import { loadAccounts } from './accountStore';
import type { Account } from '../types/account';

interface RunnerCallbacks {
  onStanzaStart: (stanzaId: string) => void;
  onStanzaComplete: (result: StanzaResult) => void;
  onComplete: (result: PlaybackResult) => void;
  onError: (error: Error) => void;
}

export async function runPerformance(
  performance: Performance,
  callbacks: RunnerCallbacks
): Promise<PlaybackResult> {
  const startTime = new Date().toISOString();
  const stanzaResults: StanzaResult[] = [];
  const accounts = loadAccounts();
  
  // Map performance account aliases to actual accounts
  const accountMap = new Map<string, Account>();
  for (const ref of performance.accounts) {
    const account = accounts.find(a => a.jid === ref.jid || a.name === ref.alias);
    if (account) {
      accountMap.set(ref.alias, account);
    }
  }

  let hasFailure = false;

  for (const stanza of performance.stanzas) {
    callbacks.onStanzaStart(stanza.id);
    const stanzaStart = Date.now();

    try {
      const result = await executeStanza(stanza, accountMap, callbacks);
      stanzaResults.push(result);
      
      if (result.status === 'failed' || result.status === 'error') {
        hasFailure = true;
      }
      
      callbacks.onStanzaComplete(result);
    } catch (error) {
      const errorResult: StanzaResult = {
        stanzaId: stanza.id,
        status: 'error',
        duration: Date.now() - stanzaStart,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      stanzaResults.push(errorResult);
      hasFailure = true;
      callbacks.onStanzaComplete(errorResult);
    }
  }

  const endTime = new Date().toISOString();
  const result: PlaybackResult = {
    performanceId: performance.id,
    status: hasFailure ? 'failed' : 'passed',
    startTime,
    endTime,
    duration: Date.now() - new Date(startTime).getTime(),
    stanzaResults,
    summary: {
      total: stanzaResults.length,
      passed: stanzaResults.filter(r => r.status === 'passed').length,
      failed: stanzaResults.filter(r => r.status === 'failed').length,
      skipped: stanzaResults.filter(r => r.status === 'skipped').length,
    },
  };

  callbacks.onComplete(result);
  return result;
}

async function executeStanza(
  stanza: Stanza,
  accountMap: Map<string, Account>,
  callbacks: RunnerCallbacks
): Promise<StanzaResult> {
  const start = Date.now();
  const account = accountMap.get(stanza.accountAlias);

  if (!account && stanza.type !== 'assert') {
    return {
      stanzaId: stanza.id,
      status: 'error',
      duration: Date.now() - start,
      error: { message: `Account not found: ${stanza.accountAlias}` },
    };
  }

  switch (stanza.type) {
    case 'connect':
      await connectAccount(account!, (_accId, _xml) => {
        // Stanza received during playback - could be used for cues
      });
      return {
        stanzaId: stanza.id,
        status: 'passed',
        duration: Date.now() - start,
      };

    case 'disconnect':
      await disconnectAccount(account!.id);
      return {
        stanzaId: stanza.id,
        status: 'passed',
        duration: Date.now() - start,
      };

    case 'send':
      if (stanza.data.type === 'send') {
        await sendStanza(account!.id, stanza.data.xml);
        return {
          stanzaId: stanza.id,
          status: 'passed',
          duration: Date.now() - start,
          sentXml: stanza.data.xml,
        };
      }
      break;

    case 'cue':
      // TODO: Implement cue waiting in Sprint 2
      return {
        stanzaId: stanza.id,
        status: 'passed', // For now, just pass through
        duration: Date.now() - start,
      };

    case 'assert':
      // TODO: Implement assertions in Sprint 2
      return {
        stanzaId: stanza.id,
        status: 'passed', // For now, just pass through
        duration: Date.now() - start,
      };
  }

  return {
    stanzaId: stanza.id,
    status: 'error',
    duration: Date.now() - start,
    error: { message: `Unknown stanza type: ${stanza.type}` },
  };
}
```

**Verification:**
- Can play a Performance
- Connect stanzas work
- Disconnect stanzas work
- Send stanzas work
- Results displayed after playback

---

## 📊 Sprint Summary

| Task | Priority | Estimate | Dependencies |
|------|----------|----------|--------------|
| Performance type definitions | 🔴 CRITICAL | 2-3 hours | Sprint 0 |
| Placeholder type definitions | 🔴 CRITICAL | 1 hour | Sprint 0 |
| Placeholder parser | 🔴 CRITICAL | 3-4 hours | Types |
| PlaceholderFields component | 🔴 CRITICAL | 4-5 hours | Parser |
| Integrate into stanza editor | 🔴 CRITICAL | 2-3 hours | Component |
| Performance store | 🔴 CRITICAL | 3-4 hours | Types |
| useComposer hook | 🔴 CRITICAL | 4-5 hours | Types |
| Performances sidebar | 🔴 CRITICAL | 6-8 hours | Hook, Store |
| Integrate composer | 🔴 CRITICAL | 4-5 hours | Sidebar |
| Basic playback | 🔴 CRITICAL | 6-8 hours | Store, Runner |

**Total Estimate: 36-46 hours (2-3 weeks at 15-20 hours/week)**

---

## ✅ Definition of Done

- [ ] Template placeholders work (`{{name}}`, `{{$id}}`)
- [ ] Placeholder fields auto-generate in UI
- [ ] Can start/stop composing
- [ ] Actions captured during composing
- [ ] Performances saved to JSON
- [ ] Performance list displays in sidebar
- [ ] Basic playback executes stanzas
- [ ] All TypeScript compiles without errors
- [ ] Manual testing passes
