import React from 'react';
import ReactDOM from 'react-dom';
import { Page as Region } from '../dom/page/page.js';
import { PagePanel } from '../dom/page/panel.js';
import { Arrival as Line } from '../dom/page/arrival.js';
import { Tabs as Row } from '../dom/page/tabs.js';
import { PageHeader as Heading } from '../dom/page/header.js';
import { PageCompact } from '../dom/page/compact.js';
import { Cut, NameTip } from '../dom/core/cut.js';
import { Mark } from './simple.js';
import { h, living, useInstance, useLatest, useSync } from './hooks.js';

const { createContext, useContext, useId, useLayoutEffect, useRef, useState } = React;
const Panel = createContext(null);

/**
 * The family page system (decision D52), rendered by React with the markup and classes of the DOM
 * `Page`, `PageHeader` and `Section`; `Arrival` and `Tabs` drive the DOM classes. A page is a region edge
 * to edge whose content starts one gutter after the navigation; see the DOM classes for the rules.
 */

/**
 * The content region: `template`, `width` (`fluid`, `standard`, `form`, `reading`), `arrival`, `header`,
 * `aside`. With `panel` (`{ cut?, open?, onChange?, title?, labels?, head?, wide? }`, 0.10.0) the aside is
 * a panel kept in view, driven by the DOM `PagePanel` (beside and sticky from `cut`, a side sheet below
 * it; since 0.11.0 with a head of its own and a wide form); `panelRef` receives it (`open()`, `close()`,
 * `toggle()`) and a `PanelToggle` inside the page toggles it. `width` takes `thread` since 0.11.0.
 */
export function Page({ template = 'detail', width = 'standard', arrival = null, header = null, aside = null, label = null, panel = null, panelRef = null, children }) {
	if (!Region.templates.includes(template)) throw new TypeError(`A page's template is one of ${Region.templates.join(', ')}`);
	if (!Region.widths.includes(width)) throw new TypeError(`A page's width is one of ${Region.widths.join(', ')}`);
	const frame = useRef(null);
	const body = useRef(null);
	const latest = useLatest(panel);
	const [made, setMade] = useState(null);
	const wanted = Boolean(panel);
	useLayoutEffect(() => {
		if (!wanted) return undefined;
		const given = latest.current ?? {};
		const instance = new PagePanel({ page: frame.current, body: body.current, cut: given.cut, open: given.open ?? true, title: given.title ?? null, label, labels: given.labels, head: Boolean(given.head), wide: Boolean(given.wide), onchange: shown => latest.current?.onChange?.(shown) });
		setMade(instance);
		assign(panelRef, instance);
		return () => {
			assign(panelRef, null);
			setMade(current => (current === instance ? null : current));
			instance.destroy();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [wanted, panel?.cut, panel?.title ?? null, label, Boolean(panel?.head)]);
	const instance = living(made);
	useSync(instance, current => (current.present = Boolean(aside)), [Boolean(aside)]);
	useSync(instance, current => (current.shown = panel?.open ?? true), [panel?.open]);
	useSync(instance, current => (current.wide = Boolean(panel?.wide)), [Boolean(panel?.wide)]);
	const region = h(
		'div',
		{ ref: frame, className: 'bui-page', 'data-template': template, 'data-width': width },
		h(
			'div',
			{ className: 'bui-page-frame' },
			arrival,
			header,
			h('div', { ref: body, className: 'bui-page-body' }, h('div', { className: 'bui-page-main' }, children), !wanted && aside ? h('aside', { className: 'bui-page-aside', 'aria-label': label ?? undefined }, aside) : null)
		)
	);
	return h(Panel.Provider, { value: instance }, region, instance && aside ? ReactDOM.createPortal(aside, instance.slot) : null);
}

/** The toggle of the page's panel ("Details"): a press shows or hides it, or opens its sheet; `aria-expanded` follows. */
export function PanelToggle({ label, variant = 'quiet', glyph = null }) {
	const panel = useContext(Panel);
	const button = useRef(null);
	useLayoutEffect(() => (panel && button.current ? panel.control(button.current) : undefined), [panel]);
	return h('button', { ref: button, type: 'button', className: `bui-button bui-button-${variant}` }, glyph ? h(Mark, { name: glyph }) : null, h('span', null, label));
}

/** Gives a ref (an object or a function) its value. */
function assign(ref, value) {
	if (typeof ref === 'function') ref(value);
	else if (ref) ref.current = value;
}

/**
 * The page's one header: `crumbs` (`{ label, href? }`, the levels above), the H1 `title`, one
 * `status`, a `facts` line, the title line's `actions` and the `tabs`. `headingRef` reaches the H1
 * for focus after a navigation. `compact` (`true` or `{ actions }`, 0.11.0) adds the sticky line that
 * shows the title and the status once the title has scrolled out, placed right before the header.
 */
export function PageHeader({ title, crumbs = [], status = null, facts = null, actions = null, tabs = null, headingRef = null, labels = {}, compact = null }) {
	const id = `bui-page-title-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const levels = (crumbs ?? []).filter(Boolean);
	const bar = useRef(null);
	const line = useRef(null);
	const named = useRef(null);
	useLayoutEffect(() => {
		if (!compact || !bar.current || !line.current) return undefined;
		const watch = new PageCompact({ header: line.current, bar: bar.current });
		const tip = new NameTip(named.current, { text: () => named.current?.textContent ?? '', cut: () => Cut.text(named.current) });
		return () => {
			watch.destroy();
			tip.destroy();
		};
	}, [Boolean(compact)]);
	const tools = compact?.actions ?? null;
	const held = compact
		? h(
				'div',
				{ ref: bar, className: 'bui-page-compact' },
				h('div', { className: 'bui-page-compact-line' }, h('div', { className: 'bui-page-compact-text', 'aria-hidden': 'true' }, h('span', { ref: named, className: 'bui-page-compact-title' }, title), h('span', { className: 'bui-page-compact-status' }, status)), h('div', { className: 'bui-page-compact-actions', hidden: !tools }, tools))
			)
		: null;
	const header = h(
		'header',
		{ className: 'bui-page-header' },
		levels.length
			? h('nav', { className: 'bui-crumbs', 'aria-label': labels.crumbs ?? 'Breadcrumb' }, h('ol', null, levels.map((level, index) => h('li', { key: index }, level.href ? h('a', { href: level.href }, level.label) : h('span', null, level.label)))))
			: null,
		h('div', { ref: line, className: 'bui-page-title' }, h('h1', { id, className: 'bui-page-heading', tabIndex: -1, ref: headingRef }, title), status ? h('span', { className: 'bui-page-status' }, status) : null, actions ? h('div', { className: 'bui-page-actions' }, actions) : null),
		facts ? h('p', { className: 'bui-page-facts' }, facts) : null,
		tabs ? h('div', { className: 'bui-page-tabs' }, tabs) : null
	);
	return held ? h(React.Fragment, null, held, header) : header;
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
export function Tabs({ items, label = null, name = null, onNavigate = null, labels }) {
	const latest = useLatest(onNavigate);
	const [host, row] = useInstance(() => new Row({ items: [], label, name, labels, onnavigate: onNavigate ? (item, event) => latest.current?.(item, event) : null }), [label, name, labels, Boolean(onNavigate)]);
	useSync(row, current => (current.items = items), [JSON.stringify(items)]);
	return h('div', { ref: host, className: 'bui-host' });
}

/**
 * List and detail (LR-03, FAM-40), rendered by React with the markup of the DOM `ListDetail`: the
 * open `detail` beside the `list` on a wide region, and alone with `back` (`{ label, href, onNavigate? }`)
 * on a narrow one. The product keeps the open item in its address.
 */
export function ListDetail({ list, detail = null, label = null, back = null }) {
	const navigate = event => {
		if (!back?.onNavigate || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		back.onNavigate(event);
	};
	const link = back?.href ? h('a', { href: back.href, className: 'bui-listdetail-link', onClick: navigate }, h(Mark, { name: 'back' }), back.label) : null;
	return h(
		'div',
		{ className: 'bui-listdetail', 'data-open': detail ? '' : undefined },
		h(
			'div',
			{ className: 'bui-listdetail-frame' },
			h('div', { className: 'bui-listdetail-list' }, list),
			h('section', { className: 'bui-listdetail-detail', 'aria-label': label ?? undefined, tabIndex: -1, hidden: !detail }, h('p', { className: 'bui-listdetail-back' }, link), h('div', { className: 'bui-listdetail-body' }, detail))
		)
	);
}

// The copy in English and Spanish, as on the DOM classes (0.7.2).
PageHeader.labels = Heading.labels;
Tabs.labels = Row.labels;
