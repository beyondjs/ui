import React from 'react';
import ReactDOM from 'react-dom';
import { Picker as Search } from '../dom/picker/picker.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { forwardRef, useImperativeHandle, useState } = React;

/**
 * The searchable entity picker and the family's resource picker, driven by the DOM `Picker` class.
 * `source`, `onChange`, `recognize`, `onRecognize`, `explain` and `accounts.connect.onSelect` may change
 * freely; `label`, `multiple`, `filters`, `name`, `hint`, `limit`, `delay`, `bound`, `all`, `labels`
 * and whether `accounts` are given shape the component and create a new one when they change
 * (memoize them). `selected` is the initial choice. `accounts` (`{ items, value?, connect? }`) is applied
 * when its content changes; `gate` (`Unavailable`'s props, with `action` and `secondary` as React
 * content) replaces the list while given; `footer` is the "Can't find it?" React content. The ref
 * exposes `value`, `selected`, `account`, `recognized`, `mark(id, finding)`, `remove(id)`, `refresh()`
 * and `focus()`.
 */
export const Picker = forwardRef(function Picker({ label, source, onChange, multiple = true, selected = [], filters = [], name = null, hint = null, limit = 20, delay = 250, bound = 20000, all = false, accounts = null, gate = null, footer = null, recognize = null, onRecognize = null, explain = null, labels }, ref) {
	const latest = useLatest({ source, onChange, recognize, onRecognize, explain, accounts });
	const [slots] = useState(() => ({ footer: document.createElement('span'), action: document.createElement('span'), secondary: document.createElement('span') }));
	const [host, picker] = useInstance(
		() =>
			new Search({
				label, multiple, selected, filters, name, hint, limit, delay, bound, all, labels,
				gate: gate ? { title: '', reason: '' } : null,
				accounts: accounts ? held(accounts, latest) : null,
				source: request => latest.current.source(request),
				recognize: recognize ? text => latest.current.recognize?.(text) ?? null : null,
				onrecognize: found => latest.current.onRecognize?.(found),
				explain: explain ? error => latest.current.explain?.(error) ?? null : null,
				onchange: items => latest.current.onChange?.(items)
			}),
		[label, multiple, name, hint, limit, delay, bound, all, JSON.stringify(filters), labels, Boolean(accounts), Boolean(recognize), Boolean(explain)]
	);
	useSync(picker, current => {
		if (accounts) current.accounts = held(accounts, latest);
	}, [JSON.stringify(accounts && { ...accounts, connect: accounts.connect?.label ?? null })]);
	useSync(picker, current => (current.footer = footer ? slots.footer : null), [Boolean(footer)]);
	useSync(picker, current => {
		current.gate = gate ? { title: gate.title, reason: gate.reason, owner: gate.owner ?? null, kind: gate.kind ?? 'association', code: gate.code ?? null, level: gate.level ?? 3, action: gate.action ? slots.action : null, secondary: gate.secondary ? slots.secondary : null } : null;
	}, [gate?.title, gate?.reason, gate?.owner, gate?.kind, gate?.code, Boolean(gate?.action), Boolean(gate?.secondary), Boolean(gate)]);
	useImperativeHandle(
		ref,
		() => ({
			get value() {
				return picker?.value ?? [];
			},
			get selected() {
				return picker?.selected ?? [];
			},
			get account() {
				return picker?.account ?? null;
			},
			get recognized() {
				return picker?.recognized ?? null;
			},
			mark: (id, finding) => picker?.mark(id, finding),
			remove: id => picker?.remove(id),
			refresh: () => picker?.refresh(),
			focus: () => picker?.focus()
		}),
		[picker]
	);
	const portal = (content, slot) => (content ? ReactDOM.createPortal(content, slot) : null);
	return h('div', { ref: host, className: 'bui-host' }, portal(footer, slots.footer), portal(gate?.action, slots.action), portal(gate?.secondary, slots.secondary));
});

/** The accounts with "Connect another" read from the latest props when chosen. */
function held(accounts, latest) {
	const { connect = null, ...rest } = accounts;
	return { ...rest, connect: connect?.label ? { label: connect.label, run: () => latest.current.accounts?.connect?.onSelect?.() } : null };
}

Picker.labels = Search.labels;
