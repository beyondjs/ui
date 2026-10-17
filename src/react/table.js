import React from 'react';
import ReactDOM from 'react-dom';
import { DataTable as Table } from '../dom/table/table.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { useRef, useState } = React;

/**
 * A table of rows the product holds (0.15.0), driven by the DOM `DataTable`. A column may give
 * `render(row)` returning React content, rendered into its cell through a portal. `rows`, `state` and
 * `status` are applied when they change; `onChange` reports the person's changes (write them to the
 * address); `onOpen` and `onRetry` are read from the latest props.
 */
export function DataTable({ label, columns, rows = [], rowKey = null, search = true, group = null, state = null, onChange = null, size = 50, link = null, onOpen = null, empty = null, status = 'ready', onRetry = null, labels }) {
	const cells = useRef([]);
	const [portals, setPortals] = useState([]);
	const latest = useLatest({ columns, onChange, onOpen, onRetry, link, group, rowKey });
	const [host, table] = useInstance(
		() =>
			new Table({
				label,
				search,
				size,
				labels,
				empty,
				rows,
				state: state ?? {},
				key: rowKey ? row => latest.current.rowKey(row) : undefined,
				group: group ? { by: row => latest.current.group.by(row), label: group.label ? (key, members) => latest.current.group.label(key, members) : undefined } : null,
				link: link ? row => latest.current.link(row) : null,
				onopen: onOpen ? (row, event) => latest.current.onOpen?.(row, event) : null,
				onchange: next => latest.current.onChange?.(next),
				onretry: onRetry ? () => latest.current.onRetry?.() : null,
				columns: columns.map((column, index) => ({ ...column, value: column.value ? row => latest.current.columns[index].value(row) : undefined, render: column.render ? row => cell(row, index) : undefined, sort: typeof column.sort === 'function' ? (a, b) => latest.current.columns[index].sort(a, b) : column.sort })),
				onrender: () => setPortals(cells.current.splice(0))
			}),
		[label, String(search), size, labels, Boolean(link), Boolean(onOpen), Boolean(onRetry), Boolean(group), columns.map(column => column.key).join('|')]
	);
	// Each drawn cell asks the latest column definition for its React content.
	function cell(row, index) {
		const holder = document.createElement('span');
		holder.className = 'bui-cell';
		cells.current.push({ holder, content: latest.current.columns[index].render(row) });
		return holder;
	}
	useSync(table, current => (current.rows = rows), [rows]);
	useSync(table, current => {
		if (state && JSON.stringify(state) !== JSON.stringify(current.state)) current.state = state;
	}, [JSON.stringify(state)]);
	useSync(table, current => {
		if (status === 'loading' || status?.failed !== undefined) current.status = status;
		else if (current.status !== 'ready') current.rows = rows;
	}, [JSON.stringify(status)]);
	return h('div', { ref: host, className: 'bui-host' }, portals.map((portal, index) => ReactDOM.createPortal(portal.content, portal.holder, `cell-${index}`)));
}

// The copy in English and Spanish, as on the DOM class.
DataTable.labels = Table.labels;
