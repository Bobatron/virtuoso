/**
 * Performance Store
 * Provides CRUD operations for saved Performances
 */

import fs from 'fs';
import path from 'path';
import type { Performance } from '../types/performance';

// Store performances alongside other JSON stores in the app root by default
let performancesFile = path.join(__dirname, '../../performances.json');

// Allow overriding the storage location (used in tests to avoid touching real files)
export function setPerformancesFile(filePath: string): void {
  performancesFile = filePath;
}

export function loadPerformances(): Performance[] {
  try {
    if (fs.existsSync(performancesFile)) {
      const data = fs.readFileSync(performancesFile, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.performances || [];
    }
  } catch (error) {
    console.error('[PerformanceStore] Error loading performances:', error);
  }
  return [];
}

export function savePerformances(performances: Performance[]): void {
  try {
    fs.writeFileSync(performancesFile, JSON.stringify({ performances }, null, 2));
    console.log(`[PerformanceStore] Saved ${performances.length} performances`);
  } catch (error) {
    console.error('[PerformanceStore] Error saving performances:', error);
  }
}

export function getPerformance(performanceId: string): Performance | null {
  const performances = loadPerformances();
  return performances.find((p) => p.id === performanceId) || null;
}

export function addPerformance(performance: Performance): void {
  const performances = loadPerformances();
  const existingIndex = performances.findIndex((p) => p.id === performance.id);

  const timestamp = new Date().toISOString();

  if (existingIndex >= 0) {
    performances[existingIndex] = {
      ...performances[existingIndex],
      ...performance,
      updated: timestamp,
    };
  } else {
    performances.push({
      ...performance,
      created: performance.created || timestamp,
      updated: timestamp,
    });
  }

  savePerformances(performances);
}

export function deletePerformance(performanceId: string): void {
  const performances = loadPerformances();
  const filtered = performances.filter((p) => p.id !== performanceId);
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
    console.error('[PerformanceStore] Error exporting performance:', error);
    return false;
  }
}

export function importPerformance(filePath: string): Performance | null {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const performance = JSON.parse(data) as Performance;

    // Generate new ID to avoid conflicts
    const timestamp = new Date().toISOString();
    const uniqueId = `perf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const normalized: Performance = {
      ...performance,
      id: uniqueId,
      created: timestamp,
      updated: timestamp,
    };

    addPerformance(normalized);
    return normalized;
  } catch (error) {
    console.error('[PerformanceStore] Error importing performance:', error);
    return null;
  }
}
