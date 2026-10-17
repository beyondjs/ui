import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * The approved foundations as the component stylesheet applies them (token set 0.2.0): sentence
 * case, Rubik 300 only at body size and larger, `border-control` on controls, elevation only on what
 * overlaps the page. Read from the built `dist/styles.css`, the file consumers install.
 */
const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim().replace(/\s+/g, ' '), body }));
const find = selector => rules.filter(rule => rule.selector.split(',').map(part => part.trim()).includes(selector));

test('no capitals by style: nothing is transformed to upper case (D20)', () => {
	assert.doesNotMatch(sheet, /text-transform:\s*(uppercase|capitalize)/);
	for (const selector of ['.bui-badge', '.bui-table thead th', '.bui-table:not(.bui-data) tbody td::before', '.bui-navmenu-heading', '.bui-consequence dt']) {
		assert.ok(find(selector).length, selector);
		for (const rule of find(selector)) assert.doesNotMatch(rule.body, /letter-spacing:\s*0\.0[3-9]|letter-spacing:\s*0\.[1-9]/, selector);
	}
});

test('the interface face is Inter at 400, 500 and 600; Rubik draws only the lockup\'s name (C2)', () => {
	assert.ok(find('.bui-lockup-name').some(rule => /font-family:\s*var\(--font-brand\)/.test(rule.body)));
	assert.doesNotMatch(sheet, /font-family:\s*['"]?Rubik/);
	assert.ok(find('.bui-page-heading').some(rule => /font-weight:\s*var\(--weight-semibold\)/.test(rule.body)), 'a heading told apart by weight');
	assert.ok(find('.bui-mono').some(rule => /font-family:\s*var\(--font-mono\)/.test(rule.body)), 'identifiers in mono');
});

test('coral is kept for the primary action, the selection and focus (C2): links in the text color, a neutral disabled primary', () => {
	assert.ok(find('.bui-button-primary:disabled').some(rule => /var\(--color-disabled\)/.test(rule.body) && /var\(--color-on-disabled\)/.test(rule.body)));
	assert.ok(find('.bui-family-avatar').some(rule => !/--color-family-marker/.test(rule.body)), 'a person is not an action');
	assert.ok(find('.bui-sidebar-item[aria-current=\'page\']').some(rule => /--color-surface-selected/.test(rule.body)), 'the selection');
});

test('text below body size never uses Rubik 300 (D09)', () => {
	const small = rules.filter(rule => /font-size:\s*var\(--text-(small|label)\)/.test(rule.body));
	assert.ok(small.length > 20, `${small.length} rules`);
	for (const rule of small) assert.doesNotMatch(rule.body, /--weight-light/, rule.selector);
	assert.doesNotMatch(sheet, /--weight-light/);
});

test('labels are told apart by weight 500, not by case', () => {
	for (const selector of ['.bui-badge', '.bui-table thead th', '.bui-table:not(.bui-data) tbody td::before', '.bui-navmenu-heading']) {
		assert.ok(find(selector).some(rule => /font-weight:\s*var\(--weight-medium\)/.test(rule.body)), selector);
	}
});

test('controls take border-control; dividers and tags keep border-strong (D08)', () => {
	for (const selector of ['.bui-input', '.bui-select-control', '.bui-option-mark', '.bui-toggles', '.bui-menu-button', '.bui-disclosure-button', '.bui-button-secondary']) {
		assert.ok(find(selector).some(rule => /var\(--color-border-control\)/.test(rule.body)), selector);
		for (const rule of find(selector)) assert.doesNotMatch(rule.body, /--color-border-strong/, selector);
	}
	assert.ok(find('.bui-toggle + .bui-toggle').some(rule => /--color-border-strong/.test(rule.body)));
	assert.ok(find('.bui-badge').some(rule => /--color-border-strong/.test(rule.body)));
});

test('elevation only on what overlaps the page, and since 0.15.0 the raised surfaces inside it (D10 as amended by C2)', () => {
	const overlapping = /\.bui-(menu|disclosure-panel|disclosure-leaving|tooltip|toast|dialog|drawer-panel|sheet|composer-editor|palette)\b/;
	const inside = /^(\.bui-raised|\.bui-section\[data-raised\]|\.bui-command|\.bui-checklist)(, |$)/;
	const raised = rules.filter(rule => /box-shadow:\s*var\(--elevation-/.test(rule.body));
	assert.ok(raised.length >= 4, `${raised.length} rules`);
	for (const rule of raised) {
		if (/--elevation-raised/.test(rule.body)) assert.match(rule.selector, inside, `only a raised in-page surface: ${rule.selector}`);
		else assert.match(rule.selector, overlapping, rule.selector);
	}
	// Every other shadow is a mark (inset) or none.
	for (const rule of rules.filter(rule => /box-shadow:/.test(rule.body) && !/box-shadow:\s*var\(--elevation-/.test(rule.body))) {
		assert.match(rule.body, /box-shadow:\s*(none|inset\b)/, rule.selector);
	}
});
