import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { words } from './words.js';

/** Produces the shared, self-contained opening document and assets without weakening a host's CSP. */
export class OpeningDocument {
	/** All document copy in the two supported product languages (0.21.0: the opening's own words and its steps). */
	static labels = words;

	#specs;
	#files = new Map();
	#base;

	/** `root` is the application's content container; `pending` marks its initial waiting state only. */
	constructor({ product, root = '#root', pending = '[data-bui-opening-wait]', key, logo, appearance = 'system', locale = 'en', device = false, base = '/' }) {
		this.#specs = { product, root, pending, key, appearance, locale, device };
		this.#base = base;
		const fonts = new URL('../../fonts/', import.meta.url);
		for (const name of readdirSync(fonts)) if (/\.(woff2|txt)$/.test(name)) this.#files.set(`opening-fonts/${name}`, readFileSync(new URL(name, fonts)));
		const faces = readFileSync(new URL('fonts.css', fonts), 'utf8').replaceAll("url('./", "url('./opening-fonts/");
		const tokens = readFileSync(new URL('../../dist/tokens.css', import.meta.url), 'utf8');
		const style = readFileSync(new URL('./opening.css', import.meta.url), 'utf8');
		// The product stays hidden behind the opening until it hands over (`leaving`), then shows at once
		const hidden = "body:has(> #bui-opening:not([data-state='leaving'])) > :not(#bui-opening):not(script):not(style):not(link)";
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
	 * identity and the trace paint first; the steps, the recovery and their words are drawn by the
	 * controller, and the last line shows by itself only when the controller never ran.
	 */
	render(html) {
		const say = key => this.#say(key);
		const settings = encodeURIComponent(JSON.stringify(this.#specs));
		const head = `<link rel="stylesheet" href="${this.#url('css')}" data-bui-opening><script defer src="${this.#url('js')}" data-opening="${settings}"></script>`;
		const body = `<div id="bui-opening" class="bui-opening" data-state="opening"><div class="bui-opening-veil"></div><div class="bui-opening-stage">
<div class="bui-opening-lockup"><img class="bui-opening-wordmark" src="${this.#url('svg')}" alt="Beyond" width="120" height="30"><span class="bui-opening-divider" aria-hidden="true"></span><span class="bui-opening-name">${OpeningDocument.#escape(this.#specs.product)}</span></div>
<div class="bui-opening-trace" aria-hidden="true"></div>
<p class="bui-opening-status" role="status" data-opening-status>${say('opening')}</p>
<ol class="bui-opening-steps" data-opening-steps aria-hidden="true" hidden></ol>
<div class="bui-opening-recovery" data-opening-recovery hidden><p class="bui-opening-heading" data-opening-heading></p><p class="bui-opening-note" data-opening-note></p><button type="button" class="bui-opening-reload" data-opening-reload>${say('reload')}</button>
<details class="bui-opening-details"><summary>${say('details')}</summary><pre class="bui-opening-text" data-opening-text></pre><button type="button" class="bui-opening-copy" data-opening-copy>${say('copy')}</button><p class="bui-opening-said" data-opening-said aria-live="polite"></p></details></div>
<p class="bui-opening-fallback" data-opening-fallback>${say('fallback')}</p>
<noscript><p>${say('disabled')}</p></noscript>
</div></div>`;
		return html.replace(/<script\b|<\/head>/i, match => head + match).replace(/(<body[^>]*>)/i, `$1${body}`);
	}
}

/** Vite adapter: serves the same assets in development and emits them with every production build. */
export class OpeningPlugin {
	#specs;
	#pages;
	#root;
	#document;
	#base;

	/** `pages` names application HTML entries explicitly; hand-off landings stay untouched. */
	constructor({ pages = ['/index.html'], ...specs }) { this.#specs = specs; this.#pages = pages; }

	/** A structural Vite plugin, with no Vite runtime dependency. */
	get plugin() {
		const owner = this;
		return {
			name: 'beyond-opening',
			configResolved: config => {
				this.#base = config.base;
				this.#root = config.root.replaceAll('\\', '/');
				this.#document = new OpeningDocument({ ...this.#specs, logo: resolve(config.root, this.#specs.logo), base: config.base === './' ? './' : config.base });
			},
			transformIndexHtml: { order: 'post', handler: (html, context) => {
				if (!this.#pages.some(page => context.filename.replaceAll('\\', '/').slice(this.#root.length) === page)) return html;
				const rendered = this.#document.render(html).replace(/<script[^>]*data-opening=[^>]*><\/script>/, '');
				return { html: rendered, tags: [{ tag: 'script', attrs: this.#document.script, injectTo: 'head-prepend' }] };
			} },
			configureServer: server => {
				server.middlewares.use((request, response, next) => {
					const path = new URL(request.url, 'http://opening').pathname.slice(this.#base.length);
					const body = this.#document.files.get(path);
					if (!body) return next();
					const types = { css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml', woff2: 'font/woff2', txt: 'text/plain' };
					const type = types[path.split('.').pop()];
					response.setHeader('Content-Type', type);
					response.end(body);
				});
			},
			generateBundle: function () {
				for (const [fileName, source] of owner.#document.files) this.emitFile({ type: 'asset', fileName, source });
			}
		};
	}
}
