import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  addPerformance,
  deletePerformance,
  exportPerformance,
  getPerformance,
  importPerformance,
  loadPerformances,
  savePerformances,
  setPerformancesFile,
} from '../performanceStore';
import type { Performance } from '../../types/performance';

function makePerformance(overrides: Partial<Performance> = {}): Performance {
  return {
    id: 'perf_1',
    name: 'Test Performance',
    description: 'desc',
    version: '1.0.0',
    created: new Date('2023-01-01').toISOString(),
    updated: new Date('2023-01-01').toISOString(),
    accounts: [],
    stanzas: [],
    variables: {},
    tags: [],
    ...overrides,
  };
}

function tempFile(prefix: string): string {
  return path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe('performanceStore', () => {
  let storeFile: string;

  beforeEach(() => {
    storeFile = tempFile('performances');
    setPerformancesFile(storeFile);
    // start with an empty store file
    savePerformances([]);
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) {
      fs.unlinkSync(storeFile);
    }
  });

  it('returns empty list when store is empty', () => {
    const performances = loadPerformances();
    expect(performances).toEqual([]);
  });

  it('adds and retrieves a performance', () => {
    const perf = makePerformance();
    addPerformance(perf);

    const all = loadPerformances();
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe('Test Performance');

    const fetched = getPerformance(perf.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(perf.id);
  });

  it('updates an existing performance on id collision', () => {
    const perf = makePerformance();
    addPerformance(perf);

    const updated = { ...perf, name: 'Updated Name' };
    addPerformance(updated);

    const fetched = getPerformance(perf.id);
    expect(fetched?.name).toBe('Updated Name');
    expect(fetched?.updated).not.toBe(perf.updated); // updated timestamp should change
  });

  it('deletes a performance', () => {
    const perf = makePerformance();
    addPerformance(perf);
    deletePerformance(perf.id);

    const all = loadPerformances();
    expect(all).toHaveLength(0);
    expect(getPerformance(perf.id)).toBeNull();
  });

  it('exports and imports a performance with new id', () => {
    const perf = makePerformance();
    addPerformance(perf);

    const exportPath = tempFile('perf-export');
    const exported = exportPerformance(perf.id, exportPath);
    expect(exported).toBe(true);
    expect(fs.existsSync(exportPath)).toBe(true);

    const imported = importPerformance(exportPath);
    expect(imported).not.toBeNull();
    expect(imported?.id).not.toBe(perf.id);

    const all = loadPerformances();
    expect(all.some((p) => p.id === imported?.id)).toBe(true);

    fs.unlinkSync(exportPath);
  });
});
