import React from 'react';
import { paths } from '../dom/core/icons.js';
import { h } from './hooks.js';

const { useCallback, useRef, useState, useEffect } = React;

/**
 * Elements React renders itself, with exactly the markup and classes of the DOM builders:
 * `Icon`, `Button`, `Status`, `Badge`, `Callout`, `Loading` and `Skeleton`, plus `useBusy`.
 */

/** A decorative icon from the package catalog. */
export function Icon({ name }) {
	return h('svg', { viewBox: '0 0 24 24', className: 'bui-icon', 'aria-hidden': 'true', focusable: 'false' }, [].concat(paths[name] ?? []).map((d, index) => h('path', { key: index, d })));
}

/**
 * A button (or a link styled as one with `href`). While `busy` it keeps focus but ignores presses,
 * shows a spinner and says it is working: `labels.busy` (default `{label}…`) replaces a text label.
 */
export function Button({ label, children, variant = 'secondary', glyph = null, href = null, onClick = null, disabled = false, busy = false, type = 'button', small = false, name, labels = {}, ...rest }) {
	const className = `bui-button bui-button-${variant}${small ? ' bui-button-small' : ''}`;
	const text = label ?? children;
	const shown = busy && typeof text === 'string' ? (labels.busy ?? '{label}…').replace('{label}', text) : text;
	const inner = [busy ? h('span', { key: 'mark', className: 'bui-spinner', 'aria-hidden': 'true' }) : glyph ? h(Icon, { key: 'mark', name: glyph }) : null, h('span', { key: 'text' }, shown)];
	if (href && !disabled) return h('a', { ...rest, className, href, onClick, 'aria-label': name }, inner);
	return h(
		'button',
		{
			...rest,
			className,
			type,
			disabled,
			'aria-label': name,
			'aria-disabled': busy ? 'true' : undefined,
			'data-busy': busy ? '' : undefined,
			onClick: event => {
				if (busy) {
					event.preventDefault();
					return;
				}
				onClick?.(event);
			}
		},
		inner
	);
}

/**
 * `[busy, run]`: `run(work)` runs an asynchronous action once; presses while it runs are ignored.
 * Its failure is rethrown to the caller.
 */
export function useBusy() {
	const [busy, setBusy] = useState(false);
	const running = useRef(false);
	const alive = useRef(true);
	useEffect(() => () => void (alive.current = false), []);
	const run = useCallback(async work => {
		if (running.current) return undefined;
		running.current = true;
		setBusy(true);
		try {
			return await work();
		} finally {
			running.current = false;
			if (alive.current) setBusy(false);
		}
	}, []);
	return [busy, run];
}

export function Status({ label, tone = 'neutral' }) {
	return h('span', { className: `bui-status bui-status-${tone}` }, h('span', { className: 'bui-status-dot', 'aria-hidden': 'true' }), label);
}

export function Badge({ label, tone = 'neutral' }) {
	return h('span', { className: `bui-badge bui-badge-${tone}` }, label);
}

const glyphs = { info: 'info', warning: 'alert', danger: 'alert', success: 'check', neutral: 'info' };

export function Callout({ tone = 'info', title, body = null, actions = null, live = false, children }) {
	return h(
		'div',
		{ className: `bui-callout bui-callout-${tone}`, role: live ? (tone === 'danger' ? 'alert' : 'status') : undefined },
		h(Icon, { name: glyphs[tone] ?? 'info' }),
		h('div', { className: 'bui-callout-body' }, h('p', { className: 'bui-callout-title' }, title), body ? h('p', { className: 'bui-callout-text' }, body) : null, children, actions ? h('div', { className: 'bui-callout-actions' }, actions) : null)
	);
}

export function Loading({ label = 'Loading…' }) {
	return h('div', { className: 'bui-loading', role: 'status' }, h('span', { className: 'bui-spinner', 'aria-hidden': 'true' }), h('span', null, label));
}

export function Skeleton({ lines = 3 }) {
	return h('div', { className: 'bui-skeleton', 'aria-hidden': 'true' }, Array.from({ length: lines }, (_, index) => h('span', { key: index, className: 'bui-skeleton-line' })));
}
