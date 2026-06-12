'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');
const { ScoreStore, MAX_ENTRIES } = require('../../src/server/models/ScoreStore');

const tmpFile = (suffix) =>
  path.join(os.tmpdir(), `red-tetris-scorestore-${process.pid}-${suffix}.json`);

const cleanup = (file) => {
  try { fs.unlinkSync(file); } catch (e) { /* ignore */ }
};

describe('ScoreStore', () => {
  let file;
  let store;

  beforeEach(() => {
    file = tmpFile(Math.random().toString(36).slice(2));
    cleanup(file);
    store = new ScoreStore(file);
  });

  afterEach(() => cleanup(file));

  it('starts empty when no file exists', () => {
    expect(store.toJSON()).toEqual([]);
    expect(store.top()).toEqual([]);
  });

  it('records a valid score', () => {
    const rec = store.record({ name: 'Alice', score: 1200, room: 'r1' });
    expect(rec).toMatchObject({ name: 'Alice', score: 1200, room: 'r1' });
    expect(rec.date).toBeDefined();
    expect(store.top()).toHaveLength(1);
  });

  it('keeps scores sorted descending', () => {
    store.record({ name: 'A', score: 100 });
    store.record({ name: 'B', score: 500 });
    store.record({ name: 'C', score: 300 });
    const top = store.top();
    expect(top.map((s) => s.score)).toEqual([500, 300, 100]);
  });

  it('top(n) limits the number of entries returned', () => {
    for (let i = 1; i <= 5; i++) store.record({ name: `P${i}`, score: i * 10 });
    expect(store.top(2)).toHaveLength(2);
    expect(store.top(2)[0].score).toBe(50);
  });

  it('top() defaults to 10 entries', () => {
    for (let i = 1; i <= 15; i++) store.record({ name: `P${i}`, score: i });
    expect(store.top()).toHaveLength(10);
  });

  it('caps stored entries at MAX_ENTRIES', () => {
    for (let i = 1; i <= MAX_ENTRIES + 10; i++) store.record({ name: `P${i}`, score: i });
    expect(store.toJSON().length).toBe(MAX_ENTRIES);
  });

  it('rejects invalid entries', () => {
    expect(store.record(null)).toBeNull();
    expect(store.record({ name: '', score: 100 })).toBeNull();
    expect(store.record({ name: 'X', score: 0 })).toBeNull();
    expect(store.record({ name: 'X', score: -5 })).toBeNull();
    expect(store.record({ name: 'X', score: 'abc' })).toBeNull();
    expect(store.record({ name: 'X' })).toBeNull();
    expect(store.top()).toHaveLength(0);
  });

  it('trims name and floors score', () => {
    const rec = store.record({ name: '  Bob  ', score: 99.9 });
    expect(rec.name).toBe('Bob');
    expect(rec.score).toBe(99);
  });

  it('persists to disk and reloads', () => {
    store.record({ name: 'Alice', score: 800 });
    const reloaded = new ScoreStore(file);
    expect(reloaded.top()).toHaveLength(1);
    expect(reloaded.top()[0]).toMatchObject({ name: 'Alice', score: 800 });
  });

  it('clear empties the leaderboard', () => {
    store.record({ name: 'Alice', score: 800 });
    store.clear();
    expect(store.top()).toEqual([]);
    const reloaded = new ScoreStore(file);
    expect(reloaded.top()).toEqual([]);
  });

  it('handles a corrupted file gracefully', () => {
    fs.writeFileSync(file, 'not valid json {');
    const corrupted = new ScoreStore(file);
    expect(corrupted.top()).toEqual([]);
  });

  it('ignores a non-array JSON file', () => {
    fs.writeFileSync(file, JSON.stringify({ foo: 'bar' }));
    const weird = new ScoreStore(file);
    expect(weird.top()).toEqual([]);
  });

  it('uses a default file path when none provided', () => {
    const def = new ScoreStore();
    expect(typeof def.filePath).toBe('string');
    expect(def.filePath).toMatch(/scores\.json$/);
  });
});
