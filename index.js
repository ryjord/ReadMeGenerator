#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const detectLang = require('language-detect');
const chalk = require('chalk').default;
const inquirer = require('inquirer').default;
const licenseChecker = require('license-checker');

// Helper to get current repo remote URL
function getCurrentRepoUrl() {
  const gitConfigPath = path.join(process.cwd(), '.git', 'config');
  if (!fs.existsSync(gitConfigPath)) return null;
  const config = fs.readFileSync(gitConfigPath, 'utf-8');
  const match = config.match(/url\s*=\s*(.+)/);
  return match ? match[1].trim() : null;
}

// Template-based README section generator (no AI, free)
async function generateReadmeSectionsAI(targetDir) {
  const pkgPath = path.join(targetDir, 'package.json');
  let pkg = {};
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch {}
  }
  const dependencies = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
  const devDependencies = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];
  const scripts = pkg.scripts || {};
  const keywords = pkg.keywords || [];

  // Heuristic: detect frameworks/libraries
  const featuresArr = [];
  if (dependencies.includes('express')) featuresArr.push('Express web server');
  if (dependencies.includes('react')) featuresArr.push('React front-end');
  if (dependencies.includes('vue')) featuresArr.push('Vue.js front-end');
  if (dependencies.includes('next')) featuresArr.push('Next.js framework');
  if (dependencies.includes('nestjs')) featuresArr.push('NestJS backend');
  if (dependencies.includes('mongoose')) featuresArr.push('MongoDB/Mongoose integration');
  if (dependencies.includes('sequelize')) featuresArr.push('Sequelize ORM');
  if (dependencies.includes('socket.io')) featuresArr.push('Real-time communication (Socket.io)');
  if (dependencies.includes('nodemon') || devDependencies.includes('nodemon')) featuresArr.push('Hot-reloading with nodemon');
  if (dependencies.includes('typescript') || devDependencies.includes('typescript')) featuresArr.push('TypeScript support');
  if (dependencies.length > 0 && featuresArr.length === 0) featuresArr.push(...dependencies);
  if (featuresArr.length === 0) featuresArr.push('Fast, Reliable, Easy to use');

  // Description
  let description = pkg.description || '';
  if (!description) {
    if (featuresArr.includes('Express web server')) description = 'A Node.js project using Express for web server functionality.';
    else if (featuresArr.includes('React front-end')) description = 'A React-based front-end project.';
    else if (featuresArr.includes('Vue.js front-end')) description = 'A Vue.js-based front-end project.';
    else if (featuresArr.includes('Next.js framework')) description = 'A Next.js full-stack application.';
    else description = 'A wonderful project!';
  }

  // Installation
  let installation = 'npm install';
  if (scripts.install) installation = `npm run install\n\n${scripts.install}`;

  // Usage
  let usage = '';
  if (scripts.start) usage = `npm start\n\n${scripts.start}`;
  else if (scripts.dev) usage = `npm run dev\n\n${scripts.dev}`;
  else usage = 'Check the documentation for details.';

  // Features
  let features = featuresArr.join(', ');

  return { description, installation, usage, features };
}

async function generateReadme(targetDir) {
  try {
    const projectName = path.basename(targetDir);
    const languages = detectProjectLanguages(targetDir);
    const license = await new Promise((resolve) => {
      licenseChecker.init({
        start: targetDir,
        production: true,
        development: false,
        json: true
      }, (err, packages) => {
        if (err || !packages) {
          resolve('MIT');
        } else {
          const license = Object.values(packages)[0]?.licenses;
          resolve(license || 'MIT');
        }
      });
    });

    // Use AI to generate all sections
    const answers = await generateReadmeSectionsAI(targetDir);

    const badges = [
      ...languages.map(lang => {
        const formattedLang = encodeURIComponent(lang.toLowerCase());
        return `![${lang}](https://img.shields.io/badge/lang-${formattedLang}-informational)`;
      }),
      `![License](https://img.shields.io/badge/license-${encodeURIComponent(license)}-brightgreen)`
    ];

    const featuresList = answers.features.split(',')
      .map(feat => `- ${feat.trim()}`)
      .join('\n');

    const readmeContent = `# ${projectName}

${badges.join(' ')}

## Description
${answers.description}

## Features
${featuresList}

## Installation
\u0060\u0060\u0060bash
${answers.installation}
\u0060\u0060\u0060

## Usage
${answers.usage}

## License
Distributed under the ${license} License. See LICENSE for more information.
`;

    fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent);
    console.log(chalk.green('README.md successfully generated in your repository!'));
  } catch (error) {
    console.error(chalk.red('Error generating README.md:'), error);
    process.exit(1);
  }
}

function detectProjectLanguages(targetDir) {
  try {
    const files = fs.readdirSync(targetDir);
    const languages = new Set();
    files.forEach(file => {
      try {
        const filePath = path.join(targetDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          const detected = detectLang.sync(filePath);
          if (detected) languages.add(detected);
        }
      } catch (e) {}
    });
    return Array.from(languages);
  } catch (e) {
    return [];
  }
}

async function main() {
  const currentRepoUrl = getCurrentRepoUrl();
  if (!currentRepoUrl) {
    console.error(chalk.red('No git repository found in the current directory.'));
    process.exit(1);
  }
  const { repoUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'repoUrl',
      message: 'Enter the Git repository URL:',
      validate: input => input.startsWith('http') || input.startsWith('git@') ? true : 'Please enter a valid Git URL.'
    }
  ]);
  if (repoUrl !== currentRepoUrl) {
    console.error(chalk.red('That is not your current root. Try again with the correct repository URL.'));
    process.exit(1);
  }
  await generateReadme(process.cwd());
  console.log(chalk.blue(`\nREADME.md generated at: ${path.join(process.cwd(), 'README.md')}`));
}

main();
