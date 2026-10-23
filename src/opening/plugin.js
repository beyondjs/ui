import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { OpeningInstall } from './install.js';

/**
 * Vite adapter: serves the same assets in development and emits them with every production build.
 *
 * A development server serves what is installed (0.25.0). Its configuration imports this module once,
 * and Node keeps that copy for the life of the process, so the document is never built from it: each
 * time Vite resolves its configuration, the installed document module is loaded afresh. When another
 * copy of the package is installed, the server restarts by itself (`server.restart(true)` prepares its
 * dependencies again), and open pages reload as on any restart. This module therefore keeps its
 * contract with Vite and with `OpeningDocument` stable across versions.
 */
export class OpeningPlugin {
	#specs;
	#pages;
	#root;
	#document;
	#base;

	/** `pages` names application HTML entries explicitly; hand-off landings stay untouched. */
	constructor({ pages = ['/index.html'], ...specs }) {
		this.#specs = specs;
		this.#pages = pages;
	}

	/** A structural Vite plugin, with no Vite runtime dependency. */
	get plugin() {
		const owner = this;
		return {
			name: 'beyond-opening',
			configResolved: async config => {
				this.#base = config.base;
				this.#root = config.root.replaceAll('\\', '/');
				const { OpeningDocument } = await OpeningPlugin.#installed();
				this.#document = new OpeningDocument({ ...this.#specs, development: config.command === 'serve', logo: resolve(config.root, this.#specs.logo), base: config.base === './' ? './' : config.base });
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
				this.#follow(server);
			},
			generateBundle: function () {
				for (const [fileName, source] of owner.#document.files) this.emitFile({ type: 'asset', fileName, source });
			}
		};
	}

	/** Restarts a listening development server once another copy of the package is installed */
	#follow(server) {
		if (!server.httpServer || typeof server.restart !== 'function') return;
		const install = new OpeningInstall(new URL('../../', import.meta.url));
		const running = install.version;
		install.watch(version => {
			install.stop();
			server.config?.logger?.info(`@beyond-js/ui ${version || 'changed'} installed (this server runs ${running}): restarting`, { timestamp: true });
			Promise.resolve(server.restart(true)).catch(error => server.config?.logger?.error(`Restart after installing @beyond-js/ui failed: ${error?.message ?? error}`));
		});
		server.httpServer.once('close', () => install.stop());
	}

	/** The document module as installed now: a new copy only after an install, the same one otherwise */
	static async #installed() {
		const { mtimeMs } = statSync(new URL('../../package.json', import.meta.url));
		return import(`./document.js?installed=${Math.round(mtimeMs)}`);
	}
}
