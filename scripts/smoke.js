#!/usr/bin/env node
// Runs the wizard's --yes path against a throwaway fixture project and checks
// the result, without touching this repository's own README.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { runWizard } from '../src/wizard.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-gen-smoke-'));

try {
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'smoke-fixture',
        license: 'MIT',
        scripts: { start: 'node index.js' },
        dependencies: { express: '^4.0.0' }
      },
      null,
      2
    )
  );
  fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("hi");\n');

  await runWizard({ targetDir: dir, assumeYes: true });

  const readmePath = path.join(dir, 'README.md');
  if (!fs.existsSync(readmePath)) throw new Error('README.md was not written');

  const content = fs.readFileSync(readmePath, 'utf-8');
  if (!content.includes('# smoke-fixture')) throw new Error('README.md is missing the expected title');
  if (!content.includes('Express web server')) throw new Error('README.md is missing detected features');

  console.log('smoke test passed');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
