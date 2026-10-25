import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Server } from './server.mjs';

const fixtures = fileURLToPath(new URL('../fixtures/', import.meta.url));

/**
 * One consumer of the packed package: a temporary project (its path contains a space) that installs
 * the tarball and its own React version from the registry or cache, copies a fixture page, bundles it
 * with esbuild through the package's `exports`, and serves it. Nothing is read from this checkout
 * except the fixture files and the tarball.
 */
export class Consumer {
	#name;
	#page;
	#react;
	#directory = null;
	#server = null;

	/**
	 * @param {string} name consumer identity used by the checks (`dom`, `react19`, `react18`)
	 * @param {'dom'|'react'} page the fixture page
	 * @param {string|null} react React version to install, or null
	 */
	constructor(name, page, react = null) {
		this.#name = name;
		this.#page = page;
		this.#react = react;
	}

	get name() {
		return this.#name;
	}

	/** `en` for the plain DOM page, `es` for the React page, which passes Spanish copy. */
	get language() {
		return this.#page === 'react' ? 'es' : 'en';
	}

	/** The address of a page of this consumer's fixture (`index.html` unless named). */
	url(file = 'index.html') {
		return `${this.#server.origin}/fixtures/${this.#page}/${file}`;
	}

	async prepare(tarball) {
		this.#directory = mkdtempSync(join(tmpdir(), `ui acceptance ${this.#name}-`));
		cpSync(fixtures, join(this.#directory, 'fixtures'), { recursive: true });
		cpSync(new URL('../../tests/fixtures/sidebar-rail.mjs', import.meta.url), join(this.#directory, 'fixtures', 'data', 'sidebar-rail.mjs'));
		const dependencies = { '@beyond-js/ui': `file:${tarball}` };
		if (this.#react) Object.assign(dependencies, { react: this.#react, 'react-dom': this.#react });
		writeFileSync(join(this.#directory, 'package.json'), JSON.stringify({ name: `ui-consumer-${this.#name}`, private: true, type: 'module', dependencies }, null, '\t'));
		execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: this.#directory, stdio: 'pipe' });
		// The React fixture's pages: the full consumer, one under an external store, the family bar, the icons with preferences, the long operations, the page system, "Choose, never type", the conversation (0.10.0), the thread (0.11.0), the diff (0.11.2), the round of 0.14.0, the audit of 0.15.0, the patterns of 0.16.0, the hierarchy of 0.19.0, the recovery of 0.24.0, the lanes of 0.27.0, the turns of 0.29.0, the settling of 0.32.0, the boxes' insets (D184), the outage's close of 0.33.0, the focus of 0.34.0 and the presses of 0.35.0 (D183).
		const entries = (this.#page === 'react' ? ['disclosure.jsx', 'main.jsx', 'store.jsx', 'family.jsx', 'icons.jsx', 'operations.jsx', 'layout.jsx', 'choosing.jsx', 'conversation.jsx', 'thread.jsx', 'diff.jsx', 'round.jsx', 'audit.jsx', 'wave.jsx', 'hold.jsx', 'navigation.jsx', 'hierarchy.jsx', 'recovery.jsx', 'lanes.jsx', 'turns.jsx', 'settle.jsx', 'insets.jsx', 'closing.jsx', 'pressing.jsx'] : ['disclosure.js', 'main.js', 'family.js', 'icons.js', 'operations.js', 'layout.js', 'choosing.js', 'session.js', 'landed.js', 'conversation.js', 'thread.js', 'diff.js', 'round.js', 'audit.js', 'wave.js', 'hold.js', 'navigation.js', 'hierarchy.js', 'recovery.js', 'lanes.js', 'turns.js', 'settle.js', 'insets.js', 'closing.js', 'focus.js', 'pressing.js']).map(file => join(this.#directory, 'fixtures', this.#page, file));
		await build({ entryPoints: entries, bundle: true, format: 'esm', outdir: join(this.#directory, 'fixtures', this.#page, 'out'), jsx: 'automatic', loader: { '.woff2': 'file' }, define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'error', absWorkingDir: this.#directory });
		this.#server = await new Server(this.#directory).start();
		return this;
	}

	/** The installed package version and the resolved React version, for the report. */
	get installed() {
		const read = name => {
			try {
				return JSON.parse(execFileSync('node', ['-p', `JSON.stringify(require('${name}/package.json').version)`], { cwd: this.#directory, encoding: 'utf8' }));
			} catch {
				return null;
			}
		};
		return { ui: read('@beyond-js/ui'), react: this.#react ? read('react') : null };
	}

	async dispose() {
		await this.#server?.stop();
		if (this.#directory) rmSync(this.#directory, { recursive: true, force: true });
	}
}
