import { access, readdir, readFile } from 'node:fs/promises';

const repositoryUrl = new URL('../', import.meta.url);
const issueIndexUrl = new URL('../agent/feedback/issue-index.md', import.meta.url);
const feedbackIssuesUrl = new URL('../agent/feedback/issues/', import.meta.url);
const knowledgeIndexUrl = new URL('../agent/knowledge/index.md', import.meta.url);
const startUrl = new URL('../start.txt', import.meta.url);
const maintenanceStarterUrl = new URL('../agent-starters/startWorkflowMaintenanceManager.txt', import.meta.url);
const humanTasksUrl = new URL('../docs/human-tasks/', import.meta.url);
const humanTasksIndexUrl = new URL('README.md', humanTasksUrl);
const tasksUrl = new URL('../tasks.json', import.meta.url);
const taskGraphUrl = new URL('../atomic-task-graph.md', import.meta.url);
const taskStatusUrl = new URL('../agent/progress/task-status.md', import.meta.url);
const workflowStatusUrls = new Map([
  ['README.md', new URL('../README.md', import.meta.url)],
  ['plan.md', new URL('../plan.md', import.meta.url)],
  ['workflow-sheet.md', new URL('../workflow-sheet.md', import.meta.url)],
  ['agent/progress/task-status.md', taskStatusUrl]
]);

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

function parseIssueRows(issueIndexText) {
  const issues = [];

  for (const line of issueIndexText.split('\n')) {
    if (!line.startsWith('| ISSUE-')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    const [issueId, title, status, folder] = cells;
    issues.push({
      issueId,
      title,
      status,
      folder: folder?.replaceAll('`', '').replace(/\/$/, '')
    });
  }

  return issues;
}

const requiredTaskFields = [
  'id',
  'title',
  'status',
  'dependencies',
  'objective',
  'inputs',
  'write_scope',
  'authority',
  'acceptance_criteria',
  'verification',
  'stop_condition'
];

function parseTaskLedger(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`tasks.json is invalid JSON: ${error.message}`);
  }
}

function validateTaskLedger(ledger) {
  const errors = [];
  const tasks = Array.isArray(ledger?.tasks) ? ledger.tasks : [];

  if (tasks.length === 0) {
    return ['tasks.json must contain at least one task.'];
  }

  const ids = new Set();
  const taskById = new Map();
  const allowedStatuses = new Set(['not_started', 'in_progress', 'blocked', 'done']);
  let inProgressCount = 0;

  for (const task of tasks) {
    for (const field of requiredTaskFields) {
      if (!(field in task)) {
        errors.push(`${task.id ?? 'unknown task'} is missing required field ${field}.`);
      }
    }

    if (typeof task.id !== 'string' || task.id.trim().length === 0) {
      errors.push('Every task must have a non-empty string id.');
      continue;
    }

    if (ids.has(task.id)) {
      errors.push(`Duplicate task id: ${task.id}.`);
    }
    ids.add(task.id);
    taskById.set(task.id, task);

    if (!allowedStatuses.has(task.status)) {
      errors.push(`${task.id} has invalid status ${task.status}.`);
    }
    if (task.status === 'in_progress') {
      inProgressCount += 1;
    }

    for (const field of ['title', 'objective', 'stop_condition']) {
      if (typeof task[field] !== 'string' || task[field].trim().length === 0) {
        errors.push(`${task.id}.${field} must be a non-empty string.`);
      }
    }

    for (const field of ['inputs', 'write_scope', 'authority', 'acceptance_criteria', 'verification']) {
      if (!Array.isArray(task[field]) || task[field].length === 0) {
        errors.push(`${task.id}.${field} must be a non-empty array.`);
      } else if (task[field].some((item) => typeof item !== 'string' || item.trim().length === 0)) {
        errors.push(`${task.id}.${field} may contain only non-empty strings.`);
      }
    }

    if (!Array.isArray(task.dependencies)) {
      errors.push(`${task.id}.dependencies must be an array.`);
    } else if (new Set(task.dependencies).size !== task.dependencies.length) {
      errors.push(`${task.id}.dependencies must not contain duplicates.`);
    }
  }

  if (inProgressCount > 1) {
    errors.push(`At most one task may be in_progress; found ${inProgressCount}.`);
  }

  for (const task of tasks) {
    for (const dependency of task.dependencies ?? []) {
      if (!taskById.has(dependency)) {
        errors.push(`${task.id} has unknown dependency ${dependency}.`);
      } else if (dependency === task.id) {
        errors.push(`${task.id} cannot depend on itself.`);
      } else if (task.status === 'done' && taskById.get(dependency).status !== 'done') {
        errors.push(`${task.id} is done while dependency ${dependency} is not done.`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(taskId) {
    if (visiting.has(taskId)) {
      errors.push(`Task dependency cycle includes ${taskId}.`);
      return;
    }
    if (visited.has(taskId)) {
      return;
    }
    visiting.add(taskId);
    for (const dependency of taskById.get(taskId)?.dependencies ?? []) {
      if (taskById.has(dependency)) {
        visit(dependency);
      }
    }
    visiting.delete(taskId);
    visited.add(taskId);
  }

  for (const taskId of ids) {
    visit(taskId);
  }

  return errors;
}

const requiredIssueFiles = [
  'issue.md',
  'tasks.json',
  'task-graph.md',
  'task-status.md',
  'session-notes.md',
  'change-log.md',
  'blockers.md'
];

async function validateFeedbackIssues(issueRows) {
  const errors = [];
  const indexedFolders = new Set();
  const allowedIssueStatuses = new Set(['not_started', 'in_progress', 'blocked', 'done']);

  for (const issue of issueRows) {
    if (!allowedIssueStatuses.has(issue.status)) {
      errors.push(`${issue.issueId} has invalid issue status ${issue.status}.`);
    }
    if (!issue.folder?.startsWith('agent/feedback/issues/')) {
      errors.push(`${issue.issueId} must point to a folder under agent/feedback/issues/.`);
      continue;
    }
    if (indexedFolders.has(issue.folder)) {
      errors.push(`Duplicate feedback folder in issue index: ${issue.folder}.`);
      continue;
    }
    indexedFolders.add(issue.folder);

    const folderUrl = new URL(`../${issue.folder}/`, import.meta.url);
    for (const fileName of requiredIssueFiles) {
      try {
        await access(new URL(fileName, folderUrl));
      } catch {
        errors.push(`${issue.issueId} is missing ${issue.folder}/${fileName}.`);
      }
    }

    try {
      const ledger = parseTaskLedger(await readFile(new URL('tasks.json', folderUrl), 'utf8'));
      errors.push(...validateTaskLedger(ledger).map((error) => `${issue.issueId}: ${error}`));
      for (const task of ledger.tasks ?? []) {
        if (typeof task.risk !== 'string' || task.risk.trim().length === 0) {
          errors.push(`${issue.issueId}: ${task.id ?? 'unknown task'}.risk must be a non-empty string.`);
        }
      }
      if (ledger.issue_id && ledger.issue_id !== issue.issueId) {
        errors.push(`${issue.issueId} folder ledger declares issue_id ${ledger.issue_id}.`);
      }
      if (issue.status === 'done' && (ledger.tasks ?? []).some((task) => task.status !== 'done')) {
        errors.push(`${issue.issueId} is done while one or more issue tasks are not done.`);
      }
    } catch (error) {
      errors.push(`${issue.issueId} tasks.json could not be validated: ${error.message}`);
    }
  }

  const issueEntries = await readdir(feedbackIssuesUrl, { withFileTypes: true });
  for (const entry of issueEntries) {
    if (!entry.isDirectory()) continue;
    const folder = `agent/feedback/issues/${entry.name}`;
    try {
      await access(new URL('tasks.json', new URL(`${entry.name}/`, feedbackIssuesUrl)));
      if (!indexedFolders.has(folder)) {
        errors.push(`Feedback folder with tasks.json is missing from issue index: ${folder}.`);
      }
    } catch {
      // Empty legacy directories do not participate in the active workflow.
    }
  }

  return errors;
}

function parseTaskStatus(text) {
  const statuses = new Map();
  for (const line of text.split('\n')) {
    if (!line.startsWith('| L')) {
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length >= 4) {
      statuses.set(cells[0], {
        status: cells[2],
        dependenciesReady: cells[3]
      });
    }
  }
  return statuses;
}

function parseTaskGraphStatuses(text) {
  const statuses = new Map();
  const executionGraph = text.match(/## Execution Graph\s+```text\s+([\s\S]*?)```/)?.[1] ?? '';

  for (const line of executionGraph.split('\n')) {
    const match = line.match(/\b(L\d{3})\b.*\((not_started|in_progress|blocked|done)\)\s*$/);
    if (match) {
      statuses.set(match[1], match[2]);
    }
  }

  return statuses;
}

function findReadyTasks(tasks) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  return tasks.filter((task) => task.status === 'not_started'
    && task.dependencies.every((dependency) => taskById.get(dependency)?.status === 'done'));
}

function looksLikeRepositoryInput(value) {
  return typeof value === 'string'
    && !/^https?:\/\//.test(value)
    && (value.startsWith('/') || value.includes('/') || /\.[a-z0-9]+$/i.test(value));
}

async function findMissingReadyTaskInputs(tasks) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const missing = [];

  for (const task of tasks) {
    const isReady = task.status === 'not_started'
      && task.dependencies.every((dependency) => taskById.get(dependency)?.status === 'done');
    if (!isReady) {
      continue;
    }

    for (const input of task.inputs) {
      if (!looksLikeRepositoryInput(input)) {
        continue;
      }
      const inputUrl = input.startsWith('/') ? input : new URL(input, repositoryUrl);
      try {
        await access(inputUrl);
      } catch {
        missing.push(`${task.id}: ${input}`);
      }
    }
  }

  return missing;
}

const [
  issueIndexText,
  knowledgeIndexText,
  startText,
  humanTasksIndexText,
  markdownFiles,
  humanTaskEntries,
  tasksText,
  taskGraphText,
  taskStatusText,
  workflowStatusTexts
] =
  await Promise.all([
  readFile(issueIndexUrl, 'utf8'),
  readFile(knowledgeIndexUrl, 'utf8'),
  readFile(startUrl, 'utf8'),
  readFile(humanTasksIndexUrl, 'utf8'),
  listMarkdownFiles(repositoryUrl),
  readdir(humanTasksUrl, { withFileTypes: true }),
  readFile(tasksUrl, 'utf8'),
  readFile(taskGraphUrl, 'utf8'),
  readFile(taskStatusUrl, 'utf8'),
  Promise.all(
    [...workflowStatusUrls.entries()].map(async ([name, url]) => [name, await readFile(url, 'utf8')])
  )
  ]);

const taskLedger = parseTaskLedger(tasksText);
const taskLedgerFailures = validateTaskLedger(taskLedger);
const taskStatuses = parseTaskStatus(taskStatusText);
const taskGraphStatuses = parseTaskGraphStatuses(taskGraphText);
const taskTrackerFailures = [];
const taskById = new Map((taskLedger.tasks ?? []).map((task) => [task.id, task]));

for (const task of taskLedger.tasks ?? []) {
  const readableStatus = taskStatuses.get(task.id);
  if (readableStatus?.status !== task.status) {
    taskTrackerFailures.push(
      `${task.id} status mismatch: tasks.json=${task.status}, task-status.md=${readableStatus?.status ?? 'missing'}.`
    );
  }
  const expectedDependenciesReady = task.dependencies.every(
    (dependency) => taskById.get(dependency)?.status === 'done'
  ) ? 'yes' : 'no';
  if (readableStatus?.dependenciesReady !== expectedDependenciesReady) {
    taskTrackerFailures.push(
      `${task.id} dependency readiness mismatch: expected ${expectedDependenciesReady}, task-status.md=${readableStatus?.dependenciesReady ?? 'missing'}.`
    );
  }
  const graphStatus = taskGraphStatuses.get(task.id);
  if (graphStatus !== task.status) {
    taskTrackerFailures.push(
      `${task.id} status mismatch: tasks.json=${task.status}, atomic-task-graph.md=${graphStatus ?? 'missing'}.`
    );
  }
}

for (const taskId of taskStatuses.keys()) {
  if (!(taskLedger.tasks ?? []).some((task) => task.id === taskId)) {
    taskTrackerFailures.push(`${taskId} exists in task-status.md but not tasks.json.`);
  }
}

const readyTaskIds = findReadyTasks(taskLedger.tasks ?? []).map((task) => task.id);
const expectedNextTaskLine = `Next ready task: ${readyTaskIds.length > 0 ? readyTaskIds.join(', ') : 'none'}.`;

for (const [name, text] of workflowStatusTexts) {
  const nextTaskLines = text.match(/^Next ready task:.*$/gm) ?? [];
  if (nextTaskLines.length !== 1 || nextTaskLines[0] !== expectedNextTaskLine) {
    taskTrackerFailures.push(
      `${name} must contain exactly "${expectedNextTaskLine}"; found ${nextTaskLines.length === 0 ? 'none' : nextTaskLines.join(' | ')}.`
    );
  }
}

const missingReadyTaskInputs = await findMissingReadyTaskInputs(taskLedger.tasks ?? []);

const issueRows = parseIssueRows(issueIndexText);
const feedbackIssueFailures = await validateFeedbackIssues(issueRows);
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

const humanTaskCount = humanTaskEntries.filter(
  (entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md'
).length;

const failures = [];

failures.push(...taskLedgerFailures, ...taskTrackerFailures);
failures.push(...feedbackIssueFailures);

try {
  await access(maintenanceStarterUrl);
} catch {
  failures.push('Missing agent-starters/startWorkflowMaintenanceManager.txt.');
}
if (!startText.includes('agent-starters/startWorkflowMaintenanceManager.txt')) {
  failures.push('start.txt must route workflow maintenance to agent-starters/startWorkflowMaintenanceManager.txt.');
}

if (missingReadyTaskInputs.length > 0) {
  failures.push(`Ready tasks have missing inputs: ${missingReadyTaskInputs.join(', ')}`);
}

if (!knowledgeIndexText.includes('agent/feedback/issue-index.md')) {
  failures.push('agent/knowledge/index.md must point to agent/feedback/issue-index.md.');
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

if (humanTaskCount > 0 && !knowledgeIndexText.includes('docs/human-tasks/README.md')) {
  failures.push('agent/knowledge/index.md must route human operations through docs/human-tasks/README.md.');
}

if (failures.length > 0) {
  console.error(['agent workflow check failed:', ...failures].join('\n'));
  process.exit(1);
}

console.log(
  `agent workflow ok (${taskLedger.tasks.length} aligned tasks; ${issueRows.length} indexed feedback issues; ${humanTaskCount} indexed human-task files)`
);
