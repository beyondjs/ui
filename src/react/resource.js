import React from 'react';
import { Facts as Rows } from '../dom/facts/facts.js';
import { Meter as Gauge } from '../dom/facts/meter.js';
import { Clock } from '../dom/time/clock.js';
import { h, useInstance, useSync } from './hooks.js';

const { useId } = React;

/**
 * A resource's panel parts of 0.11.0 for React: `Facts`, rendered by React with the markup and classes
 * of the DOM class (so a row's action is React content that keeps its state), and `Meter`, driven by
 * the DOM class, which owns its levels, words and clock.
 */

/**
 * Label and value rows: `head` (`{ title?, value?, state?: [label, tone], level? }`), `rows`
 * (`{ key?, label, value, mono?, action?, stale? }`, the action React content) and `label` (the rows'
 * name without a title). See the DOM `Facts`.
 */
export function Facts({ head = null, rows = [], label = null, labels = {} }) {
	const id = `bui-facts-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const { title = null, value = null, state = null, level = 3 } = head ?? {};
	const word = Rows.state(state);
	const heading = title ? h(`h${[2, 3, 4].includes(level) ? level : 3}`, { id: `${id}-title`, className: 'bui-facts-title' }, title) : null;
	const parts = [heading, value !== null && value !== undefined && value !== '' ? h('span', { key: 'value', className: 'bui-facts-summary' }, value) : null, word ? h('span', { key: 'state', className: `bui-status bui-status-${word.tone} bui-facts-state` }, h('span', { className: 'bui-status-dot', 'aria-hidden': 'true' }), word.label) : null].filter(Boolean);
	const shown = (rows ?? []).filter(Boolean);
	const stale = row => (row.stale ? (typeof row.stale === 'string' ? row.stale : (labels.stale ?? Rows.labels.en.stale)) : null);
	return h(
		'div',
		{ className: 'bui-facts', role: 'group', 'aria-labelledby': heading ? `${id}-title` : undefined, 'aria-label': heading ? undefined : (label ?? undefined) },
		h('div', { className: 'bui-facts-head', hidden: !parts.length }, ...parts),
		h(
			'dl',
			{ className: 'bui-facts-list', hidden: !shown.length },
			shown.map((row, index) =>
				h(
					'div',
					{ key: row.key ?? (typeof row.label === 'string' ? row.label : index), className: 'bui-facts-row', 'data-stale': stale(row) ? '' : undefined, 'data-long': Rows.long(row) ? '' : undefined },
					h('dt', { className: 'bui-facts-label' }, row.label),
					h('dd', { className: 'bui-facts-data' }, h('span', { className: 'bui-facts-value', 'data-mono': row.mono ? '' : undefined }, row.value ?? ''), stale(row) ? h('span', { className: 'bui-facts-note' }, stale(row)) : null, row.action ? h('span', { className: 'bui-facts-action' }, row.action) : null)
				)
			)
		)
	);
}

/** A use against a limit, driven by the DOM `Meter`: values are applied when they change; `clock`, `locale` and `labels` create a new one. */
export function Meter({ label, value = null, reset = null, stale = null, thresholds = null, clock = Clock.system, locale = undefined, labels }) {
	const [host, meter] = useInstance(() => new Gauge({ label, value, reset, stale, thresholds, clock, locale, labels }), [clock, locale, labels]);
	useSync(meter, current => current.update({ label, value, reset, stale, thresholds }), [label, value, String(reset), String(stale), JSON.stringify(thresholds)]);
	return h('div', { ref: host, className: 'bui-host' });
}

// The copy in English and Spanish, as on the DOM classes.
Facts.labels = Rows.labels;
Meter.labels = Gauge.labels;
