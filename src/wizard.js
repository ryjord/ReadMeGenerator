import fs from 'node:fs';
import path from 'node:path';
import * as clack from '@clack/prompts';
import pc from 'picocolors';
import gradient from 'gradient-string';

import {
  readPackageJson,
  detectLicense,
  detectLanguages,
  getGithubRepo,
  detectFeatures,
  inferDescription
} from './scan.js';
import { buildBadges, BADGE_STYLES } from './badges.js';
import { renderReadme } from './render.js';

const BRAND = gradient(['#22d3ee', '#a78bfa']);

const SECTION_OPTIONS = [
  { value: 'description', label: 'Description', hint: 'one paragraph about the project' },
  { value: 'features', label: 'Features', hint: 'bullet list, detected from dependencies' },
  { value: 'installation', label: 'Installation', hint: 'from your install script' },
  { value: 'usage', label: 'Usage', hint: 'from your start/dev script' },
  { value: 'contributing', label: 'Contributing' },
  { value: 'support', label: 'Support' },
  { value: 'acknowledgements', label: 'Acknowledgements' },
  { value: 'license', label: 'License' }
];

function bail() {
  clack.cancel('Cancelled — nothing was written.');
  process.exit(0);
}

function check(value) {
  if (clack.isCancel(value)) bail();
  return value;
}

function previewLines(content, max = 14) {
  const lines = content.split('\n');
  const shown = lines.slice(0, max).map((l) => pc.dim(l));
  if (lines.length > max) shown.push(pc.dim(`… ${lines.length - max} more lines`));
  return shown.join('\n');
}

export async function runWizard({ targetDir, assumeYes = false }) {
  clack.intro(BRAND('readme-gen'));

  const scanSpin = clack.spinner();
  scanSpin.start('Scanning project');
  const pkg = readPackageJson(targetDir);
  const license = detectLicense(targetDir, pkg);
  const languages = detectLanguages(targetDir);
  const github = getGithubRepo(targetDir);
  const features = detectFeatures(pkg);
  const defaultDescription = inferDescription(pkg, features);
  const defaultName = pkg?.name || path.basename(targetDir);
  scanSpin.stop('Scan complete');

  const detectedLines = [
    `${pc.dim('Name')}        ${pc.bold(defaultName)}`,
    `${pc.dim('Languages')}   ${languages.length ? pc.cyan(languages.map((l) => l.name).join(', ')) : pc.dim('none detected')}`,
    `${pc.dim('License')}     ${license ? pc.green(`${license.name}${license.fromFile ? ' (from LICENSE)' : ' (from package.json)'}`) : pc.yellow('none detected')}`,
    `${pc.dim('GitHub')}      ${github ? pc.magenta(github.path) : pc.dim('no GitHub remote found')}`,
    `${pc.dim('Features')}    ${features.length ? pc.cyan(`${features.length} detected`) : pc.dim('none detected')}`
  ];
  clack.note(detectedLines.join('\n'), 'Detected');

  let answers;

  if (assumeYes) {
    answers = {
      projectName: defaultName,
      description: defaultDescription,
      sections: ['description', 'features', 'installation', 'usage', 'license', ...(github ? ['contributing', 'support'] : [])],
      includeToc: true,
      badgeStyle: 'flat',
      installation: pkg?.scripts?.install ? `npm install\nnpm run install` : 'npm install',
      usage: pkg?.scripts?.start ? `npm start` : pkg?.scripts?.dev ? `npm run dev` : 'Check the documentation for details.'
    };
  } else {
    const projectName = check(
      await clack.text({
        message: 'Project name',
        initialValue: defaultName,
        validate: (v) => (v.trim() ? undefined : 'Required.')
      })
    );

    const description = check(
      await clack.text({
        message: 'One-line description',
        initialValue: defaultDescription,
        placeholder: 'What does this project do?'
      })
    );

    const defaultSections = ['description', 'features', 'installation', 'usage', 'license'];
    if (github) defaultSections.push('contributing', 'support');

    const sections = check(
      await clack.multiselect({
        message: 'Sections to include',
        options: SECTION_OPTIONS,
        initialValues: SECTION_OPTIONS.map((o) => o.value).filter((v) => defaultSections.includes(v)),
        required: false
      })
    );

    const includeToc = sections.length > 2
      ? check(await clack.confirm({ message: 'Include a table of contents?', initialValue: true }))
      : false;

    let badgeStyle = 'flat';
    if (languages.length > 0 || license || github) {
      badgeStyle = check(
        await clack.select({
          message: 'Badge style',
          options: BADGE_STYLES.map((s) => ({ value: s, label: s })),
          initialValue: 'flat'
        })
      );
    }

    let installation = 'npm install';
    if (sections.includes('installation')) {
      const defaultInstall = pkg?.scripts?.install ? `npm install\nnpm run install` : 'npm install';
      installation = check(
        await clack.text({ message: 'Installation command(s)', initialValue: defaultInstall })
      );
    }

    let usage = 'Check the documentation for details.';
    if (sections.includes('usage')) {
      const defaultUsage = pkg?.scripts?.start
        ? 'npm start'
        : pkg?.scripts?.dev
          ? 'npm run dev'
          : 'Check the documentation for details.';
      usage = check(await clack.text({ message: 'Usage instructions', initialValue: defaultUsage }));
    }

    answers = { projectName, description, sections, includeToc, badgeStyle, installation, usage };
  }

  const badges = buildBadges({
    languages,
    license: license?.name,
    githubRepoPath: github?.path,
    style: answers.badgeStyle
  });

  const readmeContent = renderReadme({
    projectName: answers.projectName,
    description: answers.description,
    features,
    installation: answers.installation,
    usage: answers.usage,
    badges,
    sections: answers.sections,
    githubUrl: github?.url,
    license: license?.name,
    includeToc: answers.includeToc
  });

  const outPath = path.join(targetDir, 'README.md');
  const exists = fs.existsSync(outPath);

  if (!assumeYes) {
    clack.note(previewLines(readmeContent), 'Preview');
    const proceed = check(
      await clack.confirm({
        message: exists ? `${pc.yellow('README.md')} already exists — overwrite it?` : 'Write README.md?',
        initialValue: !exists
      })
    );
    if (!proceed) bail();
  }

  const writeSpin = clack.spinner();
  writeSpin.start('Writing README.md');
  fs.writeFileSync(outPath, readmeContent);
  writeSpin.stop('README.md written');

  const summary = [
    `${pc.dim('Sections')}  ${answers.sections.length}`,
    `${pc.dim('Badges')}    ${badges.length}`,
    `${pc.dim('Path')}      ${pc.dim(outPath)}`
  ].join('\n');
  clack.outro(`${pc.green('Done')}\n${summary}`);
}
