import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && full.endsWith('.md')) files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function slug(text) {
  return text.trim().toLowerCase()
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function anchorsFor(file) {
  const text = fs.readFileSync(file, 'utf8');
  const anchors = new Set();
  for (const line of text.split('\n')) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (m) anchors.add(slug(m[2]));
  }
  return anchors;
}

function checkTaskMetadata() {
  const taskFiles = walk(path.join(root, 'docs', 'tasks'));
  const taskHeading = /^###\s+(P1-[A-Z]+-\d{4})\s+—\s+(.+)$/gm;
  for (const file of taskFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const matches = [...text.matchAll(taskHeading)];
    for (let i = 0; i < matches.length; i += 1) {
      const current = matches[i];
      const next = matches[i + 1];
      const section = text.slice(current.index, next?.index ?? text.length);
      const id = current[1];
      for (const required of ['**Relevant ADRs:**', '**Dependencies:**', '**Acceptance criteria:**']) {
        if (!section.includes(required)) {
          failures.push(`${rel(file)}: task ${id} is missing ${required}`);
        }
      }
    }
  }
}

function checkLinks() {
  const mdFiles = walk(root);
  const anchorCache = new Map();
  const linkPattern = /(?<!!)(?:\[[^\]]+\])\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const file of mdFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(linkPattern)) {
      const raw = match[1];
      if (/^(https?:|mailto:|#)/.test(raw)) continue;
      const [targetPath, fragment] = raw.split('#');
      if (!targetPath) continue;
      const decodedPath = decodeURIComponent(targetPath);
      const target = path.resolve(path.dirname(file), decodedPath);
      if (!target.startsWith(root)) {
        failures.push(`${rel(file)}: link escapes repository: ${raw}`);
        continue;
      }
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        failures.push(`${rel(file)}: broken relative link: ${raw}`);
        continue;
      }
      if (fragment && target.endsWith('.md')) {
        if (!anchorCache.has(target)) anchorCache.set(target, anchorsFor(target));
        if (!anchorCache.get(target).has(fragment)) {
          failures.push(`${rel(file)}: missing anchor #${fragment} in ${rel(target)}`);
        }
      }
    }
  }
}

checkTaskMetadata();
checkLinks();

if (failures.length > 0) {
  console.error('Documentation checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Documentation checks passed.');
