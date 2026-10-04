import { Steps as List } from '../dom/operations/steps.js';
import { Awaited as Card } from '../dom/operations/awaited.js';
import { Freshness as Fresh } from '../dom/operations/freshness.js';
import { TechnicalDetails as Facts } from '../dom/operations/details.js';
import { Clock } from '../dom/time/clock.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

/**
 * The long-operation components (decision D50), driven by their DOM classes so the timing, the
 * thresholds and the announcements have one implementation. Records are props and are applied when
 * their content changes; `clock` (one per page, `Clock.system` by default), `locale`, `labels`
 * (memoize them) and `level` create a new instance.
 */

/** The steps of an operation with their times. */
export function Steps({ label, steps = [], clock = Clock.system, locale = undefined, labels }) {
	const [host, list] = useInstance(() => new List({ label, steps, clock, locale, labels }), [label, clock, locale, labels]);
	useSync(list, current => (current.steps = steps), [JSON.stringify(steps)]);
	return h('div', { ref: host, className: 'bui-host' });
}

/**
 * The card a person waits on. `check` and `onEnd` are called with the latest props; `ended`
 * (`'done'` or `'failed'`) ends it once; `reason.action.onSelect` is the way on.
 */
export function Awaited({ title, since = null, expected = null, steps = null, reason = null, check = null, ended = null, onEnd = null, clock = Clock.system, locale = undefined, level = 2, labels }) {
	const latest = useLatest({ check, onEnd, reason });
	const [host, card] = useInstance(
		() => new Card({ title, since, expected, steps, reason: relay(reason, latest), check: check ? () => latest.current.check?.() : null, onend: outcome => latest.current.onEnd?.(outcome), clock, locale, level, labels }),
		[clock, locale, level, labels, Boolean(check)]
	);
	useSync(card, current => current.update({ title, since, expected, steps, reason: relay(reason, latest) }), [title, String(since), JSON.stringify(expected), JSON.stringify(steps), JSON.stringify(reason)]);
	useSync(card, current => ended && current.end(ended), [ended]);
	return h('div', { ref: host, className: 'bui-host' });
}

/** A reason whose action's `onSelect` is read from the latest props when chosen. */
function relay(reason, latest) {
	if (!reason?.text) return null;
	const action = reason.action?.label ? { label: reason.action.label, href: reason.action.href ?? null, run: reason.action.href ? null : () => latest.current.reason?.action?.onSelect?.() } : null;
	return { text: reason.text, way: reason.way ?? null, details: reason.details ?? null, action };
}

/** A state with "Checked … ago", or "Last known: … · {time}" while disconnected. */
export function Freshness({ label, tone = 'neutral', checked = null, connected = true, clock = Clock.system, locale = undefined, labels }) {
	const [host, fresh] = useInstance(() => new Fresh({ label, tone, checked, connected, clock, locale, labels }), [clock, locale, labels]);
	useSync(fresh, current => current.update({ label, tone, checked, connected }), [label, tone, String(checked), connected]);
	return h('span', { ref: host, className: 'bui-host' });
}

/** "Technical details": the source's words, the request and the time, copyable for support. */
export function TechnicalDetails({ text = '', request = null, time = null, open = false, locale = undefined, labels }) {
	const [host, facts] = useInstance(() => new Facts({ text, request, time, open, locale, labels }), [locale, labels]);
	useSync(facts, current => current.update({ text, request, time }), [text, request, String(time)]);
	return h('div', { ref: host, className: 'bui-host' });
}

// The copy in English and Spanish, as on the DOM classes: `<Steps labels={Steps.labels.es} />`.
Steps.labels = List.labels;
Awaited.labels = Card.labels;
Freshness.labels = Fresh.labels;
TechnicalDetails.labels = Facts.labels;
