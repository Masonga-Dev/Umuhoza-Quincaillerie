import fs from 'fs';
const out = [];
const log = (m) => out.push(String(m));

log('start ' + new Date().toISOString());
try {
  const mod = await import('./src/config/db.js');
  log('db module loaded');
  await mod.initDb();
  log('initDb OK');
} catch (e) {
  log('ERROR: ' + (e && e.stack ? e.stack : e));
}
fs.writeFileSync('boot-check.txt', out.join('\n'));
process.exit(0);