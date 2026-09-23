import React from 'react';
import ReactDOM from 'react-dom';
import { Collection as List } from '../dom/collection/collection.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { useRef, useState } = React;

/**
 * The compact collection, driven by the DOM `Collection` class. A column may give `render(row)`
 * returning React content; it is rendered into the cell through a portal. `state` is applied when it
 * changes (for example from the address on back and forward) and `onState` reports the person's
 * changes. `link(row)` makes rows open their detail; `onOpen(row, event)` takes over the navigation.
 */
export function Collection({ label, columns, source, link = null, onOpen = null, search = true, filters = [], state = null, onState = null, limit = 20, empty = null, explain = null, labels }) {
	const cells = useRef([]);
	const [portals, setPortals] = useState([]);
	const latest = useLatest({ source, onOpen, onState, explain, columns, link });
	const [host, list] = useInstance(
		() =>
			new List({
				label,
				search,
				filters,
				limit,
				empty,
				labels,
				state: state ?? {},
				source: request => latest.current.source(request),
				link: link ? row => latest.current.link(row) : null,
				onopen: onOpen ? (row, event) => latest.current.onOpen?.(row, event) : null,
				onstate: next => latest.current.onState?.(next),
				explain: error => latest.current.explain?.(error),
				columns: columns.map((column, index) => ({ ...column, render: undefined, value: row => cell(row, index) })),
				onrender: () => setPortals(cells.current.splice(0))
			}),
		[label, search, JSON.stringify(filters), limit, labels, Boolean(link), Boolean(onOpen), columns.length]
	);
	// Each drawn cell asks the latest column definition for its content.
	function cell(row, index) {
		const column = latest.current.columns[index];
		if (!column.render) return column.value ? column.value(row) : row[column.key];
		const holder = document.createElement('span');
		holder.className = 'bui-cell';
		cells.current.push({ holder, content: column.render(row) });
		return holder;
	}
	useSync(list, current => {
		if (state && JSON.stringify(state) !== JSON.stringify(current.state)) current.state = state;
	}, [JSON.stringify(state)]);
	return h('div', { ref: host, className: 'bui-host' }, portals.map((portal, index) => ReactDOM.createPortal(portal.content, portal.holder, `cell-${index}`)));
}
