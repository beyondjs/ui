import React from 'react';
import ReactDOM from 'react-dom';
import { Header as Bar } from '../dom/header.js';
import { Disclosure as Panel } from '../dom/disclosure.js';
import { ActionMenu as Menu } from '../dom/menu.js';
import { Help as Explanation } from '../dom/help.js';
import { Tooltip as Hint } from '../dom/tooltip.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { useLayoutEffect, useRef, useState } = React;

/**
 * The shared family header, driven by the DOM `Header` class. `context` and `nav` are entry arrays
 * (`{ label, href, current }`); `notifications` and `account` are React content rendered into their
 * slots. `toggle` makes the menu button open an external region such as a product sidebar;
 * `onNavigate(item, event)` takes over plain clicks on header links.
 */
export function Header({ brand, context = null, nav = null, notifications = null, account = null, toggle = null, onNavigate = null, labels }) {
	const [slots] = useState(() => ({ notifications: document.createElement('div'), account: document.createElement('div') }));
	const latest = useLatest({ toggle, onNavigate });
	const [host, bar] = useInstance(() => {
		slots.notifications.className = 'bui-slot';
		slots.account.className = 'bui-slot';
		return new Bar({
			brand,
			labels,
			notifications: slots.notifications,
			account: slots.account,
			onnavigate: onNavigate ? (item, event) => latest.current.onNavigate?.(item, event) : null,
			toggle: toggle ? { controls: toggle.controls, expanded: toggle.expanded, onchange: expanded => latest.current.toggle?.onChange?.(expanded) } : null
		});
	}, [brand.href, brand.label, brand.image?.src, labels, Boolean(toggle), toggle?.controls, Boolean(onNavigate)]);
	useSync(bar, current => (current.context = context), [JSON.stringify(context)]);
	useSync(bar, current => (current.nav = nav), [JSON.stringify(nav)]);
	useSync(bar, current => {
		if (toggle && current.expanded !== toggle.expanded) current.expanded = toggle.expanded;
	}, [toggle?.expanded]);
	return h('div', { ref: host, className: 'bui-host' }, notifications ? ReactDOM.createPortal(notifications, slots.notifications) : null, account ? ReactDOM.createPortal(account, slots.account) : null);
}

/**
 * A disclosure button and panel (for example the account menu): `label` is the button content (a
 * string), `name` its accessible name, and `children` the panel content.
 */
export function Disclosure({ label, name = null, align = 'start', onChange = null, children }) {
	const changed = useLatest(onChange);
	const [host, panel] = useInstance(() => new Panel({ label, name, align, onchange: open => changed.current?.(open) }), [label, name, align]);
	return h('div', { ref: host, className: 'bui-host' }, panel ? ReactDOM.createPortal(children, panel.panel) : null);
}

/** A menu button of actions. Items: `{ label, onSelect?, href?, disabled?, reason?, tone? }`. */
export function ActionMenu({ label = null, name = null, items, align = 'end', glyph = 'more' }) {
	const latest = useLatest(items);
	const [host, menu] = useInstance(() => new Menu({ label, name, align, glyph, items: [] }), [label, name, align, glyph]);
	useSync(menu, current => {
		current.items = latest.current.map((item, index) => item && { ...item, run: event => latest.current[index]?.onSelect?.(event) });
	}, [JSON.stringify(items.map(item => item && { ...item, onSelect: undefined }))]);
	return h('span', { ref: host, className: 'bui-host' });
}

/** Essential help behind a toggle button. `text` is a string or strings; `children` may add React content. */
export function Help({ topic, text = [], labels, children }) {
	const [host, help] = useInstance(() => new Explanation({ topic, text, labels }), [topic, JSON.stringify(text), labels]);
	return h('span', { ref: host, className: 'bui-host' }, help && children ? ReactDOM.createPortal(children, help.panel) : null);
}

/** A supplementary tooltip on its single child element. Never the only copy of essential information. */
export function Tooltip({ text, children }) {
	const holder = useRef(null);
	const [hint, setHint] = useState(null);
	useLayoutEffect(() => {
		const trigger = holder.current?.firstElementChild;
		if (!trigger) return undefined;
		const made = new Hint(trigger, { text });
		setHint(made);
		return () => made.destroy();
	}, []);
	useSync(hint, current => (current.text = text), [text]);
	return h('span', { ref: holder, className: 'bui-tooltip-anchor' }, children);
}
