import React from 'react';
import { CommandPalette as Palette } from '../dom/palette/palette.js';
import { ChoiceCards as Cards } from '../dom/choice/cards.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { forwardRef, useImperativeHandle } = React;

/**
 * The React forms of 0.16.0's `CommandPalette` and `ChoiceCards`, driven by their DOM classes. A
 * palette's sources and its `onNavigate` are read from the latest props when asked; its ref opens and
 * closes it (`open(query?)`, `close()`, `toggle()`). The cards' options and value are applied when they
 * change and `onChange` is read from the latest props.
 */
export const CommandPalette = forwardRef(function CommandPalette({ sources = [], recent = false, shortcut = false, onNavigate = null, delay, bound, labels }, ref) {
	const latest = useLatest({ sources, onNavigate });
	const relayed = () => (latest.current.sources ?? []).map((source, index) => ({ key: source.key, label: source.label, empty: Boolean(source.empty), search: (query, context) => latest.current.sources?.[index]?.search?.(query, context) ?? [] }));
	const [host, palette] = useInstance(() => new Palette({ sources: relayed(), recent, shortcut, delay, bound, labels, onnavigate: onNavigate ? (item, event) => latest.current.onNavigate?.(item, event) : null }), [JSON.stringify(recent), Boolean(shortcut), delay, bound, labels, Boolean(onNavigate)]);
	useSync(palette, current => (current.sources = relayed()), [sources.map(source => `${source.key}:${source.label}:${Boolean(source.empty)}`).join('|')]);
	useImperativeHandle(ref, () => ({ open: query => palette?.open(query), close: () => palette?.close(), toggle: () => palette?.toggle(), get opened() { return palette?.opened ?? false; }, get keys() { return palette?.keys ?? null; } }), [palette]);
	return h('div', { ref: host, className: 'bui-host' });
});

/** Options compared as cards, applied at once. */
export function ChoiceCards({ label, options = [], value = null, name = null, description = null, disabled = false, onChange = null }) {
	const latest = useLatest(onChange);
	const [host, cards] = useInstance(() => new Cards({ label, name, description, options, value, onchange: chosen => latest.current?.(chosen) }), [label, name, description]);
	useSync(cards, current => (current.options = options), [JSON.stringify(options)]);
	useSync(cards, current => current.value !== value && (current.value = value), [value]);
	useSync(cards, current => (current.disabled = disabled), [disabled]);
	return h('div', { ref: host, className: 'bui-host' });
}

CommandPalette.labels = Palette.labels;
