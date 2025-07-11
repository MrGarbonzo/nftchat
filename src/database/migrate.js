const fs = require('fs').promises;
const path = require('path');
const db = require('./connection');
const logger = require('../utils/logger');

async function runMigrations() {
  try {
    await db.connect();
    
    await db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    for (const file of sqlFiles) {
      const existing = await db.get(
        'SELECT * FROM migrations WHERE filename = ?',
        [file]
      );
      
      if (!existing) {
        logger.info(`Running migration: ${file}`);
        const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        
        const statements = sql.split(';').filter(s => s.trim());
        for (const statement of statements) {
          await db.run(statement);
        }
        
        await db.run(
          'INSERT INTO migrations (filename) VALUES (?)',
          [file]
        );
        
        logger.info(`Migration completed: ${file}`);
      } else {
        logger.info(`Migration already executed: ${file}`);
      }
    }
    
    logger.info('All migrations completed');
    await db.close();
    
  } catch (error) {
    logger.error('Migration failed', { error });
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;