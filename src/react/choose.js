import React from 'react';
import ReactDOM from 'react-dom';
import { ChoiceMenu as Menu } from '../dom/choice/menu.js';
import { RefChooser as Refs } from '../dom/refs/chooser.js';
import { ProjectPicker as Projects } from '../dom/project.js';
import { SecretField as Secret } from '../dom/secret.js';
import { CopyMessage as Copy } from '../dom/copy.js';
import { StatusRow as Row } from '../dom/row.js';
import { ProviderWindow as Provider } from '../dom/provider.js';
import { Clock } from '../dom/time/clock.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { forwardRef, useImperativeHandle, useState } = React;

/**
 * "Choose, never type" (D56) for React, driven by the DOM classes so keyboard, states and copy have
 * one implementation. Options and records are props applied when their content changes (option labels
 * are strings); callbacks (`onChange`, `onSelect`, `read`, `onEnd`) are read from the latest props;
 * `labels` (memoize them) and the props named per component create a new instance.
 */

/** Actions whose `onSelect` is read from the latest props when chosen. */
function relay(actions, latest, key) {
	return (actions ?? []).filter(Boolean).map((action, index) => ({ label: action.label, disabled: action.disabled, reason: action.reason, run: () => latest.current[key]?.filter(Boolean)[index]?.onSelect?.() }));
}
const shape = actions => JSON.stringify((actions ?? []).filter(Boolean).map(({ onSelect, ...rest }) => rest));

/** One choice among a few things that have a state (CNT-94). Actions: `{ label, onSelect, disabled?, reason? }`. */
export function ChoiceMenu({ label, options, value = null, placeholder = null, actions = [], disabled = false, align = 'start', placement = 'auto', search = 'auto', statement = true, name = null, onChange = null, labels }) {
	const latest = useLatest({ onChange, actions });
	const [host, menu] = useInstance(() => new Menu({ label, options: [], placeholder, align, placement, search, statement, name, labels, onchange: chosen => latest.current.onChange?.(chosen) }), [label, placeholder, align, placement, String(search), statement, name, labels]);
	useSync(menu, current => {
		current.actions = relay(actions, latest, 'actions');
		current.options = options;
		if (current.value !== value && !current.stated) current.value = value;
		// A stated option is the value: a controlled form hears it once it differs (0.7.4)
		else if (current.stated && current.value !== value) latest.current.onChange?.(current.value);
	}, [JSON.stringify(options), value, shape(actions)]);
	useSync(menu, current => (current.disabled = disabled), [disabled]);
	return h('div', { ref: host, className: 'bui-host' });
}

/** A branch or ref: the default first, search past the threshold, and "Use a commit or another ref…". `unavailable.onRetry` is read from the latest props. */
export function RefChooser({ label = null, refs = [], value = null, loading = false, unavailable = null, escape = true, validate = null, layout = 'field', name = null, onChange = null, labels }) {
	const latest = useLatest({ onChange, validate, unavailable });
	const [host, chooser] = useInstance(() => new Refs({ label, escape, layout, name, labels, loading, validate: text => latest.current.validate?.(text) ?? null, onchange: chosen => latest.current.onChange?.(chosen) }), [label, escape, layout, name, labels]);
	useSync(chooser, current => {
		current.refs = refs;
		if (loading) current.loading = true;
		if (unavailable) current.unavailable = { text: unavailable.text ?? null, retry: () => latest.current.unavailable?.onRetry?.() };
		current.value = value;
	}, [JSON.stringify(refs), loading, unavailable?.text ?? Boolean(unavailable), value]);
	return h('div', { ref: host, className: 'bui-host' });
}

/** The organization's projects with their state in this product, as a form control. */
export function ProjectPicker({ projects = [], product, value = null, label = null, only = null, actions = [], name = null, onChange = null, labels }) {
	const latest = useLatest({ onChange, actions });
	const [host, picker] = useInstance(() => new Projects({ projects: [], product, label, only, name, labels, actions: relay(actions, latest, 'actions'), onchange: chosen => latest.current.onChange?.(chosen) }), [product, label, only, name, labels, shape(actions)]);
	useSync(picker, current => {
		current.projects = projects;
		current.value = value;
	}, [JSON.stringify(projects), value]);
	return h('div', { ref: host, className: 'bui-host' });
}

/** A secret with Connect first and the pasted credential as the folded last resort. The ref exposes `value`. */
export const SecretField = forwardRef(function SecretField({ label, connect = null, credential = 'token', stored = false, hint = null, name = null, labels }, ref) {
	const latest = useLatest(connect);
	const [host, field] = useInstance(() => new Secret({ label, credential, stored, hint, name, labels, connect: connect ? { label: connect.label, href: connect.href ?? null, run: () => latest.current?.onSelect?.() } : null }), [label, credential, hint, name, labels, connect?.label, connect?.href]);
	useSync(field, current => {
		if (current.stored !== stored) current.stored = stored;
	}, [stored]);
	useImperativeHandle(ref, () => ({ get value() { return field?.value ?? null; } }), [field]);
	return h('div', { ref: host, className: 'bui-host' });
});

/** A prewritten message, link or command with one copy action. */
export function CopyMessage({ text, kind = 'message', label = null, labels }) {
	const [host, copy] = useInstance(() => new Copy({ text, kind, label, labels }), [kind, label, labels]);
	useSync(copy, current => (current.text = text), [text]);
	return h('div', { ref: host, className: 'bui-host' });
}

/** One thing with one state, its reason, who can change it and its one `action` (React content). `more`: `{ label, onSelect }`. */
export function StatusRow({ title, kind = null, state, reason = null, owner = null, facts = [], action = null, more = [], level = 3, clock = Clock.system, locale = undefined, labels }) {
	const [slot] = useState(() => document.createElement('span'));
	const latest = useLatest({ more });
	const [host, row] = useInstance(() => new Row({ title, state, level, clock, locale, labels }), [level, clock, locale, labels]);
	useSync(row, current => current.update({ title, kind, state, reason, owner, facts, action: action ? slot : null, more: relay(more, latest, 'more') }), [title, kind, JSON.stringify(state), reason, owner, JSON.stringify(facts), Boolean(action), shape(more)]);
	return h('div', { ref: host, className: 'bui-host' }, action ? ReactDOM.createPortal(action, slot) : null);
}

/** A provider's window followed until the server says how it ended. The ref exposes `open()`, `check()`, `cancel()` and `state`. */
export const ProviderWindow = forwardRef(function ProviderWindow({ provider, href, read, origin = null, onEnd = null, same = 'auto', expected = undefined, bound = undefined, clock = Clock.system, locale = undefined, labels }, ref) {
	const latest = useLatest({ read, onEnd });
	const [host, provided] = useInstance(() => new Provider({ provider, href, origin, same, expected, bound, clock, locale, labels, read: () => latest.current.read(), onend: (outcome, answer) => latest.current.onEnd?.(outcome, answer) }), [provider, href, origin, String(same), JSON.stringify(expected ?? null), bound, clock, locale, labels]);
	useImperativeHandle(ref, () => ({ open: () => provided?.open(), check: () => provided?.check(), cancel: () => provided?.cancel(), get state() { return provided?.state ?? 'idle'; } }), [provided]);
	return h('div', { ref: host, className: 'bui-host' });
});

// The copy in English and Spanish, as on the DOM classes.
ChoiceMenu.labels = Menu.labels;
RefChooser.labels = Refs.labels;
ProjectPicker.labels = Projects.labels;
SecretField.labels = Secret.labels;
CopyMessage.labels = Copy.labels;
StatusRow.labels = Row.labels;
ProviderWindow.labels = Provider.labels;
