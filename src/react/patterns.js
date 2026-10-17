import { ListRow as Row } from '../dom/list/row.js';
import { CopyValue as Value } from '../dom/list/value.js';
import { Checklist as Steps } from '../dom/checklist/checklist.js';
import { EmptyState as Empty } from '../dom/checklist/empty.js';
import { CommandCard as Card } from '../dom/command/card.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

/**
 * The React forms of 0.15.0's patterns, driven by their DOM classes so behavior has one implementation:
 * `ListRow`, `CopyValue`, `Checklist`, `EmptyState` and `CommandCard`. Words are strings; callbacks are
 * read from the latest props; the rest is applied when its content changes.
 */

/** One object in a list; `tag: 'div'` outside a list (React hosts it in a `div` or an `li`). */
export function ListRow(props) {
	const latest = useLatest(props);
	const tag = props.tag === 'div' ? 'div' : 'li';
	const [host, row] = useInstance(() => new Row(relay(latest.current, latest, 'div')), [props.labels]);
	useSync(row, current => current.update(relay(latest.current, latest, 'div')), [shape(props)]);
	return h(tag, { ref: host, className: 'bui-host', style: { display: 'contents' } });
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

/** A place with nothing to show yet: its kind, title, one sentence, one action and a first run's steps. */
export function EmptyState({ kind = 'empty', title, text = null, action = null, onClear = null, checklist = null, glyph = null, labels }) {
	const latest = useLatest({ action, onClear, checklist });
	const given = action ? { label: action.label, href: action.href ?? null, run: action.href ? null : event => latest.current.action?.onSelect?.(event) } : null;
	const steps = checklist ? { ...checklist, steps: actions(checklist.steps ?? [], { current: { steps: checklist.steps ?? [] } }) } : null;
	const [host] = useInstance(() => new Empty({ kind, title, text, glyph, labels, action: given, clear: onClear ? () => latest.current.onClear?.() : null, checklist: steps }), [kind, title, text, glyph, labels, action?.label, action?.href, Boolean(onClear), JSON.stringify(checklist)]);
	return h('div', { ref: host, className: 'bui-host' });
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

/** A row's options with its callbacks read from the latest props. */
function relay(props, latest, tag) {
	const { run, actions: given = [], menu = [], select = null } = props;
	return {
		...props,
		tag,
		run: run ? event => latest.current.run?.(event) : null,
		actions: given.filter(Boolean).map((action, index) => ({ ...action, run: event => latest.current.actions?.filter(Boolean)[index]?.onSelect?.(event) })),
		menu: menu.filter(Boolean).map((item, index) => ({ ...item, run: item.href ? null : event => latest.current.menu?.filter(Boolean)[index]?.onSelect?.(event) })),
		select: select ? { ...select, onchange: checked => latest.current.select?.onChange?.(checked) } : null
	};
}

/** What changes a row: its values, not its callbacks. */
function shape({ title, href, meta, lead, status, facts, actions = [], menu = [], select, current }) {
	return JSON.stringify([title, href, meta, lead, status, facts, actions.filter(Boolean).map(action => [action.label, action.glyph]), menu.filter(Boolean).map(item => [item.label, item.href, item.disabled, item.reason, item.tone]), select ? [select.checked, select.disabled, select.name, select.value] : null, current]);
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
