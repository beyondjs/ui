import React from 'react';
import { Glyph } from '../dom/core/icons.js';
import { loading } from '../dom/feedback.js';
import { Labels } from '../dom/core/labels.js';
import { Language } from '../dom/core/language.js';
import { h } from './hooks.js';
import { TechnicalDetails } from './operations.js';
import { Status as Shape } from '../dom/status/status.js';
import { tones } from '../dom/status/labels.js';
import { OrganizationMark as Square } from '../dom/family/mark.js';
import { Picture } from '../dom/family/picture.js';

const { useCallback, useRef, useState, useEffect } = React;

/**
 * Elements React renders itself, with exactly the markup and classes of the DOM builders:
 * `Icon`, `Button`, `Lockup`, `Status`, `Badge`, `Callout`, `Loading`, `Skeleton` and `OrganizationMark`,
 * plus `useBusy`.
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
 * `waiting` is quiet for a step not yet taken, marked `data-bui-waiting` so a form never frees it (0.35.0).
 */
export function Button({ label, children, variant = 'secondary', glyph = null, href = null, onClick = null, disabled = false, busy = false, waiting = false, place = null, type = 'button', small = false, name, labels = {}, ...rest }) {
	const className = `bui-button bui-button-${variant}${small ? ' bui-button-small' : ''}${rest.className ? ` ${rest.className}` : ''}`;
	const text = label ?? children;
	// A label that already ends in an ellipsis keeps one while busy (0.44.0), as the DOM button's
	const shown = busy && typeof text === 'string' ? (labels.busy ?? '{label}…').replace('{label}', text.replace(/(?:…|\.\.\.)\s*$/u, '')) : text;
	const inner = [busy ? h('span', { key: 'mark', className: 'bui-spinner', 'aria-hidden': 'true' }) : glyph ? h(Mark, { key: 'mark', name: glyph }) : null, h('span', { key: 'text' }, shown)];
	const press = event => {
		if (busy || waiting) {
			event.preventDefault();
			// A step not yet taken (0.32.0, D183): the press only puts the person where they can act; a link does not navigate
			if (!busy) place?.()?.focus();
			return;
		}
		onClick?.(event);
	};
	const quiet = busy || waiting ? 'true' : undefined;
	// Its own wait is marked, so a form's or a Quiet's settling never frees it (0.35.0)
	const own = waiting ? '' : undefined;
	if (href && !disabled) return h('a', { ...rest, className, href, onClick: press, 'aria-label': name, 'aria-disabled': quiet, 'data-busy': busy ? '' : undefined, 'data-bui-waiting': own }, inner);
	return h('button', { ...rest, className, type, disabled, 'aria-label': name, 'aria-disabled': quiet, 'data-busy': busy ? '' : undefined, 'data-bui-waiting': own, onClick: press }, inner);
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
	const words = label ?? new Labels(Shape.labels, labels ?? {}).text(known);
	return h('span', { className: `bui-status${variant === 'badge' ? ' bui-status-badge' : ''} bui-status-${shape}`, 'data-state': known, 'data-tone': shape }, h('span', { className: 'bui-status-dot', 'aria-hidden': 'true' }), h('span', { className: 'bui-status-label' }, words));
}

/**
 * An organization's mark (D195, 0.40.0), as the DOM `OrganizationMark` builds it: the initial of its
 * name, with its logo laid over it once it loads and removed when it fails.
 */
export function OrganizationMark({ name, logo = null }) {
	const [failed, setFailed] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const source = failed ? null : Picture.source(logo);
	useEffect(() => {
		setFailed(false);
		setLoaded(false);
	}, [logo]);
	const picture = source
		? h('img', { className: 'bui-family-picture', alt: '', src: source, referrerPolicy: 'no-referrer', decoding: 'async', onLoad: () => setLoaded(true), onError: () => setFailed(true) })
		: null;
	return h('span', { className: 'bui-organization-mark', 'aria-hidden': 'true', 'data-picture': loaded && source ? '' : undefined }, Square.initial(name), picture);
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

export function Loading({ label = null }) {
	return h('div', { className: 'bui-loading', role: 'status' }, h('span', { className: 'bui-spinner', 'aria-hidden': 'true' }), h('span', null, label ?? Loading.labels[new Language().choose(['en', 'es'])]));
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

/** A region's wait (0.23.0, LOAD-01), as the DOM `waiting`: an announced "Loading…" line and row-shaped placeholders on the region's raised frame; `language` the default's, else the language in effect (0.44.0). */
export function Waiting({ label = null, language = undefined, rows = 1, kind = 'list', frame = true }) {
	return h('div', { className: 'bui-waiting', 'data-frame': frame ? '' : undefined }, h('p', { className: 'bui-waiting-label', role: 'status' }, label ?? Loading.labels[new Language(language).choose(['en', 'es'])]), h(Skeleton, { rows, kind }));
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
