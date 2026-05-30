import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const checkedExtensions = new Set(['.js', '.mjs', '.json', '.md', '.css']);
const ignoredDirs = new Set(['.git', 'node_modules']);

function extensionOf(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot);
}

async function collectFiles(dirUrl, files = []) {
  const entries = await readdir(dirUrl, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dirUrl);
    if (entry.isDirectory()) {
      await collectFiles(entryUrl, files);
      continue;
    }

    if (checkedExtensions.has(extensionOf(entry.name))) {
      files.push(entryUrl);
    }
  }

  return files;
}

const failures = [];
const files = await collectFiles(root);

for (const file of files) {
  const text = await readFile(file, 'utf8');
  const relativePath = file.pathname.replace(root.pathname, '');
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    if (/\s+$/.test(line)) {
      failures.push(`${relativePath}:${index + 1} trailing whitespace`);
    }
  });

  if (text.length > 0 && !text.endsWith('\n')) {
    failures.push(`${relativePath}: missing final newline`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`lint ok (${files.length} files checked from ${join(root.pathname)})`);
