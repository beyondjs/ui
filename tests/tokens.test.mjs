import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tokens, TokenSheet, Contrast } from '@beyond-js/ui/tokens';

/**
 * The token set: the package is the canonical source from 0.1.0, when it reproduced byte for byte
 * the sheet the family reference generated before the move. Token set 0.2.0 (the owner's approval of
 * 2026-09-29) is that baseline plus exactly the recorded changes below, in place, and nothing else;
 * token set 0.3.0 (the family page system, D52, approved on 2026-10-04) adds the layout tokens, 0.3.1
 * narrows the reading measure from 68ch to the 54ch measured against LR-02, and 0.4.0 adds the thread
 * tier and the panel's widths of the family proposal D67 as pending, not approved; 0.4.1 raises the
 * pending panel maximum to 40rem; 0.4.2 gives the menu elevation a dark value; 0.5.0 adds the exit motion
 * of D95, the thread's lane and rail indent of D96 (which approves the thread tier as the wide lane) and
 * the proposed code colors; 0.5.1 records the panel's widths as approved (D67 as amended by D96, S29),
 * with no line of the sheet changed but its version.
 * Imported through the package's own export, as consumers import it.
 */
const fixture = new URL('./fixtures/branding-tokens-0.1.0.css', import.meta.url);
const built = new URL('../dist/tokens.css', import.meta.url);
const { primitives, themes, pairs } = tokens.color;
const dark = ['--color-border-control: #8e99bb;', '--elevation-menu: 0 12px 28px -6px rgba(0, 0, 0, .5), 0 4px 10px 0 rgba(0, 0, 0, .32);', '--elevation-window: 0 14px 30px -12px rgba(12, 21, 37, .9);', '--elevation-window-focus: 0 30px 64px -16px rgba(12, 21, 37, .96);'];
const code = {
	light: ['--color-code-comment: #5f5f5f;', '--color-code-keyword: #0033e8;', '--color-code-string: #2b6a3f;', '--color-code-number: #9e533e;', '--color-code-name: #7a5200;', '--color-code-tag: #b3261e;'],
	dark: ['--color-code-comment: #99a3b1;', '--color-code-keyword: #9fb5ff;', '--color-code-string: #7fd19b;', '--color-code-number: #ffa385;', '--color-code-name: #f7c700;', '--color-code-tag: #ff8a80;']
};
const changes = {
	removed: ['/* Beyond family tokens 0.1.0 (proposed). Generated from src/foundations; do not edit. */', '\t--text-label: 0.6875rem;', '\t--tracking-label: 0.08em;', '\t--layout-measure: 68ch;'],
	added: [
		'/* Beyond family tokens 0.5.1 (approved). Generated from src/foundations; do not edit. */',
		// 0.5.0: D95's exit motion and D96's lane (approved, S29)
		'\t--motion-exit: 120ms;',
		'\t--motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);',
		'\t--layout-indent: 2.125rem;',
		'\t--layout-lane: calc(var(--layout-measure) + var(--layout-indent));',
		// 0.5.0: the proposed code colors, light (in :root) and dark (twice)
		...code.light.map(line => `\t${line}`),
		...code.dark.map(line => `\t${line}`),
		...code.dark.map(line => `\t${line}`),
		// 0.4.0: the family proposal D67, adopted by Conduict and shipped as pending; 0.4.1 raises the panel's maximum; 0.5.1 records them approved (D67 as amended by D96)
		'\t--layout-thread: 52rem;',
		'\t--layout-aside-max: 40rem;',
		'\t--layout-aside-wide: 48rem;',
		// 0.3.1: the reading measure, measured against LR-02 (no line of prose past 80 characters)
		'\t--layout-measure: 54ch;',
		// 0.3.0: the gutter by band and the width tiers of the family page system (D52)
		'\t--layout-gutter: 16px;',
		'\t--layout-gutter-medium: 24px;',
		'\t--layout-gutter-wide: 32px;',
		'\t--layout-form: 40rem;',
		'\t--layout-standard: 90rem;',
		'\t--layout-aside: 22rem;',
		'\t--layout-fluid-max: 100rem;',
		'\t--weight-regular: 400;',
		'\t--text-label: 0.75rem;',
		'\t--tracking-label: 0.02em;',
		'\t--elevation-window: 0 1px 2px rgba(18, 31, 54, .06), 0 8px 20px -12px rgba(18, 31, 54, .16);',
		'\t--elevation-window-focus: 0 2px 4px rgba(18, 31, 54, .06), 0 22px 44px -18px rgba(18, 31, 54, .28);',
		'\t--color-border-control: #767676;',
		// Twice: under data-beyond-mode='dark' and under the system preference.
		...dark.map(line => `\t${line}`),
		...dark.map(line => `\t${line}`)
	]
};
const without = (lines, listed) => {
	const left = [...listed];
	return lines.filter(line => {
		const index = left.indexOf(line);
		if (index === -1) return true;
		left.splice(index, 1);
		return false;
	});
};

test('the 0.5.1 sheet is the 0.1.0 extraction baseline with exactly the recorded changes', () => {
	const baseline = readFileSync(fixture, 'utf8').split('\n');
	const current = `${new TokenSheet(tokens).css}\n`.split('\n');
	for (const line of changes.removed) assert.ok(baseline.includes(line) && !current.includes(line), `removed: ${line}`);
	for (const line of changes.added) assert.ok(current.includes(line), `added: ${line}`);
	assert.deepEqual(without(current, changes.added), without(baseline, changes.removed));
});

test('the packed tokens.css is the generated sheet', () => {
	assert.equal(readFileSync(built, 'utf8'), `${new TokenSheet(tokens).css}\n`);
});

test('version, status, approval and provenance of the token set are recorded', () => {
	assert.equal(tokens.version, '0.5.1');
	assert.deepEqual(tokens.pending.tokens, ['color.code-comment', 'color.code-keyword', 'color.code-string', 'color.code-number', 'color.code-name', 'color.code-tag'], 'only the code colors are pending');
	assert.deepEqual(tokens.pending.decisions, [], 'no family decision is pending');
	const round = tokens.approval.conversation;
	assert.deepEqual([round.date, round.decisions, round.contract], ['2026-10-10', ['D67', 'D95', 'D96'], 'S29']);
	assert.deepEqual(round.tokens, ['motion.exit', 'motion.ease-exit', 'layout.thread', 'layout.indent', 'layout.lane', 'layout.aside-max', 'layout.aside-wide'], 'the panel\'s widths are approved with the round');
	for (const name of round.tokens) assert.ok(!tokens.pending.tokens.includes(name), `${name} is not pending`);
	for (const name of ['aside-max', 'aside-wide']) assert.doesNotMatch(tokens.layout[name].reason, /Not an approved family rule/, name);
	assert.deepEqual([tokens.layout['aside-max'].value, tokens.layout['aside-wide'].value], ['40rem', '48rem'], 'the panel\'s widths keep their values');
	for (const name of round.tokens) {
		const [group, key] = name.split('.');
		assert.equal(tokens[group][key].provenance, 'family', name);
	}
	assert.equal(tokens.layout.measure.value, '54ch', 'the reading measure stays');
	assert.equal(tokens.status, 'approved');
	assert.equal(tokens.approval.date, '2026-09-29');
	assert.deepEqual(tokens.approval.decisions, ['D08', 'D09', 'D10', 'D12', 'D20']);
	assert.deepEqual([tokens.approval.layout.date, tokens.approval.layout.decisions], ['2026-10-04', ['D52']]);
	assert.equal(tokens.breakpoints.steps.compact, 640, 'the compact band of the page system');
	assert.equal(tokens.attribute, 'data-beyond-mode');
	assert.equal(tokens.provenance.origin, 'branding/src/foundations');
	assert.match(tokens.provenance.revision, /^[0-9a-f]{40}$/);
});

test('controls have their own boundary role, held to 3:1 in both themes; dividers keep border-strong', () => {
	assert.equal(primitives[themes.light['border-control']].value, '#767676');
	assert.equal(primitives[themes.dark['border-control']].value, '#8e99bb');
	assert.ok(pairs.some(([foreground, background, kind]) => foreground === 'border-control' && background === 'surface' && kind === 'graphic'));
	assert.ok(pairs.some(([foreground, , kind]) => foreground === 'border-strong' && kind === 'decorative'));
});

test('the type scale: weight 400 below body size, a 0.75rem label with at most 0.02em tracking', () => {
	const { weight, size } = tokens.typography;
	assert.deepEqual(Object.fromEntries(Object.entries(weight).map(([name, entry]) => [name, entry.value])), { light: 300, regular: 400, medium: 500 });
	assert.equal(size.label.value, '0.75rem');
	assert.ok(parseFloat(size.label.tracking) <= 0.02, size.label.tracking);
	assert.doesNotMatch(size.label.reason, /uppercase/i);
	for (const entry of [...Object.values(weight), ...Object.values(size)]) assert.ok(entry.source ?? entry.reason, JSON.stringify(entry));
});

test('elevation: menu, dialog and the two window levels; the window levels change with the theme', () => {
	assert.deepEqual(Object.keys(tokens.elevation), ['flat', 'menu', 'dialog', 'window', 'window-focus']);
	const sheet = new TokenSheet(tokens);
	assert.ok(sheet.shared.includes(`--elevation-window: ${tokens.elevation.window.value};`));
	assert.ok(sheet.theme('dark').includes(`--elevation-window-focus: ${tokens.elevation['window-focus'].dark};`));
	assert.ok(sheet.theme('dark').includes(`--elevation-menu: ${tokens.elevation.menu.dark};`), 'a menu lifts off the dark page (0.4.2)');
	assert.ok(!sheet.theme('light').some(line => line.startsWith('--elevation-')));
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

test('the brand orange and its variants state their use; white never sits on it', () => {
	for (const name of ['coral-400', 'coral-600', 'coral-200', 'coral-500']) assert.ok(primitives[name].use, name);
	assert.equal(primitives['coral-400'].value, '#e46f4e');
	assert.ok(Contrast.ratio(primitives.white.value, primitives['coral-400'].value) < Contrast.required.text);
	assert.notEqual(themes.dark['on-action'], 'white');
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
