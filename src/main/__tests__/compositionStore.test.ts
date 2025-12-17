import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  addComposition,
  deleteComposition,
  exportComposition,
  getComposition,
  importComposition,
  loadCompositions,
  saveCompositions,
  setCompositionsFile,
} from '../compositionStore';
import type { Composition } from '../../types/composition';

function makeComposition(overrides: Partial<Composition> = {}): Composition {
  return {
    id: 'comp_1',
    name: 'Test Composition',
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

describe('compositionStore', () => {
  let storeFile: string;

  beforeEach(() => {
    storeFile = tempFile('compositions');
    setCompositionsFile(storeFile);
    // start with an empty store file
    saveCompositions([]);
  });

  afterEach(() => {
    if (fs.existsSync(storeFile)) {
      fs.unlinkSync(storeFile);
    }
  });

  it('returns empty list when store is empty', () => {
    const compositions = loadCompositions();
    expect(compositions).toEqual([]);
  });

  it('adds and retrieves a composition', () => {
    const comp = makeComposition();
    addComposition(comp);

    const all = loadCompositions();
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe('Test Composition');

    const fetched = getComposition(comp.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(comp.id);
  });

  it('updates an existing composition on id collision', () => {
    const comp = makeComposition();
    addComposition(comp);

    const updated = { ...comp, name: 'Updated Name' };
    addComposition(updated);

    const fetched = getComposition(comp.id);
    expect(fetched?.name).toBe('Updated Name');
    expect(fetched?.updated).not.toBe(comp.updated); // updated timestamp should change
  });

  it('deletes a composition', () => {
    const comp = makeComposition();
    addComposition(comp);
    deleteComposition(comp.id);

    const all = loadCompositions();
    expect(all).toHaveLength(0);
    expect(getComposition(comp.id)).toBeNull();
  });

  it('exports and imports a composition with new id', () => {
    const comp = makeComposition();
    addComposition(comp);

    const exportPath = tempFile('comp-export');
    const exported = exportComposition(comp.id, exportPath);
    expect(exported).toBe(true);
    expect(fs.existsSync(exportPath)).toBe(true);

    // Import as new composition
    const importedComp = importComposition(exportPath);
    expect(importedComp).not.toBeNull();
    expect(importedComp?.id).not.toBe(comp.id);

    // Should now have 2 compositions
    const all = loadCompositions();
    expect(all).toHaveLength(2);

    // Cleanup
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  });

  it('returns null and false for nonexistent compositions', () => {
    expect(getComposition('nope')).toBeNull();
    expect(exportComposition('nope', tempFile('nope'))).toBe(false);
  });
});
