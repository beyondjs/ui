import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tokens, TokenSheet } from '../src/foundations/index.js';

/**
 * Writes the package's generated stylesheets into `dist/`.
 *
 * - `dist/tokens.css`: the token custom properties for both themes, written by `TokenSheet`;
 * - `dist/tokens.json`: every token with its provenance;
 * - `dist/styles.css`: the component stylesheets of `src/styles/`, in cascade order, as one file.
 *
 * The JavaScript modules are published as written; only these files are generated. `npm pack`
 * runs this through `prepack`, and the tests run it first, so a stale copy is never packed.
 */
class Build {
	static order = ['base', 'controls', 'forms', 'picker', 'overlays', 'feedback', 'collection', 'header', 'notices'];

	#root = new URL('../', import.meta.url);

	run() {
		const directory = fileURLToPath(new URL('dist/', this.#root));
		mkdirSync(directory, { recursive: true });
		writeFileSync(`${directory}tokens.css`, `${new TokenSheet(tokens).css}\n`);
		writeFileSync(`${directory}tokens.json`, `${JSON.stringify(tokens, null, '\t')}\n`);
		writeFileSync(`${directory}styles.css`, this.styles);
		console.log(`Built tokens ${tokens.version} (${tokens.status}) and ${Build.order.length} component stylesheets into dist/`);
	}

	get styles() {
		const { version } = JSON.parse(readFileSync(new URL('package.json', this.#root), 'utf8'));
		const parts = Build.order.map(name => readFileSync(new URL(`src/styles/${name}.css`, this.#root), 'utf8'));
		return [`/* @beyond-js/ui ${version} components. Generated from src/styles; do not edit. Requires @beyond-js/ui/tokens.css. */`, ...parts].join('\n');
	}
}

new Build().run();
