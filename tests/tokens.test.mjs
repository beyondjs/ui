import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tokens, TokenSheet, Contrast } from '@beyond-js/ui/tokens';

/**
 * The token extraction: the package is the canonical source from 0.1.0 and reproduces, byte for
 * byte, the sheet the family reference generated before the move. Imported through the package's
 * own export, as consumers import it.
 */
const fixture = new URL('./fixtures/branding-tokens-0.1.0.css', import.meta.url);
const built = new URL('../dist/tokens.css', import.meta.url);
const { primitives, themes, pairs } = tokens.color;

test('the generated sheet is byte-identical to the family reference output before the extraction', () => {
	assert.equal(`${new TokenSheet(tokens).css}\n`, readFileSync(fixture, 'utf8'));
});

test('the packed tokens.css is the generated sheet', () => {
	assert.equal(readFileSync(built, 'utf8'), readFileSync(fixture, 'utf8'));
});

test('version, status and provenance of the extraction are recorded', () => {
	assert.equal(tokens.version, '0.1.0');
	assert.equal(tokens.status, 'proposed');
	assert.equal(tokens.attribute, 'data-beyond-mode');
	assert.equal(tokens.provenance.origin, 'branding/src/foundations');
	assert.match(tokens.provenance.revision, /^[0-9a-f]{40}$/);
});

test('every semantic role resolves to a primitive in both themes', () => {
	assert.deepEqual(Object.keys(themes.light).sort(), Object.keys(themes.dark).sort());
	for (const roles of Object.values(themes)) for (const primitive of Object.values(roles)) assert.ok(primitives[primitive], primitive);
});

test('every primitive states its provenance and every proposal its reason', () => {
	for (const [name, entry] of Object.entries(primitives)) {
		assert.match(entry.value, /^#[0-9a-f]{6}$/, name);
		assert.ok(entry.provenance === 'captured' ? entry.source : entry.reason, name);
	}
});

for (const theme of Object.keys(themes)) {
	test(`declared pairs meet their WCAG ratio in the ${theme} theme`, () => {
		const required = { text: Contrast.required.text, graphic: Contrast.required.graphic, decorative: 1 };
		for (const [foreground, background, kind] of pairs) {
			const ratio = Contrast.ratio(primitives[themes[theme][foreground]].value, primitives[themes[theme][background]].value);
			assert.ok(ratio >= required[kind], `${foreground} on ${background} is ${ratio.toFixed(2)}:1`);
		}
	});
}

test('a sheet from changed tokens differs: the byte check can fail', () => {
	const changed = structuredClone(tokens);
	changed.color.primitives.white.value = '#fefefe';
	assert.notEqual(new TokenSheet(changed).css, new TokenSheet(tokens).css);
});
