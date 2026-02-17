const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Get database path (same as app uses)
const dbPath = path.join(os.homedir(), 'Library', 'Application Support', 'socialsync', 'socialsync.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Check accounts table
  console.log('\n=== Connected Accounts ===');
  const accounts = db.prepare('SELECT * FROM accounts').all();
  console.log(accounts);
  
  // Check schedules table
  console.log('\n=== Schedules ===');
  const schedules = db.prepare('SELECT * FROM schedules').all();
  console.log(schedules);
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
