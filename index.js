#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const detectLang = require('language-detect');
const chalk = require('chalk').default;
const inquirer = require('inquirer').default; // Added .default here
const licenseChecker = require('license-checker');

async function generateReadme() {
  try {
    // Get project info
    const projectName = path.basename(process.cwd());
    const languages = detectProjectLanguages();
    
    // Detect license (with fallback)
    const license = await new Promise((resolve) => {
      licenseChecker.init({
        start: process.cwd(),
        production: true,
        development: false,
        json: true
      }, (err, packages) => {
        if (err || !packages) {
          resolve('MIT'); // Default license
        } else {
          const license = Object.values(packages)[0]?.licenses;
          resolve(license || 'MIT');
        }
      });
    });

    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Enter project description:',
        default: 'A wonderful project!'
      },
      {
        type: 'input',
        name: 'installation',
        message: 'Installation command:',
        default: 'npm install'
      },
      {
        type: 'input',
        name: 'usage',
        message: 'Basic usage instructions:',
        default: 'Check the documentation for details'
      },
      {
        type: 'input',
        name: 'features',
        message: 'List features (comma separated):',
        default: 'Fast, Reliable, Easy to use'
      }
    ]);

    // Generate badges
    const badges = [
      ...languages.map(lang => {
        const formattedLang = encodeURIComponent(lang.toLowerCase());
        return `![${lang}](https://img.shields.io/badge/lang-${formattedLang}-informational)`;
      }),
      `![License](https://img.shields.io/badge/license-${encodeURIComponent(license)}-brightgreen)`
    ];

    // Format features list
    const featuresList = answers.features.split(',')
      .map(feat => `- ${feat.trim()}`)
      .join('\n');

    // Generate README content
    const readmeContent = `# ${projectName}

${badges.join(' ')}

## Description
${answers.description}

## Features
${featuresList}

## Installation
\`\`\`bash
${answers.installation}
\`\`\`

## Usage
${answers.usage}

## License
Distributed under the ${license} License. See LICENSE for more information.
`;

    // Write to file
    fs.writeFileSync('README.md', readmeContent);
    console.log(chalk.green('README.md successfully generated!'));

  } catch (error) {
    console.error(chalk.red('Error generating README.md:'), error);
    process.exit(1);
  }
}

function detectProjectLanguages() {
  try {
    const files = fs.readdirSync(process.cwd());
    const languages = new Set();
    
    files.forEach(file => {
      try {
        const filePath = path.join(process.cwd(), file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          const detected = detectLang.sync(filePath);
          if (detected) languages.add(detected);
        }
      } catch (e) {
        // Skip files that can't be analyzed
      }
    });
    
    return Array.from(languages);
  } catch (e) {
    return [];
  }
}

// Start the process
generateReadme();