import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The shipped typeface (D09): `@beyond-js/ui/fonts.css` declares Rubik 300, 400 and 500 in the latin
 * and latin-ext subsets, each face's woff2 resolves through the package's own `exports` as
 * `@beyond-js/ui/fonts/<file>`, and the licence travels with them. `styles.css` never loads a font.
 */
const sheet = import.meta.resolve('@beyond-js/ui/fonts.css');
const text = readFileSync(fileURLToPath(sheet), 'utf8');
const faces = [...text.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
	family: /font-family:\s*'([^']+)'/.exec(body)?.[1],
	weight: Number(/font-weight:\s*(\d+)/.exec(body)?.[1]),
	display: /font-display:\s*(\w+)/.exec(body)?.[1],
	url: /url\('\.\/([^']+)'\)\s*format\('woff2'\)/.exec(body)?.[1],
	range: /unicode-range:\s*([^;]+);/.exec(body)?.[1]
}));

test('six faces: Rubik 300, 400 and 500, each in latin and latin-ext, swapped while loading', () => {
	assert.equal(faces.length, 6);
	const keys = faces.map(face => `${face.weight} ${/latin-ext/.test(face.url) ? 'latin-ext' : 'latin'}`).sort();
	assert.deepEqual(keys, ['300 latin', '300 latin-ext', '400 latin', '400 latin-ext', '500 latin', '500 latin-ext']);
	for (const face of faces) {
		assert.equal(face.family, 'Rubik');
		assert.equal(face.display, 'swap');
		assert.match(face.range, /^U\+/, face.url);
	}
	const latin = faces.find(face => face.url === 'rubik-latin-400-normal.woff2');
	assert.match(latin.range, /U\+0000-00FF/);
	assert.doesNotMatch(faces.find(face => face.url === 'rubik-latin-ext-400-normal.woff2').range, /U\+0000-00FF/);
});

test('every face resolves through the package exports to a woff2 file beside the sheet', () => {
	for (const { url } of faces) {
		const exported = import.meta.resolve(`@beyond-js/ui/fonts/${url}`);
		assert.equal(exported, new URL(url, sheet).href);
		const bytes = readFileSync(fileURLToPath(exported));
		assert.equal(bytes.subarray(0, 4).toString('latin1'), 'wOF2', url);
	}
});

test('the OFL licence ships with the fonts, and the package publishes the directory', () => {
	assert.match(readFileSync(fileURLToPath(import.meta.resolve('@beyond-js/ui/fonts/OFL.txt')), 'utf8'), /SIL Open Font License, Version 1\.1/);
	const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
	assert.ok(manifest.files.includes('fonts/'));
});

test('styles.css and tokens.css load no font: a product imports fonts.css once, on purpose', () => {
	for (const name of ['styles.css', 'tokens.css']) {
		const css = readFileSync(fileURLToPath(import.meta.resolve(`@beyond-js/ui/${name}`)), 'utf8');
		assert.doesNotMatch(css, /@font-face|@import|url\(/, name);
	}
});

test('an unknown font file is not exported', () => {
	assert.throws(() => readFileSync(fileURLToPath(import.meta.resolve('@beyond-js/ui/fonts/rubik-latin-700-normal.woff2'))), { code: 'ENOENT' });
});
