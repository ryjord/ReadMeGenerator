#!/usr/bin/env node
import { parseArgs } from 'node:util';
import path from 'node:path';

import { runWizard } from '../src/wizard.js';

const HELP = `suniemi — generate a README.md for the current project

Usage
  suniemi [options]

Options
  -y, --yes         Skip the wizard and write a README with detected defaults
  -d, --dir <path>  Target project directory (defaults to the current directory)
  -h, --help        Show this help
  -v, --version     Show the version number
`;

const { values } = parseArgs({
  options: {
    yes: { type: 'boolean', short: 'y', default: false },
    dir: { type: 'string', short: 'd' },
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false }
  }
});

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

if (values.version) {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

const targetDir = values.dir ? path.resolve(process.cwd(), values.dir) : process.cwd();

await runWizard({ targetDir, assumeYes: values.yes });
