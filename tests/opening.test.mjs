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

test('the opening hands its faces over to the application’s own, once the ones in use load, and keeps them otherwise (0.17.1)', async () => {
	const { OpeningFonts } = await import('../src/opening/fonts.js');
	assert.match(new OpeningDocument({ product: 'Example', key: 'fixture', logo }).render(source), /<link rel="stylesheet" href="\/opening-[a-f0-9]+\.css" data-bui-opening>/);
	class CSSFontFaceRule {
		constructor(family) { this.style = { getPropertyValue: () => `"${family}"` }; }
	}
	const sheet = () => ({ cssRules: [{ type: 1 }, new CSSFontFaceRule('Inter'), new CSSFontFaceRule('Rubik'), { type: 1 }], deleteRule(index) { this.cssRules.splice(index, 1); } });
	const face = (family, status, fails = false) => ({ family, weight: '400', style: 'normal', unicodeRange: 'U+0-FF', status, loads: 0, load() { this.loads += 1; return fails ? Promise.reject(new Error('404')) : Promise.resolve(this); } });
	const twice = () => [face('Inter', 'loaded'), face('Rubik', 'unloaded'), face('Inter', 'unloaded'), face('Rubik', 'unloaded')];
	let shown = sheet(), faces = twice();
	assert.equal(await new OpeningFonts(shown, faces).release(), true);
	assert.deepEqual(shown.cssRules.map(rule => rule.type ?? 'face'), [1, 1], 'the opening’s faces are removed, its other rules kept');
	assert.deepEqual(faces.map(item => item.loads), [1, 0, 1, 0], 'only the faces in use are loaded under both declarations first');
	shown = sheet();
	assert.equal(await new OpeningFonts(shown, [face('Inter', 'loaded'), face('Rubik', 'unloaded')]).release(), false, 'no faces of the application’s own: the opening’s stay');
	assert.equal(shown.cssRules.length, 4);
	shown = sheet(), faces = twice();
	faces[2] = face('Inter', 'unloaded', true);
	assert.equal(await new OpeningFonts(shown, faces).release(), false, 'a face that cannot load: the opening’s stay');
	assert.equal(shown.cssRules.length, 4);
	assert.equal(await new OpeningFonts(null, faces).release(), false);
	const guarded = { get cssRules() { throw new Error('SecurityError'); } };
	assert.equal(await new OpeningFonts(guarded, faces).release(), false, 'an unreadable sheet changes nothing');
});
