import React from 'react';
import ReactDOM from 'react-dom';
import { Dialog as Modal } from '../dom/dialog.js';
import { FocusedForm as Submission } from '../dom/form.js';
import { Question, confirm, prompt, alert } from '../dom/questions.js';
import { consequence as stated } from '../dom/consequence.js';
import { Required } from '../dom/core/required.js';
import { h, living, useLatest } from './hooks.js';

const { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } = React;

/**
 * A modal dialog driven by the DOM `Dialog` class: React renders `children` into its body and
 * `actions` into its footer. `open` opens and closes it; `onClose(value)` reports only the person
 * dismissing it or a `close(value)` from inside. `busy` makes it non-dismissible.
 *
 * The adapter reports the results of the dialog it holds and nothing else: closing it through `open`,
 * replacing it when a shaping prop changes, unmounting it and React's development double mount (which
 * destroys the first instance, and under React 18 may render it once more) never call `onClose`, and a
 * destroyed dialog is never opened.
 */
export function Dialog({ open, title, description = null, busy = false, escape = true, backdrop = false, size = 'medium', labels, onClose, actions = null, children }) {
	const [state, setState] = useState(null);
	const held = useRef(null);
	const round = useRef(null);
	const closing = useLatest(onClose);
	const modal = living(state);
	useLayoutEffect(() => {
		const made = new Modal({ title, description, escape, backdrop, size, labels: { close: labels?.close } });
		held.current = made;
		setState(made);
		return () => {
			if (held.current === made) held.current = null;
			setState(current => (current === made ? null : current));
			made.destroy();
		};
		// Title and busy are updated in place; these options shape the element itself.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [description, escape, backdrop, size, labels?.close]);
	useLayoutEffect(() => {
		if (!modal || modal !== held.current) return;
		modal.title = title;
		modal.busy = busy;
		modal.footer.hidden = !actions;
	});
	useLayoutEffect(() => {
		if (!modal || modal !== held.current) return;
		if (open && modal.shown) {
			if (round.current) round.current.quiet = false;
			modal.open(); // A controlled reopen cancels an exit without making another round.
		} else if (open) {
			// Each opening is one round; a round closed through `open` or by destruction reports nothing.
			const current = { quiet: false };
			round.current = current;
			modal.open().then(value => {
				if (!current.quiet && held.current === modal) closing.current?.(value);
			});
		} else if (!open && modal.shown) {
			if (round.current) round.current.quiet = true;
			modal.busy = false;
			modal.close(null);
		}
	}, [open, modal, closing]);
	if (!modal) return null;
	return h(React.Fragment, null, ReactDOM.createPortal(children, modal.body), actions ? ReactDOM.createPortal(actions, modal.footer) : null);
}

/**
 * `{ confirm, prompt, alert }` with the product's labels applied to every question, so an EN or ES
 * interface passes its copy once. Each returns a promise, like the DOM functions.
 */
export function useConfirm(labels = {}) {
	return useMemo(() => {
		const merge = options => ({ ...options, labels: { ...labels, ...options.labels } });
		return { confirm: options => confirm(merge(options)), prompt: options => prompt(merge(options)), alert: options => alert(merge(options)) };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(labels)]);
}

/**
 * The family's form for a product that sends its own submission (0.32.0, D183): while a required control
 * is empty or a part is marked `data-missing`, its submit buttons wait quiet (`aria-disabled`, still
 * reachable, a dialog footer's that name the form with `form` included), and a press or Enter only puts
 * the caret in the first part that waits, saying nothing (`Required`). Once nothing waits `onSubmit`
 * runs, where the product says what is wrong in a value, in its field; the browser's own validation is
 * off. A form drawn inside its tree, such as a dialog's through a portal, submits only itself. The ref is
 * the form element.
 */
export const Form = forwardRef(function Form({ onSubmit, children, ...rest }, ref) {
	const form = useRef(null);
	const required = useRef(null);
	useImperativeHandle(ref, () => form.current, []);
	useLayoutEffect(() => {
		required.current = new Required(form.current);
		return () => {
			required.current.destroy();
			required.current = null;
		};
	}, []);
	// React may draw the controls and the buttons again: what waits is read after every render
	useLayoutEffect(() => required.current?.settle());
	const submit = event => {
		// A form inside this one's React tree sends its submission up that tree, never as this one's
		if (event.target !== event.currentTarget) return;
		if (required.current?.hold(event)) return;
		onSubmit?.(event);
	};
	return h('form', { ...rest, ref: form, noValidate: true, onSubmit: submit }, children);
});

/**
 * A focused form: `onSubmit(values, data)` runs once at a time and the form is busy meanwhile;
 * `children` may be a function of `busy` to render the submit label. A failure shows `explain(error)`.
 * While a required field is empty its submit buttons are quiet, and a submission puts the caret in the
 * first empty one, saying nothing (0.32.0, D183).
 */
export function FocusedForm({ onSubmit, explain, onSuccess, labels, className, children, ...rest }) {
	const form = useRef(null);
	const behavior = useRef(null);
	const [busy, setBusy] = useState(false);
	const submit = useLatest(onSubmit);
	const explaining = useLatest(explain);
	const success = useLatest(onSuccess);
	useLayoutEffect(() => {
		behavior.current = new Submission(form.current, {
			submit: (values, data) => submit.current(values, data),
			explain: error => explaining.current?.(error),
			onsuccess: result => success.current?.(result),
			onbusy: setBusy,
			labels: { failure: labels?.failure }
		});
		return () => {
			behavior.current.destroy();
			behavior.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [labels?.failure]);
	// React may redraw the submit buttons: they are drawn quiet again while a required field is empty (0.32.0, D183)
	useLayoutEffect(() => behavior.current?.settle());
	return h('form', { ...rest, ref: form, className: `bui-form${className ? ` ${className}` : ''}` }, typeof children === 'function' ? children(busy) : children);
}

// The copy in English and Spanish, as on the DOM classes (0.7.1): `useConfirm(useConfirm.labels.es)`.
Dialog.labels = Modal.labels;
useConfirm.labels = Question.labels;
FocusedForm.labels = Submission.labels;

/**
 * The consequence of a destructive or irreversible action (D17), rendered by React with the markup of
 * the DOM `consequence` builder: `parts` (`affected`, `lost`, `kept`, `costing`, `recovery`; text,
 * React content or a list) and `labels` (`Consequence.labels.es`). Renders nothing when nothing is stated.
 */
export function Consequence({ parts, labels = {} }) {
	const words = { ...stated.labels.en, ...labels };
	const given = stated.order.filter(key => [].concat(parts?.[key] ?? []).filter(Boolean).length);
	if (!given.length) return null;
	const describe = value => (Array.isArray(value) ? h('ul', null, value.filter(Boolean).map((line, index) => h('li', { key: index }, line))) : value);
	return h('dl', { className: 'bui-consequence' }, given.map(key => h('div', { key, className: `bui-consequence-${key}` }, h('dt', null, words[key]), h('dd', null, describe(parts[key])))));
}
Consequence.labels = stated.labels;
