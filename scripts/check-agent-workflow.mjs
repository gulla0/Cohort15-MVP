import { readFile } from 'node:fs/promises';

const issueIndexUrl = new URL('../agent/feedback/issue-index.md', import.meta.url);
const knowledgeIndexUrl = new URL('../agent/knowledge/index.md', import.meta.url);

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

const [issueIndexText, knowledgeIndexText] = await Promise.all([
  readFile(issueIndexUrl, 'utf8'),
  readFile(knowledgeIndexUrl, 'utf8')
]);

const doneIssueIds = parseDoneIssueIds(issueIndexText);
const missingIssueIds = doneIssueIds.filter((issueId) => !knowledgeIndexText.includes(issueId));

if (missingIssueIds.length > 0) {
  console.error(
    [
      'agent workflow check failed:',
      `Resolved feedback issues missing from agent/knowledge/index.md: ${missingIssueIds.join(', ')}`,
      'Update the knowledge index with reusable context, or explain why the issue does not create reusable context.'
    ].join('\n')
  );
  process.exit(1);
}

console.log(`agent workflow ok (${doneIssueIds.length} resolved feedback issues reflected in knowledge index)`);
