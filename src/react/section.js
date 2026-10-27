import React from 'react';
import { Waiting } from './simple.js';
import { EmptyState } from './patterns.js';
import { LastUpdate } from './again.js';
import { h } from './hooks.js';

const { createContext, useContext, useId, useLayoutEffect, useMemo, useState } = React;
/** The waiting parts of the section around, so it is busy while one waits (0.44.0) */
const Parts = createContext(null);

/**
 * A flat section: `title`, one `description` line, its `actions` and its content; `waiting` (true or a
 * shape, 0.23.0) holds its body in a `Waiting` while it reads. Since 0.24.0 (D163) `unavailable` (true or
 * `EmptyState`'s props) says in place that its read did not answer, and `updated` (a time, or `{ time,
 * locale, labels }`) says when the content it keeps from an earlier read was read. Since 0.44.0 (LOAD-01)
 * a `SectionPart` in its body waits for its own read while the rest is drawn, and the section is busy while
 * one does.
 */
export function Section({ title, description = null, actions = null, level = 2, raised = false, waiting = null, unavailable = null, updated = null, children }) {
	const id = `bui-section-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const [parts, setParts] = useState(() => new Set());
	// Each part says when it starts or stops waiting; the set changes only when that changes
	const registry = useMemo(
		() => ({
			say(part, waits) {
				setParts(current => {
					if (current.has(part) === waits) return current;
					const next = new Set(current);
					if (waits) next.add(part);
					else next.delete(part);
					return next;
				});
			}
		}),
		[]
	);
	const kept = updated === null || updated === undefined ? null : typeof updated === 'object' && !(updated instanceof Date) ? updated : { time: updated };
	const body = unavailable ? h(EmptyState, { ...(unavailable === true ? {} : unavailable), kind: 'outage' }) : waiting ? h(Waiting, waiting === true ? {} : waiting) : children;
	const busy = !unavailable && (Boolean(waiting) || parts.size > 0);
	return h(
		'section',
		{ className: 'bui-section', 'aria-labelledby': id, 'data-raised': raised ? '' : undefined, 'aria-busy': busy ? 'true' : undefined },
		h('div', { className: 'bui-section-head' }, h(level === 3 ? 'h3' : 'h2', { id, className: 'bui-section-title' }, title), actions ? h('div', { className: 'bui-section-actions' }, actions) : null),
		description ? h('p', { className: 'bui-section-description' }, description) : null,
		kept ? h(LastUpdate, kept) : null,
		h('div', { className: 'bui-section-body' }, h(Parts.Provider, { value: registry }, body))
	);
}

/**
 * One part of a section's body that waits for its own read while the rest is drawn (0.44.0, LOAD-01), as the
 * DOM `Section.part()`: `waiting` (true or a shape) holds a `Waiting` in its place, `children` once it is read.
 * The `Section` around it is busy while it waits.
 */
export function SectionPart({ waiting = null, children }) {
	const parts = useContext(Parts);
	const part = useId();
	const waits = Boolean(waiting);
	useLayoutEffect(() => {
		if (!parts || !waits) return undefined;
		parts.say(part, true);
		return () => parts.say(part, false);
	}, [parts, part, waits]);
	return h('div', { className: 'bui-section-part', 'data-waiting': waits ? '' : undefined }, waits ? h(Waiting, waiting === true ? {} : waiting) : children);
}
