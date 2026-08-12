import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', 'vendor',
  '.next', '.nuxt', '.turbo', '.cache', 'out', 'target'
]);

const EXTENSION_LANGUAGES = {
  '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript', '.tsx': 'TypeScript',
  '.py': 'Python', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust',
  '.java': 'Java', '.kt': 'Kotlin', '.swift': 'Swift',
  '.c': 'C', '.h': 'C', '.cpp': 'C++', '.hpp': 'C++', '.cc': 'C++',
  '.cs': 'C#', '.php': 'PHP', '.sh': 'Shell', '.bash': 'Shell',
  '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.less': 'Less',
  '.vue': 'Vue', '.svelte': 'Svelte', '.dart': 'Dart',
  '.sql': 'SQL', '.lua': 'Lua', '.r': 'R', '.ex': 'Elixir', '.exs': 'Elixir'
};

// Dependency (or devDependency) name -> feature bullet. Checked in this order.
const FEATURE_MAP = [
  ['next', 'Next.js framework'],
  ['nuxt', 'Nuxt.js framework'],
  ['react', 'React front-end'],
  ['vue', 'Vue.js front-end'],
  ['svelte', 'Svelte front-end'],
  ['@angular/core', 'Angular front-end'],
  ['express', 'Express web server'],
  ['fastify', 'Fastify web server'],
  ['@nestjs/core', 'NestJS backend'],
  ['koa', 'Koa web server'],
  ['@supabase/supabase-js', 'Supabase backend'],
  ['prisma', 'Prisma ORM'],
  ['mongoose', 'MongoDB / Mongoose integration'],
  ['sequelize', 'Sequelize ORM'],
  ['typeorm', 'TypeORM'],
  ['pg', 'PostgreSQL support'],
  ['mysql2', 'MySQL support'],
  ['socket.io', 'Real-time communication (Socket.io)'],
  ['graphql', 'GraphQL API'],
  ['tailwindcss', 'Tailwind CSS styling'],
  ['@shadcn/ui', 'shadcn/ui components'],
  ['electron', 'Electron desktop app'],
  ['vite', 'Vite build tooling'],
  ['webpack', 'Webpack build tooling'],
  ['jest', 'Jest test suite'],
  ['vitest', 'Vitest test suite'],
  ['mocha', 'Mocha test suite'],
  ['eslint', 'ESLint linting'],
  ['prettier', 'Prettier formatting'],
  ['typescript', 'TypeScript support'],
  ['nodemon', 'Hot-reloading with nodemon'],
  ['docker', 'Docker support']
];

// First line of the LICENSE body -> SPDX-ish label. Order matters (most specific first).
const LICENSE_SIGNATURES = [
  [/MIT License/i, 'MIT'],
  [/Apache License,?\s*Version 2\.0/i, 'Apache-2.0'],
  [/GNU GENERAL PUBLIC LICENSE\s*\n?\s*Version 3/i, 'GPL-3.0'],
  [/GNU GENERAL PUBLIC LICENSE\s*\n?\s*Version 2/i, 'GPL-2.0'],
  [/GNU LESSER GENERAL PUBLIC LICENSE/i, 'LGPL-3.0'],
  [/BSD 3-Clause License/i, 'BSD-3-Clause'],
  [/BSD 2-Clause License/i, 'BSD-2-Clause'],
  [/Mozilla Public License,?\s*version 2\.0/i, 'MPL-2.0'],
  [/ISC License/i, 'ISC'],
  [/This is free and unencumbered software/i, 'Unlicense']
];

export function readPackageJson(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch {
    return null;
  }
}

// Reads the LICENSE file in `dir`, if any, and identifies it from its text.
// Returns { name, fromFile: boolean } or null if nothing was found at all.
export function detectLicense(dir, pkg) {
  const candidates = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md'];
  for (const name of candidates) {
    const filePath = path.join(dir, name);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, 'utf-8');
    for (const [pattern, label] of LICENSE_SIGNATURES) {
      if (pattern.test(text)) return { name: label, fromFile: true };
    }
    // A LICENSE file exists but didn't match a known signature.
    return { name: pkg?.license || 'See LICENSE', fromFile: true };
  }
  if (pkg?.license) return { name: pkg.license, fromFile: false };
  return null;
}

// Walks the project (bounded depth + file count) and returns languages sorted
// by how many files use them, e.g. [{ name: 'TypeScript', count: 42 }, ...].
export function detectLanguages(dir, { maxFiles = 5000, maxDepth = 6 } = {}) {
  const counts = new Map();
  let filesSeen = 0;

  function walk(current, depth) {
    if (depth > maxDepth || filesSeen > maxFiles) return;
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (filesSeen > maxFiles) return;
      if (entry.name.startsWith('.') && entry.name !== '.github') continue;
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(path.join(current, entry.name), depth + 1);
      } else if (entry.isFile()) {
        filesSeen++;
        const ext = path.extname(entry.name).toLowerCase();
        const lang = EXTENSION_LANGUAGES[ext];
        if (lang) counts.set(lang, (counts.get(lang) || 0) + 1);
      }
    }
  }

  walk(dir, 0);
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Reads the origin remote from .git/config and, if it's GitHub, returns the
// https link and "owner/repo" path. Returns null outside a git repo.
export function getGithubRepo(dir) {
  const gitConfigPath = path.join(dir, '.git', 'config');
  if (!fs.existsSync(gitConfigPath)) return null;
  const config = fs.readFileSync(gitConfigPath, 'utf-8');
  const match = config.match(/url\s*=\s*(.+)/);
  if (!match) return null;

  let url = match[1].trim();
  const sshMatch = url.match(/^git@([^:]+):(.+?)(\.git)?$/);
  if (sshMatch) {
    url = `https://${sshMatch[1]}/${sshMatch[2]}`;
  } else {
    url = url.replace(/\.git$/, '');
  }

  if (!url.includes('github.com')) return null;
  const repoPath = url.split('github.com/')[1];
  if (!repoPath) return null;
  return { url: `https://github.com/${repoPath}`, path: repoPath };
}

export function detectFeatures(pkg) {
  if (!pkg) return [];
  const deps = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {})
  ]);
  const features = FEATURE_MAP.filter(([dep]) => deps.has(dep)).map(([, label]) => label);
  return features.length > 0 ? features : [];
}

export function inferDescription(pkg, features) {
  if (pkg?.description) return pkg.description;
  if (features.includes('Next.js framework')) return 'A Next.js full-stack application.';
  if (features.includes('React front-end')) return 'A React-based front-end project.';
  if (features.includes('Vue.js front-end')) return 'A Vue.js-based front-end project.';
  if (features.includes('Express web server')) return 'A Node.js project using Express for web server functionality.';
  return '';
}
