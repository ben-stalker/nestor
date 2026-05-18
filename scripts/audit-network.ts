#!/usr/bin/env tsx
/**
 * Static scan for outbound network calls in server and client source.
 * Extracts literal URL strings and checks them against the allow-list.
 * Exit code 1 if violations found.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

// Documented allow-list — see docs/network-allowlist.md for rationale
const ALLOWED_HOSTS = [
  'api.open-meteo.com', // weather
  'api.github.com', // update polling
  'raw.githubusercontent.com', // release tarball download
  'oauth2.googleapis.com', // Google OAuth token exchange
  'www.googleapis.com', // Google Calendar API
  'apidata.googleusercontent.com', // Google user data
  'caldav.icloud.com', // Apple CalDAV
  'caldav.calendar.yahoo.com', // Yahoo CalDAV
  'localhost', // internal dev/test
  '127.0.0.1', // internal
  '0.0.0.0', // bind address
];

interface Violation {
  file: string;
  line: number;
  url: string;
}

function walkDir(dir: string, exts: string[]): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkDir(full, exts));
    } else if (exts.some((e) => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

function extractHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    const m = url.match(/https?:\/\/([^/?#:]+)/);
    return m ? m[1] : url;
  }
}

function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, 'utf8');
  const violations: Violation[] = [];

  for (const lineContent of content.split('\n').entries()) {
    const [lineIdx, line] = lineContent;
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
    // Skip the allowlist file itself
    if (filePath.includes('audit-network') || filePath.includes('network-allowlist')) continue;

    const urlPattern = /https?:\/\/(?:[a-z0-9.-]+\.[a-z]{2,})/gi;
    let match: RegExpExecArray | null;
    while ((match = urlPattern.exec(line)) !== null) {
      const url = match[0];
      const host = extractHost(url);
      // Allow template literals / env-var patterns (contain $ or dynamic parts)
      if (line.includes('${') || line.includes('process.env') || line.includes('Settings'))
        continue;
      if (!ALLOWED_HOSTS.some((a) => host === a || host.endsWith(`.${a}`))) {
        violations.push({ file: filePath, line: lineIdx + 1, url });
      }
    }
  }

  return violations;
}

const ROOT = path.join(import.meta.dirname ?? __dirname, '..');
const SOURCE_DIRS = [path.join(ROOT, 'server', 'src'), path.join(ROOT, 'client', 'src')];
const EXTENSIONS = ['.ts', '.tsx', '.js'];

let allViolations: Violation[] = [];
for (const dir of SOURCE_DIRS) {
  for (const file of walkDir(dir, EXTENSIONS)) {
    allViolations = allViolations.concat(scanFile(file));
  }
}

// De-duplicate
const seen = new Set<string>();
const unique = allViolations.filter((v) => {
  const key = `${v.file}:${v.line}:${v.url}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (unique.length > 0) {
  console.error('\n[network-audit] Undisclosed outbound URL(s) found:\n');
  for (const v of unique) {
    console.error(`  ${path.relative(ROOT, v.file)}:${v.line}  →  ${v.url}`);
  }
  console.error(
    '\nAdd to ALLOWED_HOSTS in scripts/audit-network.ts and docs/network-allowlist.md if intentional.',
  );
  process.exit(1);
} else {
  console.log('[network-audit] OK — no undisclosed outbound calls found.');
}
