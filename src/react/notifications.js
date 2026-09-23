import React from 'react';
import { NotificationEntry as Entry } from '../dom/notifications/entry.js';
import { NotificationInbox as Inbox } from '../dom/notifications/inbox.js';
import { Toaster } from '../dom/toaster.js';
import { h, living, useInstance, useLatest, useSync } from './hooks.js';

const { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useState } = React;

/** An adapter whose methods always call the latest one the product rendered. */
function useAdapter(adapter) {
	const latest = useLatest(adapter);
	return useMemo(
		() => ({
			summary: () => latest.current.summary(),
			list: request => latest.current.list(request),
			read: target => latest.current.read(target),
			unread: ids => latest.current.unread(ids),
			open: id => latest.current.open(id)
		}),
		[latest]
	);
}

/**
 * The header notification entry, driven by the DOM `NotificationEntry` class. A change of `labels`,
 * `locale`, `products`, `href`, `limit` or `interval` creates a new entry (memoize `labels`).
 * "View all" closes the panel, returns focus to the bell and then calls `onView` (or follows `href`).
 * The ref exposes `refresh()` for products that learn of new notifications themselves, `open()` and
 * `close()` for products that close the panel themselves (for example on a route change; focus
 * inside the panel returns to the bell), and the read-only `count`, `more` and `expanded`.
 */
export const NotificationEntry = forwardRef(function NotificationEntry({ adapter, href = null, onOpen = null, onView = null, products = {}, locale, limit = 6, interval = 0, labels }, ref) {
	const stable = useAdapter(adapter);
	const latest = useLatest({ onOpen, onView });
	const [host, entry] = useInstance(
		() =>
			new Entry({
				adapter: stable,
				href,
				products,
				locale,
				limit,
				interval,
				labels,
				onopen: onOpen ? (destination, item) => latest.current.onOpen?.(destination, item) : null,
				onview: onView ? event => latest.current.onView?.(event) : null
			}),
		[stable, href, JSON.stringify(products), locale, limit, interval, labels, Boolean(onOpen), Boolean(onView)]
	);
	useImperativeHandle(
		ref,
		() => ({
			refresh: () => entry?.refresh(),
			open: () => entry?.open(),
			close: () => entry?.close(),
			get count() {
				return entry?.count ?? null;
			},
			get more() {
				return entry?.more ?? false;
			},
			get expanded() {
				return entry?.expanded ?? false;
			}
		}),
		[entry]
	);
	return h('div', { ref: host, className: 'bui-host' });
});

/**
 * The full inbox, driven by the DOM `NotificationInbox` class. `state` (`{ state, product }`) is
 * applied when it changes, for example from the address; `onState` reports the person's changes.
 */
export function NotificationInbox({ adapter, onOpen = null, products = {}, locale, limit = 20, state = null, onState = null, labels }) {
	const stable = useAdapter(adapter);
	const latest = useLatest({ onOpen, onState });
	const [host, inbox] = useInstance(
		() =>
			new Inbox({
				adapter: stable,
				products,
				locale,
				limit,
				labels,
				state: state ?? {},
				onopen: onOpen ? (destination, item) => latest.current.onOpen?.(destination, item) : null,
				onstate: next => latest.current.onState?.(next)
			}),
		[stable, JSON.stringify(products), locale, limit, labels, Boolean(onOpen)]
	);
	useSync(inbox, current => {
		if (state && JSON.stringify(state) !== JSON.stringify(current.state)) current.state = state;
	}, [JSON.stringify(state)]);
	return h('div', { ref: host, className: 'bui-host' });
}

/**
 * One toast region for the page, mounted into `document.body` while the calling component lives.
 * Returns `{ show(message, options), clear() }`.
 */
export function useToaster(labels) {
	const [toaster, setToaster] = useState(null);
	useLayoutEffect(() => {
		const made = new Toaster({ labels });
		made.mount(document.body);
		setToaster(made);
		return () => {
			made.destroy();
			setToaster(current => (current === made ? null : current));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(labels ?? {})]);
	return useMemo(() => ({ show: (message, options) => living(toaster)?.show(message, options), clear: () => living(toaster)?.clear() }), [toaster]);
}
