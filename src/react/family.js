import React from 'react';
import ReactDOM from 'react-dom';
import { FamilyBar as Bar } from '../dom/family/bar.js';
import { ProductNav as Row } from '../dom/nav.js';
import { Unavailable as Missing, glyphs } from '../dom/unavailable.js';
import { Mark, Badge } from './simple.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { useId, useState } = React;

/**
 * The family bar, driven by the DOM `FamilyBar` class. `descriptor` is a prop (null while loading,
 * `{ unavailable: true }` when the relay failed); `notifications` is React content rendered into its
 * slot; `account.signout` and `account.items[].onSelect` are called with the latest props.
 * `onNavigate(item, event)` takes over plain clicks on the bar's same-origin links. A change of
 * `product`, `brand`, `products`, `labels` (memoize it), `advisory`, the account entries or `toggle`
 * creates a new bar.
 */
export function FamilyBar({ product, brand, descriptor = null, fallback = null, products = {}, notifications = null, account = {}, toggle = null, onNavigate = null, advisory = ['NOT_ADMITTED'], labels }) {
	const [slot] = useState(() => document.createElement('div'));
	const latest = useLatest({ account, toggle, onNavigate });
	const items = (account.items ?? []).filter(Boolean);
	const signout = account.signout ?? null;
	const [host, bar] = useInstance(() => {
		slot.className = 'bui-slot';
		return new Bar({
			product,
			brand,
			descriptor,
			fallback: fallback ?? {},
			products,
			advisory,
			labels,
			notifications: slot,
			account: {
				label: account.label ?? null,
				signout: typeof signout === 'function' ? () => latest.current.account.signout?.() : signout,
				items: items.map((item, index) => ({ label: item.label, href: item.href ?? null, run: item.href ? null : () => latest.current.account.items?.filter(Boolean)[index]?.onSelect?.() }))
			},
			onnavigate: onNavigate ? (item, event) => latest.current.onNavigate?.(item, event) : null,
			toggle: toggle ? { controls: toggle.controls, expanded: toggle.expanded, onchange: expanded => latest.current.toggle?.onChange?.(expanded) } : null
		});
	}, [product, brand.src, brand.href, JSON.stringify(products), JSON.stringify(advisory), labels, account.label, typeof signout === 'function' ? 'function' : signout?.href, JSON.stringify(items.map(item => [item.label, item.href ?? null])), Boolean(toggle), toggle?.controls, Boolean(onNavigate)]);
	useSync(bar, current => (current.descriptor = descriptor), [JSON.stringify(descriptor)]);
	useSync(bar, current => (current.fallback = fallback ?? {}), [JSON.stringify(fallback)]);
	useSync(bar, current => {
		if (toggle && current.expanded !== toggle.expanded) current.expanded = toggle.expanded;
	}, [toggle?.expanded]);
	return h('div', { ref: host, className: 'bui-host bui-family-host' }, notifications ? ReactDOM.createPortal(notifications, slot) : null);
}

/** The product's own navigation row under the family bar, driven by the DOM `ProductNav` class. */
export function ProductNav({ items, label = null, sticky = false, onNavigate = null, labels }) {
	const latest = useLatest(onNavigate);
	const [host, row] = useInstance(() => new Row({ items: [], label, sticky, labels, onnavigate: onNavigate ? (item, event) => latest.current?.(item, event) : null }), [label, sticky, labels, Boolean(onNavigate)]);
	useSync(row, current => (current.items = items), [JSON.stringify(items)]);
	return h('div', { ref: host, className: 'bui-host' });
}

/**
 * "Not available here", rendered by React with the markup of the DOM `Unavailable`: `action` and
 * `secondary` are React content.
 */
export function Unavailable({ title, reason, owner = null, action = null, secondary = null, kind = 'access', code = null, level = 2, labels = {} }) {
	const id = `bui-unavailable-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const type = glyphs[kind] ? kind : 'access';
	return h(
		'section',
		{ className: `bui-unavailable bui-unavailable-${type}`, 'data-unavailable': type, 'aria-labelledby': id },
		h('span', { className: 'bui-unavailable-icon' }, h(Mark, { name: glyphs[type] })),
		h(
			'div',
			{ className: 'bui-unavailable-body' },
			h(`h${Missing.level(level)}`, { id, className: 'bui-unavailable-title' }, title),
			h('p', { className: 'bui-unavailable-reason' }, reason),
			owner ? h('p', { className: 'bui-unavailable-owner' }, h('span', { className: 'bui-unavailable-label' }, labels.owner ?? 'Who can change this: '), owner) : null,
			code ? h('p', { className: 'bui-unavailable-code' }, h(Badge, { label: code, tone: 'neutral' })) : null,
			action || secondary ? h('div', { className: 'bui-unavailable-actions' }, action, secondary) : null
		)
	);
}
