import React from 'react';
import { PageHeader as Heading } from '../dom/page/header.js';
import { HeldFocus } from '../dom/page/held.js';
import { Labels } from '../dom/core/labels.js';
import { PageCompact } from '../dom/page/compact.js';
import { Cut, NameTip } from '../dom/core/cut.js';
import { h, assign } from './hooks.js';

const { useCallback, useId, useLayoutEffect, useRef, Fragment, isValidElement } = React;
/** Whether a lead says something (0.41.0), by the DOM header's rule: a node, a number or words, inside lists and fragments. */
const told = node => {
	if (Array.isArray(node)) return node.some(told);
	if (isValidElement(node) && node.type === Fragment) return told(node.props.children);
	return node !== null && node !== undefined && typeof node !== 'boolean' && node !== '';
};

/**
 * The page's one header: `crumbs` (`{ label, href? }`, the levels above, where the object lives), the
 * H1 `title`, its `kind` beside it (words or one control, 0.19.1), one `status`, a `facts` line of the
 * object's properties, the page's `lead` sentence at the reading measure (0.41.0, D191), the
 * title line's `actions` and the `tabs`. `headingRef` reaches the H1
 * for focus after a navigation. `compact` (`true` or `{ actions }`, 0.11.0) adds the sticky line that
 * shows the title and the status once the title has scrolled out, placed right before the header;
 * `subject` (`{ text, href }`, 0.29.0, D181) is what that line names in place of the title, such as the
 * message of the turn being read.
 *
 * Since 0.44.0 (LOAD-01) `waiting` draws the title as the DOM header's `wait()` does: one placeholder line
 * at the title's height, named "Loading…" (`labels.loading`) for assistive technology, busy and out of
 * focus, a focus asked of the H1 meanwhile (`headingRef.current.focus()`) landing once the title does. The
 * facts line is a block, so it may hold a control such as a `ChoiceMenu`, and an action whose permission is
 * known only after the read holds its place with `Reserved`.
 */
export function PageHeader({ title, crumbs = [], kind = null, status = null, facts = null, lead = null, actions = null, tabs = null, headingRef = null, labels = {}, compact = null, subject = null, waiting = false }) {
	const id = `bui-page-title-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const words = new Labels(Heading.labels, labels);
	const levels = (crumbs ?? []).filter(Boolean);
	const bar = useRef(null);
	const line = useRef(null);
	const named = useRef(null);
	const heading = useRef(null);
	const keep = useRef(null);
	const reach = useCallback(node => {
		heading.current = node;
		assign(headingRef, node);
	}, [headingRef]);
	useLayoutEffect(() => {
		const focus = new HeldFocus(heading.current);
		keep.current = focus;
		return () => focus.drop();
	}, []);
	useLayoutEffect(() => {
		if (waiting) keep.current.hold();
		else keep.current.release();
	}, [Boolean(waiting)]);
	useLayoutEffect(() => {
		if (!compact || !bar.current || !line.current) return undefined;
		const watch = new PageCompact({ header: line.current, bar: bar.current });
		const tip = new NameTip(named.current, { text: () => named.current?.textContent ?? '', cut: () => Cut.text(named.current) });
		return () => {
			watch.destroy();
			tip.destroy();
		};
	}, [Boolean(compact)]);
	const tools = compact?.actions ?? null;
	const shown = waiting ? null : title;
	// The part in view, said in place of the title (0.29.0, D181): as written, without empty lines
	const part = typeof subject?.text === 'string' ? subject.text.trim().replace(/[ \t]*\n\s*/g, '\n') : '';
	const pending = [h('span', { key: 'name', className: 'bui-hidden' }, words.text('loading')), h('span', { key: 'line', className: 'bui-skeleton bui-page-pending', 'aria-hidden': 'true' }, h('span', { className: 'bui-skeleton-line' }))];
	const held = compact
		? h(
				'div',
				{ ref: bar, className: 'bui-page-compact', 'data-subject': part ? '' : undefined },
				h(
					'div',
					{ className: 'bui-page-compact-line' },
					h('div', { className: 'bui-page-compact-text', 'aria-hidden': 'true' }, h('a', { className: 'bui-page-compact-subject', tabIndex: -1, href: (part && subject.href) || undefined, hidden: !part }, part), h('span', { ref: named, className: 'bui-page-compact-title', hidden: Boolean(part) }, shown), h('span', { className: 'bui-page-compact-status' }, status)),
					h('div', { className: 'bui-page-compact-actions', hidden: !tools }, tools)
				)
			)
		: null;
	const header = h(
		'header',
		{ className: 'bui-page-header' },
		levels.length
			? h('nav', { className: 'bui-crumbs', 'aria-label': words.text('crumbs') }, h('ol', null, levels.map((level, index) => h('li', { key: index }, level.href ? h('a', { href: level.href }, level.label) : h('span', null, level.label)))))
			: null,
		h(
			'div',
			{ ref: line, className: 'bui-page-title' },
			h('h1', { id, className: 'bui-page-heading', tabIndex: waiting ? undefined : -1, 'aria-busy': waiting ? 'true' : undefined, ref: reach }, waiting ? pending : title),
			kind ? h('span', { className: 'bui-page-kind' }, typeof kind === 'string' ? h('span', { className: 'bui-page-tag' }, kind) : kind) : null,
			status ? h('span', { className: 'bui-page-status' }, status) : null,
			actions ? h('div', { className: 'bui-page-actions' }, actions) : null
		),
		facts ? h('div', { className: 'bui-page-facts' }, facts) : null,
		told(lead) ? h('p', { className: 'bui-page-lead' }, lead) : null,
		tabs ? h('div', { className: 'bui-page-tabs' }, tabs) : null
	);
	return held ? h(Fragment, null, held, header) : header;
}

/**
 * Holds the place of an action whose permission or presence is known only after the object's read (0.44.0,
 * LOAD-01), as the DOM `reserved()` does: the action laid out where it will be, unseen, inert and hidden from
 * assistive technology. Render the action itself once the read permits it, or nothing when it does not.
 */
export function Reserved({ children }) {
	// `inert` is set on the element: React 18 knows no such property and React 19 reads it as a boolean
	const hold = useCallback(node => node?.setAttribute('inert', ''), []);
	return h('span', { ref: hold, className: 'bui-reserved', 'aria-hidden': 'true' }, children);
}

// The copy in English and Spanish, as on the DOM classes (0.7.2).
PageHeader.labels = Heading.labels;
