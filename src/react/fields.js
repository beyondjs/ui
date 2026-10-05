import React from 'react';
import { h } from './hooks.js';
import { Mark } from './simple.js';
import { Select as Choice } from '../dom/select.js';
import { Field as Labelled } from '../dom/field.js';
import { single } from '../dom/core/statement.js';
import { Suggestion } from '../dom/core/suggestion.js';

const { cloneElement, isValidElement, useCallback, useId, useLayoutEffect, useRef, useState } = React;

/**
 * Form controls React renders itself, with the markup and classes of the DOM `Field`, `Choices` and
 * `Select`, so a React form stays a React form (controlled or uncontrolled) and looks and reads the
 * same as a DOM one.
 */

/**
 * A labelled field around one control child (an `input`, `textarea`, `Select` or other element).
 * The child receives the id, `aria-describedby` for the hint and error, and `aria-invalid`. With
 * `suggested` (0.7.0, from `useSuggestion`) the label carries the "Suggested" mark.
 */
export function Field({ label, hint = null, error = null, optional = false, suggested = false, labels = {}, children }) {
	const id = useId();
	const described = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
	const control = isValidElement(children)
		? cloneElement(children, {
				id: children.props.id ?? id,
				'aria-describedby': described,
				'aria-invalid': error ? 'true' : undefined,
				className: children.props.className ?? (children.type === 'input' || children.type === 'textarea' ? `bui-input${children.type === 'textarea' ? ' bui-textarea' : ''}` : undefined)
			})
		: children;
	const target = isValidElement(children) ? (children.props.id ?? id) : undefined;
	return h(
		'div',
		{ className: `bui-field${error ? ' bui-field-invalid' : ''}` },
		h('label', { htmlFor: target, className: 'bui-field-label' }, label, optional ? h('span', { className: 'bui-field-optional' }, ` ${labels.optional ?? '(optional)'}`) : null, suggested ? [' ', h('span', { key: 'suggested', className: 'bui-field-suggested' }, labels.suggested ?? 'Suggested')] : null),
		hint ? h('p', { id: `${id}-hint`, className: 'bui-field-hint' }, hint) : null,
		control,
		h('p', { id: `${id}-error`, className: 'bui-field-error', hidden: !error }, error ? [h(Mark, { key: 'icon', name: 'alert' }), h('span', { key: 'text' }, error)] : null)
	);
}

/**
 * A suggested value for a controlled input (D56, CNT-95), with the DOM `Field`'s rule: it follows
 * `suggestion` until the person edits it, and an input left empty takes it back. Returns `{ value,
 * onChange, onBlur, suggested, follow }`: spread `value`, `onChange` and `onBlur` on the input and pass
 * `suggested` to `Field`; `onChange(event)` may also take the new text itself.
 */
export function useSuggestion(suggestion) {
	const [rule] = useState(() => new Suggestion(suggestion));
	const [value, setValue] = useState(() => suggestion ?? '');
	const [, setTick] = useState(0);
	useLayoutEffect(() => {
		const shown = rule.offer(suggestion);
		if (shown !== null) setValue(shown);
		setTick(tick => tick + 1);
	}, [rule, suggestion]);
	const onChange = useCallback(event => {
		const text = typeof event === 'string' ? event : event.target.value;
		rule.typed(text);
		setValue(text);
	}, [rule]);
	const onBlur = useCallback(event => {
		const back = rule.left(event?.target?.value ?? '');
		if (back !== null) setValue(back);
		setTick(tick => tick + 1);
	}, [rule]);
	const follow = useCallback(() => setValue(rule.follow()), [rule]);
	return { value, onChange, onBlur, suggested: rule.shown, follow };
}

/** One option that can be chosen, stated as text with its state, its hint and its value, as the DOM statement draws it. */
function Statement({ id, name, option }) {
	const hint = useId();
	const said = option.hint ?? option.detail ?? option.description ?? null;
	const described = said ? `bui-statement-hint-${hint.replace(/[^a-zA-Z0-9_-]/g, '')}` : undefined;
	return h(
		'span',
		{ className: 'bui-statement', 'data-value': option.value },
		h('output', { id, className: 'bui-statement-text', 'aria-describedby': described }, option.label),
		option.status?.[0] ? h(State, { status: option.status }) : null,
		said ? h('span', { id: described, className: 'bui-statement-hint' }, said) : null,
		name ? h('input', { type: 'hidden', name, value: option.value }) : null
	);
}

/** A state with its dot, as the DOM `status` builder draws it. */
function State({ status }) {
	return h('span', { className: `bui-status bui-status-${status[1] ?? 'neutral'}` }, h('span', { className: 'bui-status-dot', 'aria-hidden': 'true' }), status[0]);
}

/**
 * A native select for a short finite list. Options: `{ value, label, disabled? }` or `{ group, options }`.
 * Its chosen text shows whole in a tooltip while the select cuts it (D44), as the DOM `Select`. One
 * option that can be chosen is stated as text and submitted (0.7.0, D56) unless `statement` is false.
 */
export function Select({ options, statement = true, ...rest }) {
	const one = statement ? single(options) : null;
	if (one) return h(Statement, { id: rest.id, name: rest.name, option: one });
	return h(Native, { options, ...rest });
}

function Native({ options, className, ...rest }) {
	const control = useRef(null);
	const given = rest.ref ?? null;
	const ref = useCallback(node => {
		control.current = node;
		if (typeof given === 'function') given(node);
		else if (given) given.current = node;
	}, [given]);
	useLayoutEffect(() => {
		if (!control.current) return undefined;
		const tip = Choice.tip(control.current);
		return () => tip.destroy();
	}, []);
	const option = item =>
		item.options
			? h('optgroup', { key: `group-${item.group}`, label: item.group }, item.options.map(option))
			: h('option', { key: item.value, value: item.value, disabled: item.disabled }, item.label);
	return h('span', { className: 'bui-select' }, h('select', { ...rest, ref, className: `bui-select-control${className ? ` ${className}` : ''}` }, options.map(option)), h(Mark, { name: 'chevron' }));
}

/**
 * Checkboxes or radio buttons in a fieldset. `value` is an array for checkboxes and a string for
 * radios; `onChange` receives the next value. Disabled options show their `reason`. A radio group
 * with one option that can be chosen is stated as text (0.7.0, D56) unless `statement` is false.
 */
export function Choices({ legend, type = 'checkbox', name, options, value, onChange, hint = null, error = null, statement = true }) {
	const id = useId();
	const one = statement && type === 'radio' ? single(options) : null;
	if (one) {
		return h(
			'div',
			{ className: `bui-field bui-choices-stated${error ? ' bui-field-invalid' : ''}` },
			h('label', { className: 'bui-field-label', htmlFor: `${id}-stated` }, legend),
			hint ? h('p', { id: `${id}-hint`, className: 'bui-field-hint' }, hint) : null,
			h(Statement, { id: `${id}-stated`, name, option: one }),
			h('p', { id: `${id}-error`, className: 'bui-field-error', hidden: !error }, error ? [h(Mark, { key: 'icon', name: 'alert' }), h('span', { key: 'text' }, error)] : null)
		);
	}
	const chosen = new Set([].concat(value ?? []));
	const described = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
	const change = (option, checked) => {
		if (type === 'radio') onChange?.(option.value);
		else onChange?.(options.map(item => item.value).filter(item => (item === option.value ? checked : chosen.has(item))));
	};
	return h(
		'fieldset',
		{ className: `bui-choices bui-choices-${type}${error ? ' bui-field-invalid' : ''}`, 'aria-describedby': described },
		h('legend', { className: 'bui-field-label' }, legend),
		hint ? h('p', { id: `${id}-hint`, className: 'bui-field-hint' }, hint) : null,
		h(
			'div',
			{ className: 'bui-choices-list' },
			options.map((option, index) => {
				const input = `${id}-${index}`;
				const note = option.hint || option.reason ? `${input}-note` : undefined;
				return h(
					'div',
					{ key: option.value, className: `bui-choice${option.disabled ? ' bui-choice-disabled' : ''}` },
					h('input', { id: input, type, name: name ?? id, value: option.value, checked: chosen.has(option.value), disabled: option.disabled, 'aria-describedby': note, onChange: event => change(option, event.target.checked) }),
					h('label', { htmlFor: input }, option.label, option.status?.[0] ? [' ', h(State, { key: 'state', status: option.status })] : null),
					note ? h('p', { id: note, className: 'bui-choice-note' }, option.reason ?? option.hint) : null
				);
			})
		),
		h('p', { id: `${id}-error`, className: 'bui-field-error', hidden: !error }, error ? [h(Mark, { key: 'icon', name: 'alert' }), h('span', { key: 'text' }, error)] : null)
	);
}

// The copy in English and Spanish, as on the DOM class.
Field.labels = Labelled.labels;
