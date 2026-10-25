import React from 'react';
import ReactDOM from 'react-dom';
import { Collection as List } from '../dom/collection/collection.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';
import { useTools } from './collection-tools.js';
import { HeldNotice } from './held.js';

const { useEffect, useRef, useState } = React;

/**
 * The compact collection, driven by the DOM `Collection` class. A column may give `render(row)`
 * returning React content; it is rendered into the cell through a portal. `state` is applied when it
 * changes (for example from the address on back and forward) and `onState` reports the person's
 * changes. `link(row)` makes rows open their detail; `onOpen(row, event)` takes over the navigation.
 * Since 0.24.0 (D163) `recovery` (a notice from `useRecovery`), `outage(error)` and `details(error)` let a
 * read that did not answer join the page's notice and say "Not available right now" in its place.
 */
export function Collection({ label, columns, source, link = null, onOpen = null, search = true, filters = [], tools = 'compact', toolsTarget = null, state = null, onState = null, limit = 20, empty = null, explain = null, labels, presentation = 'table', row = null, group = null, end = true, recovery = null, outage = null, details = null }) {
	const cells = useRef([]);
	const [portals, setPortals] = useState([]);
	const latest = useLatest({ source, onOpen, onState, explain, columns, link, row, group, end, recovery, outage, details });
	const [waiting] = useState(() => new HeldNotice(latest));
	useEffect(() => waiting.flush(), [waiting, recovery]);
	const [host, list] = useInstance(
		() =>
			new List({
				label,
				presentation,
				// The list's own row options and groups (0.21.1) read the latest props
				row: row ? item => latest.current.row?.(item) ?? {} : null,
				group: group ? item => latest.current.group(item) : null,
				// A function reads the latest props; words and switches are read when the list is made
				end: typeof end === 'function' ? list => latest.current.end(list) : end,
				search,
				filters,
				tools,
				limit,
				empty,
				labels,
				state: state ?? {},
				source: request => latest.current.source(request),
				link: link ? row => latest.current.link(row) : null,
				onopen: onOpen ? (row, event) => latest.current.onOpen?.(row, event) : null,
				onstate: next => latest.current.onState?.(next),
				explain: error => latest.current.explain?.(error),
				// The page's notice may be made after the list (`useRecovery`): what fails first waits for it (0.33.0)
				recovery: waiting,
				outage: error => Boolean(latest.current.outage?.(error)),
				details: error => latest.current.details?.(error) ?? null,
				columns: columns.map((column, index) => ({ ...column, render: undefined, value: row => cell(row, index) })),
				onrender: () => setPortals(cells.current.splice(0))
			}),
		[label, presentation, search, JSON.stringify(filters), tools, limit, labels, Boolean(link), Boolean(onOpen), columns.length, Boolean(row), Boolean(group), typeof end === 'string' ? end : typeof end === 'function' ? 'function' : Boolean(end)]
	);
	useTools(list, toolsTarget, tools);
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

// The copy in English and Spanish, as on the DOM class.
Collection.labels = List.labels;
