import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(__dirname, 'orchestrator.log');
fs.writeFileSync(LOG, '');
const out = (m) => fs.appendFileSync(LOG, String(m) + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ping() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2000);
    const r = await fetch('http://localhost:4000/', { signal: ctl.signal });
    clearTimeout(t);
    return r.ok;
  } catch { return false; }
}

// Refuse to test against a stale server: anything already listening is ours to replace
const [oldPid] = await (async () => {
  try {
    const { execSync } = await import('child_process');
    const raw = execSync('netstat -ano | findstr ":4000" | findstr "LISTENING"', { encoding: 'utf8' });
    return [raw.trim().split(/\s+/).pop()];
  } catch { return [null]; }
})();
if (oldPid) {
  out(`killing stale server pid=${oldPid}`);
  try { process.kill(Number(oldPid), 'SIGTERM'); } catch (e) { out('kill failed: ' + e.message); }
  await sleep(1500);
}

out('starting server (cwd=' + __dirname + ')');
const server = spawn(process.execPath, ['src/index.js'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', (d) => out('SERVER: ' + d.toString().trim()));
server.stderr.on('data', (d) => out('SERVER_ERR: ' + d.toString().trim()));
server.on('exit', (c) => out('SERVER_EXIT code=' + c));

let ready = false;
for (let i = 0; i < 40; i++) {
  await sleep(1000);
  if (await ping()) { ready = true; break; }
  if (server.exitCode !== null) break;
}
out('ready=' + ready);

if (!ready) {
  out('SERVER FAILED TO START');
  try { server.kill(); } catch {}
  process.exit(1);
}

const test = spawn(process.execPath, ['verify-phase3.mjs'], { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'] });
let testOut = '';
test.stdout.on('data', (d) => { testOut += d.toString(); });
test.stderr.on('data', (d) => { testOut += d.toString(); });
const code = await new Promise((res) => test.on('exit', res));
out('TEST_EXIT=' + code);
out('---- test output ----');
out(testOut);

try { server.kill(); } catch {}
out('done');
process.exit(code);
