import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Page } from './support/page.mjs';
import { OpeningFault } from '../src/opening/fault.js';
import { OpeningFrame } from '../src/opening/frame.js';
import { OpeningInstall } from '../src/opening/install.js';
import { OpeningRecovery } from '../src/opening/recovery.js';
import { OpeningRetry } from '../src/opening/retry.js';
import { OpeningWords } from '../src/opening/words.js';

/**
 * 0.25.0: what a failure means for an opening, the one reload it makes by itself, what each state
 * offers, a document another version drew, and a development server that follows what is installed.
 */
const page = new Page();
const scratch = mkdtempSync(join(tmpdir(), 'beyond-ui-opening-'));
after(async () => {
	rmSync(scratch, { recursive: true, force: true });
	await page.close();
});
const words = new OpeningWords('Conduict');
const until = (check, limit = 4000) => page.until(check, limit);

/** Replaces globals for one test and gives them back */
const swap = (values, work) => {
	const saved = Object.fromEntries(Object.keys(values).map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
	for (const [name, value] of Object.entries(values)) Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
	try {
		return work();
	} finally {
		for (const [name, descriptor] of Object.entries(saved)) descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name];
	}
};

test('a failure is said by what it means for the opening: code that cannot load or link, a start that threw, or one the product may outlive', () => {
	const fault = (event, state = {}) => new OpeningFault(event, { drawn: false, started: false, words, ...state });
	const script = fault({ type: 'error', target: { tagName: 'SCRIPT', src: 'http://localhost/src/main.js' } });
	assert.equal(script.kind, 'load');
	assert.equal(script.text, 'Couldn’t load http://localhost/src/main.js');
	const linked = { type: 'error', target: window, message: "Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/@beyond-js_ui.js' does not provide an export named 'waiting'", filename: 'http://localhost/src/main.js', lineno: 1 };
	assert.equal(fault(linked).kind, 'load', 'a module that names an export its dependency lacks never runs');
	assert.match(fault(linked).text, /does not provide an export named 'waiting' · http:\/\/localhost\/src\/main\.js:1$/);
	assert.equal(fault({ ...linked, message: 'x', error: new SyntaxError('import not found: waiting') }).kind, 'load', 'Firefox and WebKit carry the error itself');
	assert.equal(fault({ ...linked, error: new SyntaxError('Unexpected token') }, { drawn: true, started: true }).kind, 'later', 'a syntax error once the product runs is its own');
	assert.equal(fault({ type: 'unhandledrejection', reason: new TypeError('Failed to fetch dynamically imported module: http://localhost/src/route.js') }, { drawn: true, started: true }).kind, 'load', 'a part that cannot load leaves the product stuck');
	assert.equal(fault({ type: 'unhandledrejection', reason: new TypeError('Importing a module script failed.') }).kind, 'load');
	const thrown = { type: 'error', target: window, message: "Uncaught TypeError: Cannot read properties of undefined (reading 'mount')", error: new TypeError('x') };
	assert.equal(fault(thrown).kind, 'start', 'a throw while the modules run, before anything is drawn');
	assert.equal(fault(thrown).final, true);
	assert.equal(fault(thrown, { started: true }).kind, 'later', 'after the modules ran, the product may outlive it');
	assert.equal(fault(thrown, { drawn: true }).kind, 'later');
	assert.equal(fault({ ...linked, error: new SyntaxError('Unexpected token < in JSON') }, { started: true }).kind, 'later', 'once the modules ran, a syntax error is the product’s (a top-level await of JSON that does not parse)');
	assert.equal(fault({ type: 'unhandledrejection', reason: new Error('Session store failed') }).final, false, 'a promise nobody handled may still be outlived');
	assert.equal(fault({ type: 'unhandledrejection', reason: new SyntaxError('Unexpected token < in JSON at position 0') }).kind, 'later', 'JSON that does not parse is the product’s failure, not code that cannot link');
	assert.equal(OpeningFault.counts({ type: 'error', target: { tagName: 'IMG' } }), false, 'a missing image is not a failure of opening');
	assert.equal(OpeningFault.counts({ type: 'error', target: window }), true);
	assert.equal(OpeningFault.counts({ type: 'unhandledrejection' }), true);
	swap({ location: { href: 'http://localhost/#/org', origin: 'http://localhost' } }, () => {
		assert.equal(OpeningFault.counts({ type: 'error', target: { tagName: 'SCRIPT', src: '/src/main.js' } }), true, 'the page’s own script');
		assert.equal(OpeningFault.counts({ type: 'error', target: { tagName: 'SCRIPT', src: 'chrome-extension://abc/inject.js' } }), false, 'an extension’s script is not the product’s code');
		assert.equal(OpeningFault.counts({ type: 'error', target: { tagName: 'SCRIPT', src: 'https://cdn.example.com/x.js' } }), false);
	});
});

test('code that could not load reloads by itself once per address and window, never without session storage', () => {
	class Memory {
		#items = new Map();
		getItem(key) { return this.#items.get(key) ?? null; }
		setItem(key, value) { this.#items.set(key, String(value)); }
	}
	const storage = new Memory();
	const place = { href: 'http://localhost/#/org/project/conversations/new', reloads: 0, reload() { this.reloads += 1; } };
	swap({ sessionStorage: storage, location: place }, () => {
		assert.equal(new OpeningRetry('beyond-conduict').run(), true);
		assert.equal(place.reloads, 1);
		assert.equal(new OpeningRetry('beyond-conduict').run(), false, 'a failure that persists is said, not looped');
		assert.equal(place.reloads, 1);
		place.href = 'http://localhost/#/org/project/machines';
		assert.equal(new OpeningRetry('beyond-conduict').run(), true, 'another address may reload once too');
		storage.setItem('beyond-conduict.opening.reload', JSON.stringify({ address: place.href, at: Date.now() - OpeningRetry.window - 1 }));
		assert.equal(new OpeningRetry('beyond-conduict').run(), true, 'past the window it may again');
		assert.equal(place.reloads, 3);
	});
	swap({ sessionStorage: { getItem() { throw new Error('SecurityError'); } }, location: place }, () => {
		assert.equal(new OpeningRetry('beyond-conduict').run(), false);
		assert.equal(place.reloads, 3, 'without storage it never reloads by itself');
	});
});

test('each state offers only what can work: waiting or Reload when late, Reload when it cannot open, nothing offline', () => swap({ location: { href: 'http://localhost/' } }, () => {
	page.reset();
	document.documentElement.lang = 'en';
	const stage = document.body.appendChild(document.createElement('div'));
	const recovery = new OpeningRecovery({ parent: stage, words });
	const part = selector => stage.querySelector(selector);
	assert.equal(recovery.state, null);
	assert.equal(part('[data-opening-recovery]').hidden, true, 'nothing until a cause');
	recovery.keep({ version: '@beyond-js/ui 0.25.0', error: 'Couldn’t load http://localhost/src/main.js' });
	assert.equal(recovery.show('late', { step: 'Confirming your session', steps: 'Loading Conduict (interface) 0.4 s · Confirming your session (session) 12 s' }), 'Taking longer than expected. You can keep waiting or reload.');
	assert.equal(part('.bui-opening-heading').textContent, 'Taking longer than expected');
	assert.equal(part('.bui-opening-reload').hidden, false);
	assert.equal(part('.bui-opening-details').open, false);
	assert.match(part('.bui-opening-text').textContent, /^Step: Confirming your session\nSteps: .+\nError: Couldn’t load http:\/\/localhost\/src\/main\.js\nOpening: @beyond-js\/ui 0\.25\.0\nAddress: http:\/\/localhost\/\nTime: \d{4}-/);
	assert.equal(recovery.show('failed'), 'Couldn’t open Conduict.', 'a heading and Reload: no note that restates the button');
	assert.equal(part('.bui-opening-note').hidden, true);
	assert.equal(part('.bui-opening-details').open, false, 'a real installation keeps the details closed');
	assert.equal(recovery.show('offline'), 'You’re offline. Opening continues as soon as you’re back online.');
	assert.equal(part('.bui-opening-reload').hidden, true, 'Reload cannot work offline: the browser would replace the page with its own error');
	assert.equal(part('.bui-opening-details').hidden, true);
	recovery.cause = 'outdated';
	assert.equal(recovery.show('failed'), 'Couldn’t open Conduict. Conduict’s development server is out of date. Stop it and start it again, then reload.', 'an established cause in place of silence, with the remedy that works');
	assert.equal(recovery.show('late'), 'Taking longer than expected. Conduict’s development server is out of date. Stop it and start it again, then reload.');
	assert.equal(recovery.show('offline'), 'You’re offline. Opening continues as soon as you’re back online.', 'offline says itself');
	recovery.connected(false);
	assert.equal(recovery.show('failed'), 'Couldn’t open Conduict. Conduict’s development server is out of date. Stop it and start it again, then reload.');
	assert.equal(part('.bui-opening-reload').hidden, true, 'a failure said offline waits for the connection to offer Reload');
	recovery.connected(true);
	assert.equal(part('.bui-opening-reload').hidden, false);
	recovery.show('offline');
	document.documentElement.lang = 'es';
	assert.equal(recovery.speak(), 'Estás sin conexión. La apertura continúa en cuanto vuelvas a tener conexión.');
	recovery.cause = '';
	assert.equal(recovery.show('late'), 'Está tardando más de lo esperado. Puedes seguir esperando o volver a cargar.');
	assert.equal(part('.bui-opening-reload').textContent, 'Volver a cargar');
	assert.equal(part('summary').textContent, 'Detalles técnicos');
	document.documentElement.lang = 'en';
	const served = new OpeningRecovery({ parent: stage, words, development: true });
	served.show('failed');
	assert.equal(stage.lastElementChild.querySelector('.bui-opening-details').open, true, 'a development server shows what failed at once');
	recovery.hide();
	assert.equal(recovery.state, null);
}));

test('a document another version drew is drawn again in this version’s form, keeping its wordmark', () => {
	page.reset();
	OpeningFrame.version = '0.25.0';
	document.body.innerHTML = '<div id="bui-opening" class="bui-opening" data-state="opening" data-version="0.25.0"><div class="bui-opening-veil"></div><div class="bui-opening-stage"><div class="bui-opening-lockup"></div><div class="bui-opening-trace"></div><p class="bui-opening-status" role="status" data-opening-status>Opening Conduict</p></div></div>';
	const own = new OpeningFrame(document.getElementById('bui-opening'), words);
	assert.equal(own.outdated, false);
	const { list, status } = own.draw();
	assert.equal(status.nextElementSibling, list);
	assert.equal(list.hidden, true);
	assert.equal(list.getAttribute('aria-hidden'), 'true', 'the steps are seen; the one announced line says them');
	page.reset();
	document.body.innerHTML = readFileSync(new URL('../acceptance/fixtures/opening/earlier.html', import.meta.url), 'utf8');
	const element = document.getElementById('bui-opening');
	const earlier = new OpeningFrame(element, words);
	assert.equal(earlier.outdated, true);
	assert.equal(earlier.drawn, '', 'the earlier markup says no version');
	earlier.draw();
	assert.equal(element.querySelector('.bui-opening-help, .bui-opening-panel'), null, 'nothing of the earlier markup stays');
	assert.equal(element.querySelector('.bui-opening-lockup .bui-opening-wordmark').getAttribute('src'), '/wordmark.svg');
	assert.equal(element.querySelector('.bui-opening-name').textContent, 'Conduict');
	assert.equal(element.querySelectorAll('[role="status"]').length, 1);
	assert.ok(element.querySelector('.bui-opening-trace') && element.querySelector('[data-opening-steps]'));
	OpeningFrame.version = '';
});

/** A copy of this package installed in a scratch `node_modules`, as a product holds it */
const install = name => {
	const root = join(scratch, name, 'node_modules', '@beyond-js', 'ui');
	mkdirSync(join(root, 'src'), { recursive: true });
	const source = new URL('../', import.meta.url);
	for (const part of ['package.json', 'src/opening', 'src/dom/preferences', 'dist/tokens.css', 'dist/opening.js', 'fonts']) cpSync(new URL(part, source), join(root, part), { recursive: true });
	writeFileSync(join(scratch, name, 'node_modules', '.package-lock.json'), '{"lockfileVersion":3}');
	return root;
};
/** Installs another version over a copy, as `npm install` of a new archive does */
const replace = (root, version) => {
	const manifest = join(root, 'package.json');
	writeFileSync(manifest, JSON.stringify({ ...JSON.parse(readFileSync(manifest, 'utf8')), version }, null, '\t'));
	const later = new Date(Date.now() + 5000);
	utimesSync(manifest, later, later);
	// npm writes its record of node_modules last
	const record = join(root, '..', '..', '.package-lock.json');
	writeFileSync(record, `{"lockfileVersion":3,"version":"${version}"}`);
	const last = new Date(later.getTime() + 1000);
	utimesSync(record, last, last);
};

test('an install is noticed once it has settled, and an unrelated install changes nothing', async () => {
	const root = install('watched');
	const watched = new OpeningInstall(pathToFileURL(`${root}/`));
	const [interval, settle] = [OpeningInstall.interval, OpeningInstall.settle];
	Object.assign(OpeningInstall, { interval: 20, settle: 80 });
	const seen = [];
	try {
		watched.watch(version => seen.push(version));
		writeFileSync(join(root, '..', '..', '.package-lock.json'), '{"lockfileVersion":3,"other":"1.0.1"}');
		await new Promise(resolve => setTimeout(resolve, 300));
		assert.deepEqual(seen, [], 'another package installed: this one is unchanged');
		replace(root, '9.9.9');
		await until(() => seen.length);
		await new Promise(resolve => setTimeout(resolve, 200));
		assert.deepEqual(seen, ['9.9.9'], 'once, with the installed version');
	} finally {
		watched.stop();
		Object.assign(OpeningInstall, { interval, settle });
	}
});

test('a development server builds its document from what is installed and restarts itself once another copy is installed', async () => {
	const root = install('served');
	const { OpeningPlugin } = await import(pathToFileURL(join(root, 'src/opening/plugin.js')).href);
	const { OpeningInstall: Installed } = await import(pathToFileURL(join(root, 'src/opening/install.js')).href);
	const fixtures = new URL('../acceptance/fixtures/', import.meta.url).pathname.replace(/\/$/, '');
	const source = readFileSync(new URL('../acceptance/fixtures/opening/index.html', import.meta.url), 'utf8');
	const plugin = new OpeningPlugin({ product: 'Conduict', key: 'fixture', logo: 'brand/wordmark.svg', pages: ['/opening/index.html'] }).plugin;
	const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
	const drawn = async () => {
		await plugin.configResolved({ root: fixtures, base: '/', command: 'serve' });
		return plugin.transformIndexHtml.handler(source, { filename: `${fixtures}/opening/index.html` }).html.match(/data-version="([^"]+)"/)[1];
	};
	assert.equal(await drawn(), version);
	replace(root, '9.9.9');
	assert.equal(await drawn(), '9.9.9', 'the module Node loaded first never draws the document: the installed one does');
	const restarts = [];
	const logged = [];
	let refuse = true;
	const server = { httpServer: Object.assign(new EventEmitter(), { listening: true }), restart: force => { restarts.push(force); return refuse ? ((refuse = false), Promise.reject(new Error('server restart failed'))) : Promise.resolve(); }, config: { logger: { info: line => logged.push(line), error: line => logged.push(line) } }, middlewares: { use() {} } };
	const [interval, settle] = [Installed.interval, Installed.settle];
	Object.assign(Installed, { interval: 20, settle: 80 });
	try {
		plugin.configureServer(server);
		replace(root, '9.9.10');
		await until(() => restarts.length);
		await new Promise(resolve => setTimeout(resolve, 200));
		assert.deepEqual(restarts, [true], 'one restart, preparing its dependencies again');
		assert.match(logged[0], /@beyond-js\/ui 9\.9\.10 installed \(this server runs 9\.9\.9\): restarting/);
		assert.match(logged[1], /Restart after installing @beyond-js\/ui failed: server restart failed/);
		replace(root, '9.9.11');
		await until(() => restarts.length === 2);
		assert.deepEqual(restarts, [true, true], 'a restart that failed left the earlier server running, and the next install is still followed');
		plugin.configureServer({ ...server, httpServer: undefined });
		const idle = Object.assign(new EventEmitter(), { listening: false });
		plugin.configureServer({ ...server, httpServer: idle });
		replace(root, '9.9.12');
		await new Promise(resolve => setTimeout(resolve, 400));
		assert.equal(restarts.length, 3, 'only the listening server restarts: middleware mode and a server that never listened are left alone');
		idle.emit('close');
	} finally {
		server.httpServer.emit('close');
		Object.assign(Installed, { interval, settle });
	}
});
