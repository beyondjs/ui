import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * The React adapter suites again on React 18.3.1, the oldest React the package supports: React 18
 * and 19 schedule StrictMode's second mount differently. React 18 is installed into a temporary
 * project (npm registry or cache), and each suite runs in a child process whose `react` and
 * `react-dom` resolve there (`support/react.mjs`).
 */
const version = '18.3.1';
const hooks = fileURLToPath(new URL('./support/react.mjs', import.meta.url));
const suites = ['react.test.mjs', 'strict.test.mjs'];

test(`the React adapter suites pass on React ${version}`, async t => {
	const directory = mkdtempSync(join(tmpdir(), 'ui react18-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: 'ui-react18', private: true }));
	execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', `react@${version}`, `react-dom@${version}`], { cwd: directory, stdio: 'pipe' });
	const env = { ...process.env, BUI_REACT: version.split('.')[0], BUI_REACT_DIRECTORY: directory };
	delete env.NODE_TEST_CONTEXT;
	for (const suite of suites) {
		await t.test(suite, () => {
			const run = spawnSync(process.execPath, ['--import', hooks, '--test-reporter=spec', fileURLToPath(new URL(`./${suite}`, import.meta.url))], { env, encoding: 'utf8' });
			assert.equal(run.status, 0, `${suite} failed on React ${version}:\n${run.stdout}${run.stderr}`);
		});
	}
});
