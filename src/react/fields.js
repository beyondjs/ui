import React from 'react';
import { h } from './hooks.js';
import { Icon } from './simple.js';

const { cloneElement, isValidElement, useId } = React;

/**
 * Form controls React renders itself, with the markup and classes of the DOM `Field`, `Choices` and
 * `Select`, so a React form stays a React form (controlled or uncontrolled) and looks and reads the
 * same as a DOM one.
 */

/**
 * A labelled field around one control child (an `input`, `textarea`, `Select` or other element).
 * The child receives the id, `aria-describedby` for the hint and error, and `aria-invalid`.
 */
export function Field({ label, hint = null, error = null, optional = false, labels = {}, children }) {
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
		h('label', { htmlFor: target, className: 'bui-field-label' }, label, optional ? h('span', { className: 'bui-field-optional' }, ` ${labels.optional ?? '(optional)'}`) : null),
		hint ? h('p', { id: `${id}-hint`, className: 'bui-field-hint' }, hint) : null,
		control,
		h('p', { id: `${id}-error`, className: 'bui-field-error', hidden: !error }, error ? [h(Icon, { key: 'icon', name: 'alert' }), h('span', { key: 'text' }, error)] : null)
	);
}

/** A native select for a short finite list. Options: `{ value, label, disabled? }` or `{ group, options }`. */
export function Select({ options, className, ...rest }) {
	const option = item =>
		item.options
			? h('optgroup', { key: `group-${item.group}`, label: item.group }, item.options.map(option))
			: h('option', { key: item.value, value: item.value, disabled: item.disabled }, item.label);
	return h('span', { className: 'bui-select' }, h('select', { ...rest, className: `bui-select-control${className ? ` ${className}` : ''}` }, options.map(option)), h(Icon, { name: 'chevron' }));
}

/**
 * Checkboxes or radio buttons in a fieldset. `value` is an array for checkboxes and a string for
 * radios; `onChange` receives the next value. Disabled options show their `reason`.
 */
export function Choices({ legend, type = 'checkbox', name, options, value, onChange, hint = null, error = null }) {
	const id = useId();
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
					h('label', { htmlFor: input }, option.label),
					note ? h('p', { id: note, className: 'bui-choice-note' }, option.reason ?? option.hint) : null
				);
			})
		),
		h('p', { id: `${id}-error`, className: 'bui-field-error', hidden: !error }, error ? [h(Icon, { key: 'icon', name: 'alert' }), h('span', { key: 'text' }, error)] : null)
	);
}
