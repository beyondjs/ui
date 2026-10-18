import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OpeningDocument, OpeningPlugin } from '@beyond-js/ui/opening';

const logo = new URL('../acceptance/fixtures/brand/wordmark.svg', import.meta.url);
const source = readFileSync(new URL('../acceptance/fixtures/opening/index.html', import.meta.url), 'utf8');

test('the opening is in the document, escaped, localized and independent of the application module', () => {
	const opening = new OpeningDocument({ product: '<Example>', key: 'fixture', logo });
	const html = opening.render(source);
	assert.deepEqual(Object.keys(OpeningDocument.labels.en), Object.keys(OpeningDocument.labels.es));
	const snapshot = opening.files; snapshot.clear();
	assert.ok(opening.files.size > 0, 'a consumer cannot clear the document’s asset state');
	assert.match(html, /&lt;Example&gt;/);
	assert.match(html, /Abriendo…/);
	assert.match(html, /Enable JavaScript/);
	assert.match(html, /<script defer src="\/opening-[a-f0-9]+\.js"/);
	assert.ok(html.indexOf('data-opening=') < html.indexOf('type="module"'));
	assert.ok(html.indexOf('id="bui-opening"') < html.indexOf('id="root"'));
	const css = [...opening.files].find(([name]) => name.endsWith('.css'))[1];
	assert.match(css, /visibility: hidden/);
	const tokens = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
	const own = readFileSync(new URL('../src/opening/opening.css', import.meta.url), 'utf8');
	for (const [, name] of own.matchAll(/var\((--[^)]+)\)/g)) assert.ok(tokens.includes(`${name}:`), `${name} is a canonical token`);
});

test('Vite includes only explicitly selected application documents and emits every referenced asset', () => {
	const plugin = new OpeningPlugin({ product: 'Example', key: 'fixture', logo: '../acceptance/fixtures/brand/wordmark.svg', pages: ['/index.html', '/desktop/index.html'] }).plugin;
	const root = new URL('../src', import.meta.url).pathname.replace(/\/$/, '');
	plugin.configResolved({ root, base: '/' });
	for (const path of ['/session/index.html', '/landed.html']) assert.equal(plugin.transformIndexHtml.handler(source, { filename: root + path }), source);
	for (const path of ['/index.html', '/desktop/index.html']) {
		const rendered = plugin.transformIndexHtml.handler(source, { filename: root + path });
		assert.match(rendered.html, /id="bui-opening"/);
		assert.equal(rendered.tags[0].injectTo, 'head-prepend');
		assert.equal(rendered.tags[0].attrs.defer, true);
		assert.doesNotMatch(rendered.tags[0].attrs['data-opening'], /["'<>]/, 'bootstrap settings are safe across Vite attribute serializers');
		assert.equal(JSON.parse(decodeURIComponent(rendered.tags[0].attrs['data-opening'])).product, 'Example');
	}
	let middleware;
	const connect = () => { throw new Error('Vite must never call Connect as a post hook'); };
	assert.equal(plugin.configureServer({ middlewares: { use: listener => { middleware = listener; return connect; } } }), undefined);
	let passed = false;
	middleware({ url: '/not-an-opening-asset' }, {}, () => passed = true);
	assert.equal(passed, true);
	const emitted = [];
	plugin.generateBundle.call({ emitFile: file => emitted.push(file) });
	assert.ok(emitted.some(file => file.fileName.endsWith('.js')));
	assert.ok(emitted.some(file => file.fileName.endsWith('.svg')));
	assert.ok(emitted.some(file => file.fileName.endsWith('.woff2')));
});
