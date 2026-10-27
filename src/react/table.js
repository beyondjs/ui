import React from 'react';
import ReactDOM from 'react-dom';
import { DataTable as Table } from '../dom/table/table.js';
import { CellContent } from '../dom/table/cell.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';
import { useTools } from './collection-tools.js';

const { useEffect, useLayoutEffect, useRef, useState } = React;
const none = Object.freeze([]);

/**
 * A table of rows the product holds (0.15.0), driven by the DOM `DataTable`. A column may give
 * `render(row)` returning React content, rendered into its cell through a portal. `rows`, `state` and
 * `status` are applied when they change; `onChange` reports the person's changes (write them to the
 * address); `onOpen` and `onRetry` are read from the latest props. A cell whose React content renders
 * nothing (no text, no element) is empty, as the DOM table reads a value: a narrow line leaves out its
 * label and its separator (0.35.0). `menu(row)` (0.44.0) gives each row a menu of the product's actions, items as
 * React's `ActionMenu` takes them (`onSelect`), read from the latest props each time a menu opens. A narrow
 * table's sort line reports through `onChange` as its header does.
 */
export function DataTable({ label, columns, rows = none, rowKey = null, search = true, filters = [], tools = 'compact', toolsTarget = null, group = null, state = null, onChange = null, size = 50, link = null, onOpen = null, empty = null, status = 'ready', onRetry = null, framed = false, menu = null, labels }) {
	const cells = useRef([]);
	const applied = useRef(null);
	const [portals, setPortals] = useState([]);
	const latest = useLatest({ columns, onChange, onOpen, onRetry, link, group, rowKey, filters, menu });
	const [host, table] = useInstance(
		() =>
			new Table({
				label,
				search,
				filters: filters.map(filter => ({ ...filter, match: (row, value) => latest.current.filters.find(item => item.name === filter.name)?.match(row, value) ?? false })),
				tools,
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
				menu: menu ? row => (latest.current.menu?.(row) ?? []).map(item => item && { ...item, run: event => item.onSelect?.(event) }) : null,
				columns: columns.map((column, index) => ({ ...column, value: column.value ? row => latest.current.columns[index].value(row) : undefined, render: column.render ? row => cell(row, index) : undefined, sort: typeof column.sort === 'function' ? (a, b) => latest.current.columns[index].sort(a, b) : column.sort })),
				onrender: () => setPortals(cells.current.splice(0))
			}),
		[label, String(search), JSON.stringify(filters), tools, size, labels, Boolean(link), Boolean(onOpen), Boolean(onRetry), Boolean(menu), Boolean(group), columns.map(column => column.key).join('|')]
	);
	useTools(table, toolsTarget, tools);
	useLayoutEffect(() => {
		if (table && !table.destroyed) table.framed = framed;
	}, [table, Boolean(framed)]);
	// What each drawn cell rendered decides whether it is empty, by the DOM table's rule (`CellContent`), read
	// again for the cells whose content changed
	useLayoutEffect(() => {
		const holders = portals.map(portal => portal.holder);
		const mark = holder => {
			const cell = holder.parentElement;
			if (cell?.localName === 'td') cell.toggleAttribute('data-empty', CellContent.held(holder));
		};
		holders.forEach(mark);
		const view = holders[0]?.ownerDocument?.defaultView;
		if (!view?.MutationObserver) return undefined;
		const observer = new view.MutationObserver(records => {
			const changed = new Set(records.map(record => (record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest('.bui-cell')).filter(Boolean));
			changed.forEach(mark);
		});
		for (const holder of holders) observer.observe(holder, { childList: true, subtree: true, characterData: true });
		return () => observer.disconnect();
	}, [portals]);
	// Each drawn cell is a holder; its React content is rendered with every render of the table (0.16.2),
	// so a cell whose content changes while its row does not is drawn again, keyed by its row and column.
	function cell(row, index) {
		const holder = document.createElement('span');
		holder.className = 'bui-cell';
		const key = latest.current.rowKey?.(row) ?? row?.id ?? cells.current.length;
		cells.current.push({ holder, row, index, key: `${key}:${latest.current.columns[index]?.key ?? index}` });
		return holder;
	}
	// A predicate may change while rows and address state stay the same. Compare against the last
	// application, not the filters array: callers may build that array inline on every render.
	useEffect(() => {
		if (!table || table.destroyed) return;
		const matches = filters.map(filter => filter.match);
		const previous = applied.current;
		if (previous?.table === table && previous.rows === rows && previous.matches.length === matches.length && matches.every((match, index) => match === previous.matches[index])) return;
		applied.current = { table, rows, matches };
		table.rows = rows;
		if (status === 'loading' || status?.failed !== undefined) table.status = status;
	});
	useSync(table, current => {
		if (state && JSON.stringify(state) !== JSON.stringify(current.state)) current.state = state;
	}, [JSON.stringify(state)]);
	useSync(table, current => {
		if (status === 'loading' || status?.failed !== undefined) current.status = status;
		else if (current.status !== 'ready') current.rows = rows;
	}, [JSON.stringify(status)]);
	return h('div', { ref: host, className: 'bui-host' }, portals.map(portal => ReactDOM.createPortal(columns[portal.index]?.render?.(portal.row) ?? null, portal.holder, portal.key)));
}

// The copy in English and Spanish, as on the DOM class.
DataTable.labels = Table.labels;
