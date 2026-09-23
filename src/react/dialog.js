import React from 'react';
import ReactDOM from 'react-dom';
import { Dialog as Modal } from '../dom/dialog.js';
import { FocusedForm as Submission } from '../dom/form.js';
import { confirm, prompt, alert } from '../dom/questions.js';
import { h, living, useLatest } from './hooks.js';

const { useLayoutEffect, useMemo, useRef, useState } = React;

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
		if (open && !modal.shown) {
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
 * A focused form: `onSubmit(values, data)` runs once at a time and the form is busy meanwhile;
 * `children` may be a function of `busy` to render the submit label. A failure shows `explain(error)`.
 */
export function FocusedForm({ onSubmit, explain, onSuccess, labels, className, children, ...rest }) {
	const form = useRef(null);
	const [busy, setBusy] = useState(false);
	const submit = useLatest(onSubmit);
	const explaining = useLatest(explain);
	const success = useLatest(onSuccess);
	useLayoutEffect(() => {
		const behavior = new Submission(form.current, {
			submit: (values, data) => submit.current(values, data),
			explain: error => explaining.current?.(error),
			onsuccess: result => success.current?.(result),
			onbusy: setBusy,
			labels: { failure: labels?.failure }
		});
		return () => behavior.destroy();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [labels?.failure]);
	return h('form', { ...rest, ref: form, className: `bui-form${className ? ` ${className}` : ''}` }, typeof children === 'function' ? children(busy) : children);
}
