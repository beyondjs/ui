import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * What a page scrolls to lands below its sticky lines on every page with the family bar (0.33.0): an
 * address's target, a heading focused by code, scrollIntoView. The document's `scroll-padding-top` holds the
 * bar and, below the sidebar's cut, its product row unless the bar holds the sidebar; the compact line's
 * rules add its height where one is drawn; and the sticky lines' own controls keep their scroll area below
 * that padding, so their focus never moves the page. happy-dom resolves no `:has()`, so the stylesheet is
 * read here and both are measured in Chrome, Firefox and WebKit by `acceptance/checks/targeting.mjs`.
 */
const sheet = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim().replace(/\s+/g, ' '), body }));
const padding = selector => rules.find(rule => rule.selector === selector)?.body.match(/scroll-padding-top:\s*([^;]+);/)?.[1].trim() ?? null;

test('every page with the family bar keeps scrolled targets below the bar, and below the sidebar\'s row where one is drawn', () => {
	assert.equal(padding('html:where(:has(.bui-family))'), 'calc(var(--layout-family) + var(--space-2))');
	assert.equal(padding("html:where(:has(.bui-family):has(.bui-sidebar[data-mode='drawer']:not([data-merged])))"), 'calc(var(--layout-family) + var(--bui-sidebar-row, 44px) + var(--space-2))', 'a merged sidebar draws no row');
	const order = ['html:where(:has(.bui-family))', "html:where(:has(.bui-family):has(.bui-sidebar[data-mode='drawer']:not([data-merged])))"].map(selector => rules.findIndex(rule => rule.selector === selector));
	assert.ok(order[0] < order[1], 'the row is added after the bar alone, at the same weight');
});

test('a control on a sticky line keeps its scroll area below the tallest padding, so its focus never moves the page', () => {
	// Chrome and WebKit scroll the page when a sticky control under the padding takes focus; Firefox does not
	const rule = rules.find(item => /scroll-margin-top/.test(item.body));
	assert.ok(rule, 'a rule moves the sticky controls\' scroll area');
	assert.match(rule.selector, /^:where\(\.bui-family, \.bui-sidebar-row, \.bui-page-compact-line\) :where\(a, button, input, select, textarea, summary, \[tabindex\]\)/);
	assert.match(rule.selector, /:not\(:where\(\.bui-disclosure-panel, \[data-bui-floating\], dialog\), :where\(\.bui-disclosure-panel, \[data-bui-floating\], dialog\) \*\)$/, 'never a menu\'s or a dialog\'s entries, which scroll inside their panel');
	const tallest = 'var(--layout-family) + var(--bui-sidebar-row, 44px) + var(--bui-page-compact-tall) + var(--space-2)';
	assert.match(rule.body, new RegExp(`scroll-margin-top:\\s*calc\\(-1 \\* \\(${tallest.replace(/[()+*,.-]/g, '\\$&')}\\)\\);`));
	assert.match(rule.body, new RegExp(`scroll-margin-bottom:\\s*calc\\(${tallest.replace(/[()+*,.-]/g, '\\$&')}\\);`), 'moved down whole, never turned inside out');
	assert.equal(rules.filter(item => /scroll-margin/.test(item.body)).length, 1, 'no other part moves its scroll area');
});

test('the compact line still adds its height where one is drawn: its rules outweigh the weightless ones', () => {
	assert.equal(padding('html:has(.bui-page-compact)'), 'calc(var(--layout-family) + var(--bui-page-compact) + var(--space-2))');
	assert.equal(padding("html:has(.bui-sidebar[data-mode='drawer']):has(.bui-page-compact)"), 'calc(var(--layout-family) + var(--bui-sidebar-row, 44px) + var(--bui-page-compact) + var(--space-2))');
	assert.match(padding("html:has(.bui-page[data-template='thread'] .bui-page-compact), html:has(.bui-page-compact[data-subject])") ?? '', /--bui-page-compact-tall/);
	// Every other scroll-padding-top on the document weighs a class or more, so none gives way to the bar's own
	for (const rule of rules.filter(rule => /scroll-padding-top/.test(rule.body))) {
		const weightless = rule.selector.startsWith('html:where(');
		assert.ok(weightless || /^html:has\(/.test(rule.selector), `only the document's own rules set it: ${rule.selector}`);
	}
});
