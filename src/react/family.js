import React from 'react';
import ReactDOM from 'react-dom';
import { FamilyBar as Bar } from '../dom/family/bar.js';
import { ProductNav as Row } from '../dom/nav.js';
import { Unavailable as Missing, glyphs } from '../dom/unavailable.js';
import { Sidebar as Sections } from '../dom/sidebar/sidebar.js';
import { Mark, Badge } from './simple.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { useId, useState } = React;

/**
 * The family bar, driven by the DOM `FamilyBar` class. `descriptor` is a prop (null while loading,
 * `{ unavailable: true }` when the relay failed); `notifications` is React content rendered into its
 * slot; `account.signout` (a callback, or since 0.5.0 `{ end, before?, after?, bound? }`, whose
 * functions are read from the latest props) and `account.items[].onSelect` are called with the latest props.
 * `account.preferences` (`{ preferences, everywhere, onclose? }`, since 0.6.0) adds "Language and appearance";
 * since 0.6.4 its `everywhere` and `onclose` are read from the latest props, so a new address (a string
 * or an inline function) never draws the bar again.
 * `onNavigate(item, event)` takes over plain clicks on the bar's same-origin links. `notice` is
 * applied when its text, address or action label change, and its `action.onSelect` is called with
 * the latest props. A change of `product`, `brand`, `products`, `labels` (memoize it), `advisory`,
 * `transient`, the account entries or `toggle` creates a new bar. `signin` (0.8.0, from `useSession`)
 * offers "Sign in" in place of the account menu while the person reads without a session.
 */
export function FamilyBar({ product, brand, descriptor = null, fallback = null, products = {}, notifications = null, account = {}, toggle = null, onNavigate = null, advisory = ['NOT_ADMITTED'], notice = null, transient = [], signin = null, labels }) {
	const [slot] = useState(() => document.createElement('div'));
	const latest = useLatest({ account, toggle, onNavigate, notice });
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
				signout: leaving(signout, latest),
				items: items.map((item, index) => ({ label: item.label, href: item.href ?? null, run: item.href ? null : () => latest.current.account.items?.filter(Boolean)[index]?.onSelect?.() })),
				preferences: preferring(account.preferences, latest)
			},
			onnavigate: onNavigate ? (item, event) => latest.current.onNavigate?.(item, event) : null,
			toggle: toggle ? { controls: toggle.controls, expanded: toggle.expanded, onchange: expanded => latest.current.toggle?.onChange?.(expanded) } : null,
			notice: relay(notice, latest),
			transient
		});
	}, [product, brand.src, brand.href, JSON.stringify(products), JSON.stringify(advisory), JSON.stringify(transient), labels, account.label, typeof signout === 'function' ? 'function' : (signout?.href ?? (signout ? `leave:${signout.bound ?? ''}` : null)), JSON.stringify(items.map(item => [item.label, item.href ?? null])), account.preferences?.preferences, JSON.stringify(account.preferences?.locales ?? null), Boolean(toggle), toggle?.controls, Boolean(onNavigate)]);
	useSync(bar, current => (current.notice = relay(notice, latest)), [notice?.text, notice?.href, notice?.action?.label, notice?.action?.href]);
	useSync(bar, current => (current.descriptor = descriptor), [JSON.stringify(descriptor)]);
	useSync(bar, current => (current.fallback = fallback ?? {}), [JSON.stringify(fallback)]);
	useSync(bar, current => (current.signin = signin ? { label: signin.label, run: () => signin.run() } : null), [signin]);
	useSync(bar, current => {
		if (toggle && current.expanded !== toggle.expanded) current.expanded = toggle.expanded;
	}, [toggle?.expanded]);
	return h('div', { ref: host, className: 'bui-host bui-family-host' }, notifications ? ReactDOM.createPortal(notifications, slot) : null);
}

/**
 * The DOM `account.preferences` for the prop: the product's `Preferences` instance as given, its
 * `everywhere` (a string or a function) and `onclose` read from the latest props each time they are used.
 */
function preferring(preferences, latest) {
	if (!preferences) return null;
	const now = () => latest.current.account.preferences;
	return {
		preferences: preferences.preferences,
		locales: preferences.locales,
		everywhere: () => {
			const everywhere = now()?.everywhere;
			return (typeof everywhere === 'function' ? everywhere() : everywhere) ?? null;
		},
		onclose: () => now()?.onclose?.()
	};
}

/**
 * The DOM `account.signout` for the prop: a callback and `{ end, before, after }` call the latest
 * props' functions; `{ href }` is passed as given.
 */
function leaving(signout, latest) {
	const now = () => latest.current.account.signout;
	if (typeof signout === 'function') return () => now()?.();
	if (!signout || typeof signout.href === 'string') return signout;
	return {
		end: () => now()?.end?.(),
		before: signout.before ? () => now()?.before?.() : null,
		after: () => now()?.after?.(),
		bound: signout.bound
	};
}

/** The DOM notice for a `notice` prop: its action's `onSelect` is read from the latest props when chosen. */
function relay(notice, latest) {
	if (!notice?.text) return null;
	const action = notice.action?.label ? { label: notice.action.label, href: notice.action.href ?? null, run: notice.action.href ? null : () => latest.current.notice?.action?.onSelect?.() } : null;
	return { text: notice.text, href: notice.href ?? null, action };
}

/**
 * A product's sections, driven by the DOM `Sidebar` class: permanent above `cut`, a product row and a
 * modal drawer below it. `groups`, `context` and `section` are applied when they change; a change of
 * `product`, `cut`, `labels` (memoize it) or whether `onNavigate` is given creates a new sidebar.
 */
export function Sidebar({ product, groups = [], context = null, cut = 1024, section = null, onNavigate = null, labels }) {
	const latest = useLatest(onNavigate);
	const [host, sidebar] = useInstance(() => new Sections({ product, groups, context, cut, section, labels, onnavigate: onNavigate ? (item, event) => latest.current?.(item, event) : null }), [product, cut, labels, Boolean(onNavigate)]);
	useSync(sidebar, current => (current.groups = groups), [JSON.stringify(groups)]);
	useSync(sidebar, current => (current.context = context), [JSON.stringify(context)]);
	useSync(sidebar, current => (current.section = section), [section]);
	return h('div', { ref: host, className: 'bui-host bui-sidebar-host' });
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
			owner ? h('p', { className: 'bui-unavailable-owner' }, h('span', { className: 'bui-unavailable-label' }, labels.owner ?? Missing.labels.en.owner), owner) : null,
			code ? h('p', { className: 'bui-unavailable-code' }, h(Badge, { label: code, tone: 'neutral' })) : null,
			action || secondary ? h('div', { className: 'bui-unavailable-actions' }, action, secondary) : null
		)
	);
}

// The copy in English and Spanish, as on the DOM classes (0.7.1).
Unavailable.labels = Missing.labels;
FamilyBar.labels = Bar.labels;
Sidebar.labels = Sections.labels;
ProductNav.labels = Row.labels;
