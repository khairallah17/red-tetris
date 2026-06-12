'use strict';

const fs = require('fs');
const path = require('path');

const MAX_ENTRIES = 20;

// Persistent leaderboard. Scores are kept sorted (highest first) and written
// to a JSON file so they survive server restarts.
function ScoreStore(filePath) {
  this.filePath = filePath || path.join(__dirname, '../../../data/scores.json');
  this.scores = [];
  this.load();
}

ScoreStore.prototype.load = function () {
  try {
    const raw = fs.readFileSync(this.filePath, 'utf8');
    const parsed = JSON.parse(raw);
    this.scores = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // Missing or unreadable file → start empty.
    this.scores = [];
  }
  return this.scores;
};

ScoreStore.prototype.save = function () {
  try {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.scores, null, 2));
    return true;
  } catch (e) {
    return false;
  }
};

// Record a finished game's score. Ignores invalid entries and zero scores.
ScoreStore.prototype.record = function (entry) {
  if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) return null;
  const score = Number(entry.score);
  if (!Number.isFinite(score) || score <= 0) return null;

  const record = {
    name: entry.name.trim().slice(0, 24),
    score: Math.floor(score),
    room: typeof entry.room === 'string' ? entry.room : null,
    date: new Date().toISOString(),
  };

  this.scores.push(record);
  this.scores.sort((a, b) => b.score - a.score);
  this.scores = this.scores.slice(0, MAX_ENTRIES);
  this.save();
  return record;
};

// Top N entries (defaults to 10).
ScoreStore.prototype.top = function (n) {
  const count = Number.isFinite(n) && n > 0 ? Math.floor(n) : 10;
  return this.scores.slice(0, count);
};

ScoreStore.prototype.clear = function () {
  this.scores = [];
  this.save();
};

ScoreStore.prototype.toJSON = function () {
  return this.scores.map((s) => ({ ...s }));
};

module.exports = { ScoreStore, MAX_ENTRIES };
