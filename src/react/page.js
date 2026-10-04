import React from 'react';
import { Page as Region } from '../dom/page/page.js';
import { Arrival as Line } from '../dom/page/arrival.js';
import { Tabs as Row } from '../dom/page/tabs.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { useId } = React;

/**
 * The family page system (decision D52), rendered by React with the markup and classes of the DOM
 * `Page`, `PageHeader` and `Section`; `Arrival` and `Tabs` drive the DOM classes. A page is a region edge
 * to edge whose content starts one gutter after the navigation; see the DOM classes for the rules.
 */

/** The content region: `template`, `width` (`fluid`, `standard`, `form`, `reading`), `arrival`, `header`, `aside`. */
export function Page({ template = 'detail', width = 'standard', arrival = null, header = null, aside = null, label = null, children }) {
	if (!Region.templates.includes(template)) throw new TypeError(`A page's template is one of ${Region.templates.join(', ')}`);
	if (!Region.widths.includes(width)) throw new TypeError(`A page's width is one of ${Region.widths.join(', ')}`);
	return h(
		'div',
		{ className: 'bui-page', 'data-template': template, 'data-width': width },
		h(
			'div',
			{ className: 'bui-page-frame' },
			arrival,
			header,
			h('div', { className: 'bui-page-body' }, h('div', { className: 'bui-page-main' }, children), aside ? h('aside', { className: 'bui-page-aside', 'aria-label': label ?? undefined }, aside) : null)
		)
	);
}

/**
 * The page's one header: `crumbs` (`{ label, href? }`, the levels above), the H1 `title`, one
 * `status`, a `facts` line, the title line's `actions` and the `tabs`. `headingRef` reaches the H1
 * for focus after a navigation.
 */
export function PageHeader({ title, crumbs = [], status = null, facts = null, actions = null, tabs = null, headingRef = null, labels = {} }) {
	const id = `bui-page-title-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const levels = (crumbs ?? []).filter(Boolean);
	return h(
		'header',
		{ className: 'bui-page-header', 'aria-labelledby': id },
		levels.length
			? h('nav', { className: 'bui-crumbs', 'aria-label': labels.crumbs ?? 'Breadcrumb' }, h('ol', null, levels.map((level, index) => h('li', { key: index }, level.href ? h('a', { href: level.href }, level.label) : h('span', null, level.label)))))
			: null,
		h('div', { className: 'bui-page-title' }, h('h1', { id, className: 'bui-page-heading', tabIndex: -1, ref: headingRef }, title), status ? h('span', { className: 'bui-page-status' }, status) : null, actions ? h('div', { className: 'bui-page-actions' }, actions) : null),
		facts ? h('p', { className: 'bui-page-facts' }, facts) : null,
		tabs ? h('div', { className: 'bui-page-tabs' }, tabs) : null
	);
}

/** A flat section: `title`, one `description` line, its `actions` and its content. */
export function Section({ title, description = null, actions = null, level = 2, children }) {
	const id = `bui-section-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	return h(
		'section',
		{ className: 'bui-section', 'aria-labelledby': id },
		h('div', { className: 'bui-section-head' }, h(level === 3 ? 'h3' : 'h2', { id, className: 'bui-section-title' }, title), actions ? h('div', { className: 'bui-section-actions' }, actions) : null),
		description ? h('p', { className: 'bui-section-description' }, description) : null,
		h('div', { className: 'bui-section-body' }, children)
	);
}

/**
 * The arrival line (D54), driven by the DOM `Arrival` class: "Opened from {product} · Back to
 * {product}". `onDismiss` offers Dismiss; `onNavigate(item, event)` takes over a plain click on a
 * same-origin way back. Both are called with the latest props.
 */
export function Arrival({ product, href, onDismiss = null, onNavigate = null, labels }) {
	const latest = useLatest({ onDismiss, onNavigate });
	const [host] = useInstance(
		() =>
			new Line({
				product,
				href,
				labels,
				ondismiss: onDismiss ? () => latest.current.onDismiss?.() : null,
				onnavigate: onNavigate ? (item, event) => latest.current.onNavigate?.(item, event) : null
			}),
		[product, href, labels, Boolean(onDismiss), Boolean(onNavigate)]
	);
	return h('div', { ref: host, className: 'bui-host' });
}

/** A resource's areas as tabs, driven by the DOM `Tabs` class. */
export function Tabs({ items, label = null, onNavigate = null, labels }) {
	const latest = useLatest(onNavigate);
	const [host, row] = useInstance(() => new Row({ items: [], label, labels, onnavigate: onNavigate ? (item, event) => latest.current?.(item, event) : null }), [label, labels, Boolean(onNavigate)]);
	useSync(row, current => (current.items = items), [JSON.stringify(items)]);
	return h('div', { ref: host, className: 'bui-host' });
}
