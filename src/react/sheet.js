import React from 'react';
import ReactDOM from 'react-dom';
import { SideSheet as Sheet } from '../dom/sheet.js';
import { h, living, useLatest } from './hooks.js';

const { useLayoutEffect, useRef, useState } = React;

/**
 * A side sheet driven by the DOM `SideSheet` class: React renders `children` into its body, `actions`
 * into its footer and `error` (a failure such as "Beyond Projects didn't answer" with Try again) at its
 * top. `open` opens and closes it; `onClose(value)` reports only the person dismissing it (Escape, the
 * close button) or a `close(value)` from inside, never a close through `open`, a replacement or an
 * unmount, as the React `Dialog`. `busy` keeps it open while the hosted task works. `restore` is the
 * element focus returns to when it closes.
 */
export function SideSheet({ open, title, label = null, description = null, width = 'form', busy = false, error = null, restore = null, labels, onClose, actions = null, children }) {
	const [state, setState] = useState(null);
	const [slot] = useState(() => document.createElement('div'));
	const held = useRef(null);
	const round = useRef(null);
	// The sheet the error region was last filled for, and whether it held one: refilled only when that changes
	const shown = useRef({ sheet: null, error: false });
	const closing = useLatest(onClose);
	const sheet = living(state);
	useLayoutEffect(() => {
		const made = new Sheet({ title, label, description, width, labels: { close: labels?.close } });
		held.current = made;
		setState(made);
		return () => {
			if (held.current === made) held.current = null;
			setState(current => (current === made ? null : current));
			made.destroy();
		};
		// The title and busy are updated in place; these options shape the element itself. The close
		// label is a string, so labels passed inline never rebuild (and close) the sheet (0.7.4)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [label, description, width, labels?.close]);
	useLayoutEffect(() => {
		if (!sheet || sheet !== held.current) return;
		sheet.title = title;
		sheet.busy = busy;
		sheet.footer.hidden = !actions;
		// The alert region is filled once per failure, so a render does not announce it again (0.7.4)
		if (shown.current.sheet !== sheet || shown.current.error !== Boolean(error)) {
			sheet.error(error ? slot : null);
			shown.current = { sheet, error: Boolean(error) };
		}
	});
	useLayoutEffect(() => {
		if (!sheet || sheet !== held.current) return;
		if (open && !sheet.shown) {
			const current = { quiet: false };
			round.current = current;
			sheet.open({ restore }).then(value => {
				if (!current.quiet && held.current === sheet) closing.current?.(value);
			});
		} else if (!open && sheet.shown) {
			if (round.current) round.current.quiet = true;
			sheet.busy = false;
			sheet.close(null);
		}
	}, [open, sheet, closing]);
	if (!sheet) return null;
	return h(React.Fragment, null, ReactDOM.createPortal(children, sheet.body), actions ? ReactDOM.createPortal(actions, sheet.footer) : null, error ? ReactDOM.createPortal(error, slot) : null);
}

SideSheet.labels = Sheet.labels;
