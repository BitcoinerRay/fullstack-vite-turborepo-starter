#!/usr/bin/env node

/*
  Sync Cursor rules/skills/agents/commands into GitHub Copilot custom instructions.

  Output:
    - .github/copilot-instructions.md

  Why:
    - Cursor reads `.cursor/**`
    - GitHub Copilot Chat in VS Code reads `.github/copilot-instructions.md`
*/

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const cursorDir = path.join(root, '.cursor');
const outPath = path.join(root, '.github', 'copilot-instructions.md');
const promptDir = path.join(root, '.github', 'prompts');

const MODE = process.argv.includes('--full') ? 'full' : 'compact';

const SECTIONS = [
  {title: 'Rules', dir: 'rules', includeContent: true},
  {title: 'Commands', dir: 'commands', includeContent: MODE === 'full', indexRecursive: false},
  {title: 'Skills', dir: 'skills', includeContent: MODE === 'full', indexRecursive: false},
  {title: 'Agents', dir: 'agents', includeContent: MODE === 'full', indexRecursive: false},
];

const MAX_PREVIEW_CHARS = 280;
const MAX_PROMPT_DESCRIPTION_CHARS = 140;

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function ensureDir(p) {
  fs.mkdirSync(p, {recursive: true});
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function rel(p) {
  return toPosix(path.relative(root, p));
}

function stripLeadingFrontmatter(markdown) {
  // Cursor .mdc commonly starts with YAML frontmatter delimited by ---
  if (!markdown.startsWith('---')) return markdown;
  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return markdown;
  return markdown.slice(end + '\n---'.length).replace(/^\n+/, '');
}

function listFilesRecursive(dirPath) {
  if (!exists(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, {withFileTypes: true});
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
      continue;
    }

    if (!entry.isFile()) continue;

    const lower = entry.name.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.mdc')) {
      files.push(fullPath);
    }
  }

  return files;
}

function listMarkdownFiles(dirPath, {recursive}) {
  if (!exists(dirPath)) return [];

  const filePaths = [];

  if (recursive) {
    filePaths.push(...listFilesRecursive(dirPath));
  } else {
    const entries = fs.readdirSync(dirPath, {withFileTypes: true});
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.startsWith('.')) continue;

      const lower = entry.name.toLowerCase();
      if (lower.endsWith('.md') || lower.endsWith('.mdc')) {
        filePaths.push(path.join(dirPath, entry.name));
      }
    }
  }

  return filePaths.sort((a, b) => rel(a).localeCompare(rel(b)));
}

function readCursorMarkdown(filePath) {
  return stripLeadingFrontmatter(readText(filePath)).trim();
}

function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, '\n');
}

function extractTitle(markdown) {
  const lines = normalizeNewlines(markdown).split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return trimmed.slice(2).trim();
  }
  return null;
}

function extractPreview(markdown) {
  const lines = normalizeNewlines(markdown)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const nonHeading = lines.filter((l) => !l.startsWith('#'));
  if (nonHeading.length === 0) return '';

  const preview = nonHeading.join(' ');
  if (preview.length <= MAX_PREVIEW_CHARS) return preview;
  return `${preview.slice(0, MAX_PREVIEW_CHARS - 1)}…`;
}

function toYamlDoubleQuotedString(value) {
  const normalized = normalizeNewlines(String(value)).replace(/\n/g, ' ').trim();
  const escaped = normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function renderFileSection(filePath) {
  const content = readCursorMarkdown(filePath);
  const header = `\n\n---\n\n## ${rel(filePath)}\n`;
  return header + '\n' + content + '\n';
}

function renderIndexSection({title, dir, indexRecursive}) {
  const absDir = path.join(cursorDir, dir);
  const files = listMarkdownFiles(absDir, {recursive: indexRecursive ?? true});

  const entries = exists(absDir) ? fs.readdirSync(absDir, {withFileTypes: true}) : [];
  const subdirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0 && subdirs.length === 0) {
    return `# ${title}\n\n(No files found in .cursor/${dir}.)\n`;
  }

  const lines = [`# ${title}`, '', `Mode: ${MODE}`, ''];
  for (const filePath of files) {
    const content = readCursorMarkdown(filePath);
    const fileTitle = extractTitle(content);
    const preview = extractPreview(content);

    const label = fileTitle ?? rel(filePath);
    const details = preview ? ` — ${preview}` : '';
    lines.push(`- ${label} (${rel(filePath)})${details}`);
  }

  if (subdirs.length > 0) {
    lines.push('');
    lines.push('Folders:');
    for (const subdir of subdirs) {
      lines.push(`- .cursor/${dir}/${subdir}/`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function buildOutput() {
  if (!exists(cursorDir)) {
    throw new Error('Missing .cursor directory; nothing to sync.');
  }

  const now = new Date().toISOString();

  const parts = [];
  parts.push('# Copilot Instructions (Synced from .cursor)\n');
  parts.push(`Generated by \`${rel(path.join(root, 'scripts', 'copilot-sync.js'))}\` at ${now}.\n`);
  parts.push(`Mode: **${MODE}**\n`);
  parts.push(
    [
      'This repo uses Cursor conventions under `.cursor/**`. This file mirrors those guidelines so **GitHub Copilot Chat** can follow the same standards.',
      '',
      'Practical guidance:',
      '- Follow the coding and security standards in the **Rules** section.',
      '- Treat `.cursor/commands/*.md` as “chat macros”: if the user types a matching slash command (e.g. `/plan`), follow that command’s instructions.',
      '- If a guideline conflicts with the user’s explicit request, follow the user.',
      '',
    ].join('\n'),
  );

  for (const section of SECTIONS) {
    const sectionDir = path.join(cursorDir, section.dir);
    if (!exists(sectionDir)) continue;

    parts.push('\n---\n');

    if (section.includeContent) {
      parts.push(`# ${section.title}\n`);
      const files = listMarkdownFiles(sectionDir, {recursive: true});
      for (const filePath of files) {
        parts.push(renderFileSection(filePath));
      }
    } else {
      parts.push(renderIndexSection(section));
    }
  }

  return parts.join('\n').trimEnd() + '\n';
}

function toCommandName(filePath) {
  const base = path.basename(filePath);
  return base.replace(/\.mdc?$/i, '');
}

function buildPromptFile({commandName, commandRelPath, commandContent}) {
  const title = extractTitle(commandContent);
  const preview = extractPreview(commandContent);
  const descriptionRaw = title ?? (preview ? preview : `Run ${commandName}`);
  const description =
    descriptionRaw.length <= MAX_PROMPT_DESCRIPTION_CHARS
      ? descriptionRaw
      : `${descriptionRaw.slice(0, MAX_PROMPT_DESCRIPTION_CHARS - 1)}…`;

  const frontmatter = [
    '---',
    `name: ${commandName}`,
    `description: ${toYamlDoubleQuotedString(description)}`,
    // Most of these workflows are multi-step and often involve proposing terminal commands.
    'agent: agent',
    '---',
    '',
  ].join('\n');

  const body = [
    `Follow the workflow defined in ${commandRelPath}.`,
    '',
    'Constraints:',
    '- Follow steps in order unless you explain why you deviate.',
    '- If a step would be destructive or irreversible, ask for confirmation first.',
    '- Prefer repo scripts (npm/pnpm) over ad-hoc commands when available.',
    '',
    'Workflow:',
    '',
    commandContent.trim(),
    '',
  ].join('\n');

  return frontmatter + body;
}

function syncPromptFiles() {
  const commandsDir = path.join(cursorDir, 'commands');
  if (!exists(commandsDir)) return {created: 0};

  ensureDir(promptDir);

  const commandFiles = listMarkdownFiles(commandsDir, {recursive: false});
  let created = 0;

  for (const filePath of commandFiles) {
    const commandName = toCommandName(filePath);
    const promptPath = path.join(promptDir, `${commandName}.prompt.md`);

    const commandRelPath = rel(filePath);
    const commandContent = readCursorMarkdown(filePath);

    const promptContent = buildPromptFile({commandName, commandRelPath, commandContent});
    fs.writeFileSync(promptPath, promptContent, 'utf8');
    created += 1;
  }

  return {created};
}

function main() {
  try {
    const output = buildOutput();
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, output);

    const prompts = syncPromptFiles();

    const size = Buffer.byteLength(output, 'utf8');
    process.stdout.write(`Wrote ${rel(outPath)} (${size} bytes)\n`);
    if (prompts.created > 0) {
      process.stdout.write(`Wrote ${prompts.created} prompt files to ${rel(promptDir)}/\n`);
    }
    if (MODE === 'full' && size > 200_000) {
      // eslint-disable-next-line no-console
      console.warn(
        'Warning: generated instructions are large; Copilot may ignore or truncate them. Consider running without --full.',
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

main();
