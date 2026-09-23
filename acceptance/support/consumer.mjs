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

	get url() {
		return `${this.#server.origin}/fixtures/${this.#page}/index.html`;
	}

	async prepare(tarball) {
		this.#directory = mkdtempSync(join(tmpdir(), `ui acceptance ${this.#name}-`));
		cpSync(fixtures, join(this.#directory, 'fixtures'), { recursive: true });
		const dependencies = { '@beyond-js/ui': `file:${tarball}` };
		if (this.#react) Object.assign(dependencies, { react: this.#react, 'react-dom': this.#react });
		writeFileSync(join(this.#directory, 'package.json'), JSON.stringify({ name: `ui-consumer-${this.#name}`, private: true, type: 'module', dependencies }, null, '\t'));
		execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: this.#directory, stdio: 'pipe' });
		const entry = join(this.#directory, 'fixtures', this.#page, this.#page === 'react' ? 'main.jsx' : 'main.js');
		await build({ entryPoints: [entry], bundle: true, format: 'esm', outdir: join(this.#directory, 'fixtures', this.#page, 'out'), jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'error', absWorkingDir: this.#directory });
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
