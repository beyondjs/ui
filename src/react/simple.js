import React from 'react';
import { Glyph } from '../dom/core/icons.js';
import { loading } from '../dom/feedback.js';
import { h } from './hooks.js';
import { TechnicalDetails } from './operations.js';
import { Status as Shape } from '../dom/status/status.js';
import { tones } from '../dom/status/labels.js';

const { useCallback, useRef, useState, useEffect } = React;

/**
 * Elements React renders itself, with exactly the markup and classes of the DOM builders:
 * `Icon`, `Button`, `Lockup`, `Status`, `Badge`, `Callout`, `Loading` and `Skeleton`, plus `useBusy`.
 */

/**
 * An icon of the catalog, as the DOM `icon` builds it: 16, 20 (default) or 24 px, decorative without
 * `label` and an image of that name with it. An unknown name, another size or an empty label throws.
 */
export function Icon({ name, size = 20, label = null }) {
	return svg(new Glyph(name, { size, label }));
}

/** The package's own glyph, sized by its component's stylesheet, as the DOM components draw it (internal to the adapter). */
export function Mark({ name }) {
	return svg(new Glyph(name));
}

function svg(glyph) {
	const { class: className, ...attributes } = glyph.attributes;
	return h('svg', { ...attributes, className }, glyph.paths.map((d, index) => h('path', { key: index, d })));
}

/**
 * A button (or a link styled as one with `href`). While `busy` it keeps focus but ignores presses,
 * shows a spinner and says it is working: `labels.busy` (default `{label}…`) replaces a text label.
 */
export function Button({ label, children, variant = 'secondary', glyph = null, href = null, onClick = null, disabled = false, busy = false, type = 'button', small = false, name, labels = {}, ...rest }) {
	const className = `bui-button bui-button-${variant}${small ? ' bui-button-small' : ''}${rest.className ? ` ${rest.className}` : ''}`;
	const text = label ?? children;
	const shown = busy && typeof text === 'string' ? (labels.busy ?? '{label}…').replace('{label}', text) : text;
	const inner = [busy ? h('span', { key: 'mark', className: 'bui-spinner', 'aria-hidden': 'true' }) : glyph ? h(Mark, { key: 'mark', name: glyph }) : null, h('span', { key: 'text' }, shown)];
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
	useEffect(() => {
		// StrictMode replays setup after cleanup while preserving this hook's state.
		alive.current = true;
		return () => void (alive.current = false);
	}, []);
	const run = useCallback(async work => {
		if (!alive.current || running.current) return undefined;
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

/** The family lockup: the Beyond wordmark (`src`) with the product name, as the DOM `lockup` builds it. */
export function Lockup({ src, name = null, alt = 'Beyond' }) {
	return h('span', { className: 'bui-lockup' }, h('img', { className: 'bui-lockup-mark', src, alt }), name ? h('span', { className: 'bui-lockup-name' }, name) : null);
}

/**
 * A state in words with its mark, as the DOM `status(label, tone)` builds it; since 0.15.0 a `state` of
 * `Status.states` (`ready`, `busy`, `failed`…) draws its shape, with the family's words when no `label`
 * is given, and `variant: 'badge'` draws a pill, as the DOM `Status` does.
 */
export function Status({ label = null, tone = 'neutral', state = null, variant = 'dot', labels = null }) {
	if (!state) return h('span', { className: `bui-status bui-status-${tone}` }, h('span', { className: 'bui-status-dot', 'aria-hidden': 'true' }), label);
	const known = Object.hasOwn(tones, state) ? state : 'unknown';
	const shape = Shape.tone(known);
	const words = label ?? (labels ?? Shape.labels.en)[known];
	return h('span', { className: `bui-status${variant === 'badge' ? ' bui-status-badge' : ''} bui-status-${shape}`, 'data-state': known, 'data-tone': shape }, h('span', { className: 'bui-status-dot', 'aria-hidden': 'true' }), h('span', { className: 'bui-status-label' }, words));
}

export function Badge({ label, tone = 'neutral' }) {
	return h('span', { className: `bui-badge bui-badge-${tone}` }, label);
}

const glyphs = { info: 'info', warning: 'alert', danger: 'alert', success: 'check', neutral: 'info' };

/** A callout; `details` (0.15.0, D43) adds the closed "Technical details" with the request identifier and the time. */
export function Callout({ tone = 'info', title, body = null, actions = null, live = false, details = null, children }) {
	return h(
		'div',
		{ className: `bui-callout bui-callout-${tone}`, role: live ? (tone === 'danger' ? 'alert' : 'status') : undefined },
		h(Mark, { name: glyphs[tone] ?? 'info' }),
		h('div', { className: 'bui-callout-body' }, h('p', { className: 'bui-callout-title' }, title), body ? h('p', { className: 'bui-callout-text' }, body) : null, children, actions ? h('div', { className: 'bui-callout-actions' }, actions) : null, details ? h(TechnicalDetails, details) : null)
	);
}

export function Loading({ label = Loading.labels.en }) {
	return h('div', { className: 'bui-loading', role: 'status' }, h('span', { className: 'bui-spinner', 'aria-hidden': 'true' }), h('span', null, label));
}

/** Placeholders in the shape of what comes (`kind`: `lines`, `list` or `table`, 0.15.0), as the DOM `skeleton`. */
export function Skeleton({ lines = 3, rows = lines, kind = 'lines' }) {
	const type = ['lines', 'list', 'table'].includes(kind) ? kind : 'lines';
	const line = key => h('span', { key, className: 'bui-skeleton-line' });
	const row = index =>
		type === 'list'
			? h('span', { key: index, className: 'bui-skeleton-row' }, h('span', { className: 'bui-skeleton-mark' }), h('span', { className: 'bui-skeleton-text' }, line(0), line(1)))
			: h('span', { key: index, className: 'bui-skeleton-row' }, line(0), line(1), line(2));
	return h('div', { className: `bui-skeleton${type === 'lines' ? '' : ` bui-skeleton-${type}`}`, 'aria-hidden': 'true' }, Array.from({ length: rows }, (_, index) => (type === 'lines' ? line(index) : row(index))));
}

/** A region's wait (0.23.0, LOAD-01), as the DOM `waiting`: an announced "Loading…" line and row-shaped placeholders on the region's raised frame. */
export function Waiting({ label = null, language = 'en', rows = 1, kind = 'list', frame = true }) {
	return h('div', { className: 'bui-waiting', 'data-frame': frame ? '' : undefined }, h('p', { className: 'bui-waiting-label', role: 'status' }, label ?? Loading.labels[language] ?? Loading.labels.en), h(Skeleton, { rows, kind }));
}

// The default label in English and Spanish, and the named lines (0.7.6), as the DOM `loading` builder's.
Loading.labels = loading.labels;
Loading.names = loading.names;
Loading.text = loading.text;
Loading.step = loading.step;
Loading.steps = loading.steps;
// The words of the states and their tones, as on the DOM `Status` (0.15.0).
Status.labels = Shape.labels;
Status.states = Shape.states;
