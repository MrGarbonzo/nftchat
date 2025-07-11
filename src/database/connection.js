const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { config } = require('../config/config');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    if (this.db) {
      return; // Already connected
    }
    
    const dbPath = path.resolve(config.database.path);
    const dbDir = path.dirname(dbPath);
    
    // Don't create directory for in-memory database
    if (dbPath !== ':memory:' && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Database connection failed', { error: err });
          reject(err);
        } else {
          logger.info('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database run error', { error: err, sql });
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database get error', { error: err, sql });
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database all error', { error: err, sql });
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    if (!this.db) {
      return; // Not connected
    }
    
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          logger.error('Database close error', { error: err });
          reject(err);
        } else {
          logger.info('Database connection closed');
          this.db = null;
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();