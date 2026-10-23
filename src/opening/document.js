import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Loaded afresh after an install (`document.js?installed=…`, see plugin.js), its words come afresh with it
const { words } = await import(`./words.js${new URL(import.meta.url).search}`);

/** Produces the shared, self-contained opening document and assets without weakening a host's CSP. */
export class OpeningDocument {
	/** All document copy in the two supported product languages (0.21.0: the opening's own words and its steps). */
	static labels = words;
	/** This package's version, stamped on the document so its controller can tell another version's apart (0.25.0) */
	static version = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;

	#specs;
	#files = new Map();
	#base;

	/**
	 * `root` is the application's content container; `pending` marks its initial waiting state only.
	 * `development` is set by the Vite adapter on its development server: a failure then shows its
	 * technical details open (0.25.0).
	 */
	constructor({ product, root = '#root', pending = '[data-bui-opening-wait]', key, logo, appearance = 'system', locale = 'en', device = false, development = false, base = '/' }) {
		this.#specs = { product, root, pending, key, appearance, locale, device, ...(development ? { development: true } : {}) };
		this.#base = base;
		const fonts = new URL('../../fonts/', import.meta.url);
		for (const name of readdirSync(fonts)) if (/\.(woff2|txt)$/.test(name)) this.#files.set(`opening-fonts/${name}`, readFileSync(new URL(name, fonts)));
		const faces = readFileSync(new URL('fonts.css', fonts), 'utf8').replaceAll("url('./", "url('./opening-fonts/");
		const tokens = readFileSync(new URL('../../dist/tokens.css', import.meta.url), 'utf8');
		const style = readFileSync(new URL('./opening.css', import.meta.url), 'utf8');
		// The product stays hidden behind the opening until it hands over (`leaving`), then shows at once.
		// A development server's own error overlay is never hidden: the opening steps aside for it (0.25.0).
		const hidden = "body:has(> #bui-opening:not([data-state='leaving'])) > :not(#bui-opening):not(script):not(style):not(link):not(vite-error-overlay)";
		this.#add('css', `${faces}\n${tokens}\n${style}\n${hidden} { visibility: hidden; }`);
		this.#add('js', readFileSync(new URL('../../dist/opening.js', import.meta.url)));
		this.#add('svg', readFileSync(logo));
	}

	#add(type, source) {
		const hash = createHash('sha256').update(source).digest('hex').slice(0, 12);
		this.#files.set(`opening-${hash}.${type}`, source);
	}

	#url(type) {
		return OpeningDocument.#escape(this.#base + [...this.#files.keys()].find(name => name.endsWith(`.${type}`)));
	}

	static #escape(value) {
		return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
	}

	/** A line in both languages; the stylesheet shows the document's */
	#say(key) {
		const fill = text => OpeningDocument.#escape(text.replaceAll('{product}', this.#specs.product));
		return `<span lang="en">${fill(words.en[key])}</span><span lang="es">${fill(words.es[key])}</span>`;
	}

	/** Files keyed by host-relative path. Hosts serve them as CSS, JavaScript, SVG and fonts. */
	get files() { return new Map(this.#files); }

	/** Bootstrap attributes for a build adapter that controls final script ordering. */
	get script() { return { defer: true, src: this.#url('js'), 'data-opening': encodeURIComponent(JSON.stringify(this.#specs)) }; }

	/**
	 * Inserts before the application's modules; session landings must be excluded by the caller. The
	 * document paints the identity, the trace and the one announced line; the controller draws the steps
	 * and the recovery (0.25.0), and the last line shows by itself only when the controller never ran.
	 */
	render(html) {
		const say = key => this.#say(key);
		const settings = encodeURIComponent(JSON.stringify(this.#specs));
		const head = `<link rel="stylesheet" href="${this.#url('css')}" data-bui-opening><script defer src="${this.#url('js')}" data-opening="${settings}"></script>`;
		const body = `<div id="bui-opening" class="bui-opening" data-state="opening" data-version="${OpeningDocument.#escape(OpeningDocument.version)}"><div class="bui-opening-veil"></div><div class="bui-opening-stage">
<div class="bui-opening-lockup"><img class="bui-opening-wordmark" src="${this.#url('svg')}" alt="Beyond" width="120" height="30"><span class="bui-opening-divider" aria-hidden="true"></span><span class="bui-opening-name">${OpeningDocument.#escape(this.#specs.product)}</span></div>
<div class="bui-opening-trace" aria-hidden="true"></div>
<p class="bui-opening-status" role="status" data-opening-status>${say('opening')}</p>
<p class="bui-opening-fallback" data-opening-fallback>${say('fallback')}</p>
<noscript><p>${say('disabled')}</p></noscript>
</div></div>`;
		return html.replace(/<script\b|<\/head>/i, match => head + match).replace(/(<body[^>]*>)/i, `$1${body}`);
	}
}

export { OpeningPlugin } from './plugin.js';
