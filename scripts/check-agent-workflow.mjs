import { readdir, readFile } from 'node:fs/promises';

const repositoryUrl = new URL('../', import.meta.url);
const issueIndexUrl = new URL('../agent/feedback/issue-index.md', import.meta.url);
const knowledgeIndexUrl = new URL('../agent/knowledge/index.md', import.meta.url);
const humanTasksUrl = new URL('../docs/human-tasks/', import.meta.url);
const humanTasksIndexUrl = new URL('README.md', humanTasksUrl);

const ignoredDirectories = new Set(['.git', 'coverage', 'dist', 'node_modules']);

async function listMarkdownFiles(directoryUrl, relativeDirectory = '') {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);

    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(entryUrl, relativePath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push({ relativePath, url: entryUrl });
    }
  }

  return files;
}

function parseDoneIssueIds(issueIndexText) {
  const issueIds = [];

  for (const line of issueIndexText.split('\n')) {
    if (!line.startsWith('| ISSUE-')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    const [issueId, , status] = cells;

    if (status === 'done') {
      issueIds.push(issueId);
    }
  }

  return issueIds;
}

const [issueIndexText, knowledgeIndexText, humanTasksIndexText, markdownFiles, humanTaskEntries] =
  await Promise.all([
  readFile(issueIndexUrl, 'utf8'),
  readFile(knowledgeIndexUrl, 'utf8'),
  readFile(humanTasksIndexUrl, 'utf8'),
  listMarkdownFiles(repositoryUrl),
  readdir(humanTasksUrl, { withFileTypes: true })
  ]);

const doneIssueIds = parseDoneIssueIds(issueIndexText);
const missingIssueIds = doneIssueIds.filter((issueId) => !knowledgeIndexText.includes(issueId));
const humanSetupHeading = /^## Human Setup Checklist\s*$/m;
const misplacedHumanTaskFiles = [];

for (const file of markdownFiles) {
  if (file.relativePath.startsWith('docs/human-tasks/')) {
    continue;
  }

  const text = await readFile(file.url, 'utf8');
  if (humanSetupHeading.test(text)) {
    misplacedHumanTaskFiles.push(file.relativePath);
  }
}

const unindexedHumanTaskFiles = humanTaskEntries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
  .map((entry) => entry.name)
  .filter((fileName) => !humanTasksIndexText.includes(`\`${fileName}\``));

const malformedHumanTaskFiles = [];
for (const entry of humanTaskEntries) {
  if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'README.md') {
    continue;
  }

  const text = await readFile(new URL(entry.name, humanTasksUrl), 'utf8');
  if (!humanSetupHeading.test(text)) {
    malformedHumanTaskFiles.push(entry.name);
  }
}

const failures = [];

if (missingIssueIds.length > 0) {
  failures.push(
    `Resolved feedback issues missing from agent/knowledge/index.md: ${missingIssueIds.join(', ')}`
  );
}

if (misplacedHumanTaskFiles.length > 0) {
  failures.push(
    `Human Setup Checklists outside docs/human-tasks/: ${misplacedHumanTaskFiles.join(', ')}`
  );
}

if (unindexedHumanTaskFiles.length > 0) {
  failures.push(
    `Human-task files missing from docs/human-tasks/README.md: ${unindexedHumanTaskFiles.join(', ')}`
  );
}

if (malformedHumanTaskFiles.length > 0) {
  failures.push(
    `Human-task files missing a "## Human Setup Checklist" section: ${malformedHumanTaskFiles.join(', ')}`
  );
}

if (failures.length > 0) {
  console.error(['agent workflow check failed:', ...failures].join('\n'));
  process.exit(1);
}

const humanTaskCount = humanTaskEntries.filter(
  (entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md'
).length;

console.log(
  `agent workflow ok (${doneIssueIds.length} resolved feedback issues reflected in knowledge index; ${humanTaskCount} indexed human-task files)`
);
