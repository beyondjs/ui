import React from 'react';
import { CollectionTools as Tools } from '../dom/collection/tools.js';
import { h, living, useLatest } from './hooks.js';

const { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } = React;

/** The tools' state as they report it: a query and the filters' values */
function clean(state) {
	return { query: String(state?.query ?? ''), filters: { ...(state?.filters ?? {}) } };
}

/**
 * One set of a collection's search and filters for more than one view (0.44.0, the list rule L8), such as a
 * graph and a table of the same records: the DOM `Collection.Tools` placed in the element `ref` is given, with
 * the filter-state contract of `tools: 'external'`. `onChange` reports `{ query, filters }` on each change by the
 * person (the query after its debounce, filters and clearing at once); `state`, usually from the address, is
 * restored silently whenever it differs, so an echo of the person's own change keeps the focus. The returned
 * `state` is the tools' current one, for the views to filter by when the caller keeps none of its own; `tools`
 * is the DOM instance (null until placed) for `focus()`. A change of `label`, `search`, the filters' definitions,
 * `labels`, `compact` or `delay` makes a new toolbar that keeps the state.
 *
 * @param {object} options `label`, `search`, `filters` (finite or `kind: 'period'`), `state`, `onChange`,
 * `labels`, `compact` (true by default; false keeps the search open) and `delay`, as `Collection.Tools`
 * @returns {{ ref: (element: HTMLElement|null) => void, state: { query: string, filters: Record<string, string> }, tools: Tools|null }}
 */
export function useCollectionTools({ label, search = true, filters = [], state = null, onChange = null, labels, compact = true, delay = 200 } = {}) {
	const [target, setTarget] = useState(null);
	const [tools, setTools] = useState(null);
	const [current, setCurrent] = useState(() => clean(state));
	const latest = useLatest({ onChange });
	// The last state reported or restored, carried into a new toolbar and compared with the next echo
	const kept = useRef(current);
	useLayoutEffect(() => {
		if (!target) return;
		const made = new Tools({ label, search, filters, labels, compact, delay, state: kept.current, onchange: next => {
			kept.current = clean(next);
			setCurrent(kept.current);
			latest.current.onChange?.(kept.current);
		} });
		target.append(made.element);
		setTools(made);
		return () => {
			made.destroy();
			setTools(held => (held === made ? null : held));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target, label, search, JSON.stringify(filters), labels, compact, delay]);
	useEffect(() => {
		if (!state) return;
		const next = clean(state);
		if (JSON.stringify(next) === JSON.stringify(kept.current)) return;
		kept.current = next;
		setCurrent(next);
		if (living(tools)) tools.state = next;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tools, JSON.stringify(state)]);
	return { ref: setTarget, state: current, tools: living(tools) };
}

/**
 * The same tools as a component, where the page draws it (its header's action region): the props of
 * `useCollectionTools`, and a ref whose `focus()` opens the search or focuses the first filter.
 */
export const CollectionTools = forwardRef(function CollectionTools(props, handle) {
	const { ref, tools } = useCollectionTools(props);
	useImperativeHandle(handle, () => ({ focus: () => tools?.focus() }), [tools]);
	return h('div', { ref, className: 'bui-host' });
});

CollectionTools.labels = Tools.labels;
