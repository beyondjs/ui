import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

/**
 * A borderless control is placed by what it draws (0.37.0, D188), in the built stylesheet: a quiet button hangs
 * its padding past its words by one token, `--bui-quiet-hang`, keeping it beside another control; an action line
 * hangs its actions once, on every row it wraps to; a composer's box narrows the hang to stay inside its border
 * and ends its band's action on its inset; a sentence and its action, and a value and its Copy, stand twice the
 * hang apart; the package's rows of controls keep their quiet ones' padding; and no stylesheet of the package
 * hangs a quiet control by a number of its own. The browser acceptance's `hanging` check measures it.
 */
const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of the rule whose selector is exactly `selector`, joined. */
function declarations(selector) {
	const found = [];
	for (const match of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (match[1].trim() === selector) found.push(match[2]);
	assert.ok(found.length, `no rule for ${selector}`);
	return found.join(';').replace(/\s+/g, ' ');
}

test('the hang is one token of the spacing scale', () => {
	assert.match(declarations(':root'), /--bui-quiet-hang: var\(--space-2\)/);
});

test('a quiet button hangs its padding past its words, its border counted, and keeps it beside another control', () => {
	const own = declarations('.bui-button-quiet:not(.bui-button-bare)');
	assert.match(own, /padding-inline: calc\(var\(--bui-quiet-hang\) - 1px\)/, 'its padding leaves room for its 1px border');
	assert.match(own, /margin-inline: calc\(-1 \* var\(--bui-quiet-hang\)\)/, 'it hangs by the same token');
	const controls = ':is(button, a, input, select, .bui-copy-button, .bui-menu-holder)';
	assert.match(declarations(':is(button, a, input, select, .bui-copy-button, .bui-menu-holder, :has(button, input, select)) + .bui-button-quiet:not(.bui-button-bare)'), /margin-inline-start: 0/, 'after a control, or what holds one');
	assert.match(declarations(`.bui-button-quiet:not(.bui-button-bare):has(+ ${controls})`), /margin-inline-end: 0/);
	assert.match(declarations('p > .bui-button-quiet:not(.bui-button-bare)'), /margin-inline: 0/, 'inside a sentence its words are part of it');
	const rows = sheet.match(/:is\((\.bui-page-actions[^)]*)\) > \.bui-button-quiet:not\(\.bui-button-bare\):not\(:first-child\)\s*\{[^}]*margin-inline-start: 0/);
	assert.ok(rows, 'in a row of actions it hangs only at the row\'s start');
	for (const row of ['.bui-page-actions', '.bui-section-actions', '.bui-callout-actions', '.bui-empty-actions', '.bui-dialog-actions']) assert.ok(rows[1].includes(row), row);
	assert.match(sheet, /\.bui-dictation-actions\) > \.bui-button-quiet:not\(\.bui-button-bare\):not\(:last-child\)\s*\{[^}]*margin-inline-end: 0/, 'and only at its end');
	for (const match of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const subject = match[1].replaceAll(':not(.bui-button-bare)', '');
		if (match[2].includes('--bui-quiet-hang')) assert.doesNotMatch(subject, /\.bui-button-bare/, `${match[1].trim()}: a glyph alone keeps the box its geometry gives it`);
	}
});

test('an action line hangs its actions once, on every row it wraps to, their borders counted', () => {
	assert.match(declarations('.bui-action-line-actions'), /margin-inline-start: calc\(-1 \* var\(--bui-quiet-hang\)\)/);
	const actions = declarations('.bui-action-line-actions :is(.bui-button, a, .bui-link-button, .bui-disclosure-button)');
	assert.match(actions, /margin-inline: 0/, 'an action never hangs a second time');
	assert.match(actions, /padding: 0 var\(--bui-quiet-hang\)/);
	assert.match(declarations('.bui-action-line-actions :is(.bui-button, .bui-disclosure-button):not(.bui-button-bare)'), /padding-inline: calc\(var\(--bui-quiet-hang\) - 1px\)/);
});

test('a composer keeps its quiet controls inside its border and ends its band\'s action on its inset', () => {
	assert.match(declarations('.bui-composer-box'), /--bui-quiet-hang: calc\(var\(--bui-composer-inset\) - var\(--space-1\)\)/);
	const band = declarations('.bui-composer-line');
	assert.match(band, /padding: var\(--space-1\) var\(--bui-composer-inset\)/, 'both sides on the inset');
	assert.match(band, /gap: 0 calc\(2 \* var\(--bui-quiet-hang\)\)/, 'its sentence and its action twice the hang apart');
});

test('beside text a quiet control stands twice the hang away; in a row of controls it keeps its padding', () => {
	assert.match(declarations('.bui-copy-value'), /gap: calc\(2 \* var\(--bui-quiet-hang\)\)/);
	assert.match(declarations('.bui-diff-large'), /gap: var\(--space-1\) calc\(2 \* var\(--bui-quiet-hang\)\)/);
	assert.match(declarations('.bui-button-quiet:is(.bui-list-query, .bui-list-restriction)'), /margin-inline: 0/);
	assert.match(declarations('.bui-button-quiet.bui-composer-file-retry'), /margin-inline: 0/);
	assert.match(declarations('.bui-diff-head > .bui-copy-button .bui-button-quiet'), /margin-inline: 0/);
});

test('no stylesheet of the package hangs a quiet control by a number of its own', () => {
	const directory = new URL('../src/styles/', import.meta.url);
	for (const file of readdirSync(directory).filter(name => name.endsWith('.css'))) {
		const text = readFileSync(new URL(file, directory), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		for (const match of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
			if (!/bui-button-quiet|bui-action-line-actions/.test(match[1])) continue;
			for (const margin of match[2].matchAll(/margin-inline(?:-start|-end)?:\s*([^;]+)/g)) {
				const value = margin[1].trim();
				if (value === '0') continue;
				assert.match(value, /--bui-quiet-hang/, `${file}: ${match[1].trim()} hangs by ${value}`);
			}
		}
	}
});

test('a state\'s axis is where its words start after its mark: its 9 px mark and its 6 px gap', () => {
	assert.match(declarations(':root'), /--bui-status-axis: 15px/);
	assert.match(declarations('.bui-status'), /gap: 6px/);
	assert.match(sheet, /\.bui-status-dot \{[^}]*width: 9px/, 'the mark the axis counts');
});
