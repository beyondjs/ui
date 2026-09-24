import React from 'react';
import { Picker as Search } from '../dom/picker/picker.js';
import { h, useInstance, useLatest } from './hooks.js';

const { forwardRef, useImperativeHandle } = React;

/**
 * The searchable entity picker, driven by the DOM `Picker` class. `source` and `onChange` may change
 * freely; `label`, `multiple`, `filters`, `name`, `hint`, `limit`, `all` and `labels` shape the component and
 * create a new one when they change (memoize them). `selected` is the initial choice. The ref exposes
 * `value`, `selected`, `mark(id, finding)`, `remove(id)`, `refresh()` and `focus()`.
 */
export const Picker = forwardRef(function Picker({ label, source, onChange, multiple = true, selected = [], filters = [], name = null, hint = null, limit = 20, delay = 250, all = false, labels }, ref) {
	const latest = useLatest(source);
	const changed = useLatest(onChange);
	const [host, picker] = useInstance(
		() => new Search({ label, multiple, selected, filters, name, hint, limit, delay, all, labels, source: request => latest.current(request), onchange: items => changed.current?.(items) }),
		[label, multiple, name, hint, limit, delay, all, JSON.stringify(filters), labels]
	);
	useImperativeHandle(
		ref,
		() => ({
			get value() {
				return picker?.value ?? [];
			},
			get selected() {
				return picker?.selected ?? [];
			},
			mark: (id, finding) => picker?.mark(id, finding),
			remove: id => picker?.remove(id),
			refresh: () => picker?.refresh(),
			focus: () => picker?.focus()
		}),
		[picker]
	);
	return h('div', { ref: host, className: 'bui-host' });
});
