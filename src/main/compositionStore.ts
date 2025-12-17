/**
 * Composition Store
 * Provides CRUD operations for saved Compositions
 */

import fs from 'fs';
import path from 'path';
import type { Composition } from '../types/composition';

// Store compositions alongside other JSON stores in the app root by default
let compositionsFile = path.join(__dirname, '../../compositions.json');

// Allow overriding the storage location (used in tests and for Electron userData path)
export function setCompositionsFile(filePath: string): void {
  compositionsFile = filePath;
}

export function loadCompositions(): Composition[] {
  try {
    if (fs.existsSync(compositionsFile)) {
      const data = fs.readFileSync(compositionsFile, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.compositions || [];
    }
  } catch (error) {
    console.error('[CompositionStore] Error loading compositions:', error);
  }
  return [];
}

export function saveCompositions(compositions: Composition[]): void {
  try {
    const dir = path.dirname(compositionsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(compositionsFile, JSON.stringify({ compositions }, null, 2));
    console.log(`[CompositionStore] Saved ${compositions.length} compositions at ${compositionsFile}`);
  } catch (error) {
    console.error('[CompositionStore] Error saving compositions:', error);
  }
}

export function getComposition(compositionId: string): Composition | null {
  const compositions = loadCompositions();
  return compositions.find((c) => c.id === compositionId) || null;
}

export function addComposition(composition: Composition): void {
  const compositions = loadCompositions();
  const existingIndex = compositions.findIndex((c) => c.id === composition.id);

  const timestamp = new Date().toISOString();

  if (existingIndex >= 0) {
    compositions[existingIndex] = {
      ...compositions[existingIndex],
      ...composition,
      updated: timestamp,
    };
  } else {
    compositions.push({
      ...composition,
      created: composition.created || timestamp,
      updated: timestamp,
    });
  }

  saveCompositions(compositions);
}

export function deleteComposition(compositionId: string): void {
  const compositions = loadCompositions();
  const filtered = compositions.filter((c) => c.id !== compositionId);
  saveCompositions(filtered);
}

export function exportComposition(compositionId: string, filePath: string): boolean {
  try {
    const composition = getComposition(compositionId);
    if (!composition) {
      return false;
    }
    fs.writeFileSync(filePath, JSON.stringify(composition, null, 2));
    return true;
  } catch (error) {
    console.error('[CompositionStore] Error exporting composition:', error);
    return false;
  }
}

export function importComposition(filePath: string): Composition | null {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const composition = JSON.parse(data) as Composition;

    // Generate new ID to avoid conflicts
    const timestamp = new Date().toISOString();
    const uniqueId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const normalized: Composition = {
      ...composition,
      id: uniqueId,
      created: timestamp,
      updated: timestamp,
    };

    addComposition(normalized);
    return normalized;
  } catch (error) {
    console.error('[CompositionStore] Error importing composition:', error);
    return null;
  }
}
