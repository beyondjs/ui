import { Fragment, useLayoutEffect, useRef } from 'react';
import { ListRow as Row } from '../dom/list/row.js';
import { RowContent } from './row-content.js';
import { CopyValue as Value } from '../dom/list/value.js';
import { Checklist as Steps } from '../dom/checklist/checklist.js';
import { EmptyState as Empty } from '../dom/checklist/empty.js';
import { CommandCard as Card } from '../dom/command/card.js';
import { ChangeOutcome as Outcome } from '../dom/outcome.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

/**
 * The React forms of 0.15.0's patterns, driven by their DOM classes so behavior has one implementation:
 * `ListRow`, `CopyValue`, `Checklist`, `EmptyState` and `CommandCard`. List rows accept React content; callbacks are
 * read from the latest props; the rest is applied when its content changes.
 */

/** One object in a list; `tag: 'div'` outside a list (React hosts it in a `div` or an `li`). */
export function ListRow(props) {
	const latest = useLatest(props);
	const tag = props.tag === 'div' ? 'div' : 'li';
	const [host, row] = useInstance(() => new RowContent(latest.current, latest), [props.labels]);
	const plan = row?.prepare(props);
	useSync(row, current => current.update(plan), [plan?.key]);
	return h(Fragment, null, h(tag, { ref: host, className: 'bui-host', style: { display: 'contents' } }), ...(plan?.portals ?? []));
}

/** A copyable value: mono, cut and shown whole on hover and focus, then Copy. */
export function CopyValue({ value, label = null, href = null, cut = 'end', labels }) {
	const [host, copy] = useInstance(() => new Value({ value, label, href, cut, labels }), [label, href, cut, labels]);
	useSync(copy, current => (current.value = value), [value]);
	return h('span', { ref: host, className: 'bui-host' });
}

/** Setup steps with their progress; a step's action `onSelect` is read from the latest props. */
export function Checklist({ title = null, steps = [], level = 3, labels }) {
	const latest = useLatest({ steps });
	const [host, list] = useInstance(() => new Steps({ title, level, labels, steps: actions(steps, latest) }), [title, level, labels]);
	useSync(list, current => (current.steps = actions(steps, latest)), [JSON.stringify(steps.map(({ action, ...step }) => ({ ...step, action: action ? [action.label, action.href ?? null] : null })))]);
	return h('div', { ref: host, className: 'bui-host' });
}

/**
 * A place with nothing to show yet: its kind, title, one sentence, one action and a first run's steps. `frame`
 * left unset takes the DOM component's default (0.25.1): a box for every kind but an outage, one quiet line.
 */
export function EmptyState({ kind = 'empty', title, text = null, action = null, onClear = null, checklist = null, glyph = null, frame = null, inline = false, labels }) {
	const latest = useLatest({ action, onClear, checklist });
	const given = action ? { label: action.label, href: action.href ?? null, run: action.href ? null : event => latest.current.action?.onSelect?.(event) } : null;
	const steps = checklist ? { ...checklist, steps: actions(checklist.steps ?? [], { current: { steps: checklist.steps ?? [] } }) } : null;
	const [host] = useInstance(() => new Empty({ kind, title, text, glyph, frame, inline, labels, action: given, clear: onClear ? () => latest.current.onClear?.() : null, checklist: steps }), [kind, title, text, glyph, frame, inline, labels, action?.label, action?.href, Boolean(onClear), JSON.stringify(checklist)]);
	// An outage's place in a cell is phrasing content, hosted where a block cannot go (0.33.0)
	return h(inline ? 'span' : 'div', { ref: host, className: 'bui-host' });
}

/** A request waiting for the person's answer; `onAllow` and `onDeny` (or, with `decisions`, `onDecide`, 0.16.0) may return a promise. */
export function CommandCard({ title, command, detail = null, scope = null, state = 'pending', onAllow = null, onDeny = null, decisions = null, onDecide = null, editable = false, focus = false, labels }) {
	const latest = useLatest({ onAllow, onDeny, onDecide });
	const decide = onDecide ? answer => latest.current.onDecide?.(answer) : null;
	const [host, card] = useInstance(() => new Card({ title, command, detail, scope, state, labels, decisions, editable, ondecide: decide, allow: answer => latest.current.onAllow?.(answer), deny: answer => latest.current.onDeny?.(answer) }), [title, command, detail, scope?.label, labels, JSON.stringify(decisions), editable, Boolean(onDecide)]);
	useSync(card, current => (current.state = state), [state]);
	useSync(card, current => focus && current.focus(), [focus]);
	return h('div', { ref: host, className: 'bui-host' });
}

/**
 * A change that did not get its answer (D186, 0.33.0), drawn by the DOM `ChangeOutcome` in the warning tone:
 * `outcome` (`unavailable` or `unknown`), `cause`, `check` (`{ label, href }` or `{ label, onSelect }`, read
 * from the latest props) and `details`.
 */
export function ChangeOutcome({ outcome, cause = null, check = null, details = null, labels }) {
	const latest = useLatest({ check });
	const host = useRef(null);
	useLayoutEffect(() => {
		const way = check ? { label: check.label, href: check.href ?? null, run: check.href ? null : event => latest.current.check?.onSelect?.(event) } : null;
		const node = Outcome.draw({ outcome, cause, check: way, details }, labels);
		host.current?.append(node);
		return () => node.remove();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [outcome, cause, check?.label, check?.href, JSON.stringify(details), labels]);
	return h('div', { ref: host, className: 'bui-host' });
}

/** Steps with each action's `onSelect` read from the latest props. */
function actions(steps, latest) {
	return steps.map((step, index) => (step.action ? { ...step, action: { label: step.action.label, href: step.action.href ?? null, run: step.action.href ? null : event => latest.current.steps?.[index]?.action?.onSelect?.(event) } } : step));
}

ListRow.labels = Row.labels;
CopyValue.labels = Value.labels;
Checklist.labels = Steps.labels;
EmptyState.labels = Empty.labels;
CommandCard.labels = Card.labels;
ChangeOutcome.labels = Outcome.labels;
