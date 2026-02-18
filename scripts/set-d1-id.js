/**
 * Run: node scripts/set-d1-id.js
 * Fetches your D1 database ID and updates wrangler.toml.
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const wranglerPath = path.join(root, 'wrangler.toml');

const out = execSync('npx wrangler d1 list --json', { cwd: root, encoding: 'utf-8' });
const list = JSON.parse(out);
const db = list.find(d => d.name === 'nonfictionfooty-db');
if (!db || !db.uuid) {
  console.error('Could not find nonfictionfooty-db. Run: npx wrangler d1 create nonfictionfooty-db');
  process.exit(1);
}

let toml = readFileSync(wranglerPath, 'utf-8');
toml = toml.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${db.uuid}"`);
writeFileSync(wranglerPath, toml);
console.log('Updated wrangler.toml with database_id:', db.uuid);
