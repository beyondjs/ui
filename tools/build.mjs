import { buildSync } from 'esbuild';
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
	static order = ['base', 'focus', 'icons', 'controls', 'choice', 'cards', 'forms', 'picker', 'choose', 'overlays', 'palette', 'session', 'sheet', 'feedback', 'callout', 'recovery', 'signal', 'status', 'collection', 'list-tools', 'table', 'list', 'list-frame', 'list-rules', 'checklist', 'command', 'header', 'notify', 'navigation', 'family', 'family-narrow', 'family-menu', 'sidebar', 'sidebar-entries', 'sidebar-rail', 'page', 'resource', 'anatomy', 'panel', 'compact', 'thread', 'facts', 'arrival', 'notices', 'inbox', 'operations', 'details', 'rows', 'composer', 'editor', 'dictation', 'attachments', 'composing', 'activity', 'rail', 'lanes', 'turns', 'diff', 'diff-lines', 'code', 'quiet', 'prose', 'motion', 'links', 'insets', 'insets-floating', 'floating'];

	#root = new URL('../', import.meta.url);

	run() {
		const directory = fileURLToPath(new URL('dist/', this.#root));
		mkdirSync(directory, { recursive: true });
		writeFileSync(`${directory}tokens.css`, `${new TokenSheet(tokens).css}\n`);
		writeFileSync(`${directory}tokens.json`, `${JSON.stringify(tokens, null, '\t')}\n`);
		writeFileSync(`${directory}styles.css`, this.styles);
		// The opening's controller knows its version, to tell a document another version drew (0.25.0)
		buildSync({ entryPoints: [fileURLToPath(new URL('src/opening/runtime.js', this.#root))], bundle: true, minify: true, format: 'iife', target: 'es2022', define: { __BEYOND_UI__: JSON.stringify(this.version) }, outfile: `${directory}opening.js` });
		console.log(`Built tokens ${tokens.version} (${tokens.status}) and ${Build.order.length} component stylesheets into dist/`);
	}

	get version() {
		return JSON.parse(readFileSync(new URL('package.json', this.#root), 'utf8')).version;
	}

	get styles() {
		const { version } = JSON.parse(readFileSync(new URL('package.json', this.#root), 'utf8'));
		const parts = Build.order.map(name => readFileSync(new URL(`src/styles/${name}.css`, this.#root), 'utf8'));
		return [`/* @beyond-js/ui ${version} components. Generated from src/styles; do not edit. Requires @beyond-js/ui/tokens.css. */`, ...parts].join('\n');
	}
}

new Build().run();
