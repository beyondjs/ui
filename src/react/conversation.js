import React from 'react';
import ReactDOM from 'react-dom';
import { Composer as Box } from '../dom/composer/composer.js';
import { LiveText as Live } from '../dom/live/text.js';
import { ActivityRow as Row } from '../dom/activity/row.js';
import { ActivityGroup as Fold } from '../dom/activity/group.js';
import { Clock } from '../dom/time/clock.js';
import { h, living, useInstance, useLatest, useSync } from './hooks.js';

const { forwardRef, useImperativeHandle, useRef, useState } = React;

/**
 * The conversation pieces of 0.10.0, driven by their DOM classes so keys, frames, patching and focus
 * have one implementation: `Composer`, `LiveText`, `ActivityRow` and `ActivityGroup`. Callbacks are
 * read from the latest props; React content goes into the classes' slots through portals.
 */

/** A slot a DOM class holds and React fills: it takes no box of its own. */
function slot(tag, name) {
	const node = document.createElement(tag);
	node.className = name;
	node.setAttribute('data-bui-slot', '');
	return node;
}

/**
 * The message box. `tools`, `extras`, `settings` and a non-text `status` are React content; `status` may
 * also be `{ text, action }` with the action React content or `{ label, onSelect }` (0.11.0); `stop` is
 * `{ label, onSelect, busy? }`; `onSubmit({ text, action, attachments? })` returns a promise (a rejection
 * gives the text back). `attach` is `{ label?, accept?, multiple?, onFiles, onRemove?, onRetry? }` and
 * `attachments` the chips; `onSuggest(query, signal)` lists suggestions after `suggest.trigger` (0.11.0).
 * `value` is applied when it changes; the ref has `focus()`, `submit(action?)`, `attach()`, `value`,
 * `busy` and `sending`. A change of `label`, `submit`, `min`, `max`, `name`, `labels` (memoize it),
 * `locale`, `suggest` or whether there is `attach` or `onSuggest` creates a new box.
 */
export const Composer = forwardRef(function Composer({ label, placeholder = null, status = null, tools = null, extras = null, settings = null, actions = null, stop = null, disabled = null, busy = false, submit = 'enter', value, min, max, name = null, onChange = null, onSubmit, explain, labels, attach = null, attachments = null, onSuggest = null, suggest = null, locale = undefined }, ref) {
	const [slots] = useState(() => ({ tools: slot('span', 'bui-composer-slot'), extras: slot('span', 'bui-composer-slot'), settings: slot('span', 'bui-composer-slot'), status: slot('span', 'bui-composer-slot'), action: slot('span', 'bui-composer-slot') }));
	const latest = useLatest({ onChange, onSubmit, explain, stop, attach, onSuggest, status });
	const line = new StatusLine(status, slots, latest);
	const halt = () => (stop?.label ? { label: stop.label, busy: Boolean(stop.busy), run: () => latest.current.stop?.onSelect?.() } : null);
	const intake = attach ? { label: attach.label ?? null, accept: attach.accept ?? null, multiple: attach.multiple !== false, onfiles: (files, via) => latest.current.attach?.onFiles?.(files, via), onremove: item => latest.current.attach?.onRemove?.(item), onretry: attach.onRetry ? item => latest.current.attach?.onRetry?.(item) : null } : null;
	const [host, box] = useInstance(
		() =>
			new Box({
				label,
				placeholder,
				submit,
				min,
				max,
				name,
				labels,
				locale,
				value: value ?? '',
				status: line.value,
				tools: tools ? [slots.tools] : [],
				extras: extras ? [slots.extras] : [],
				settings: settings ? [slots.settings] : [],
				actions,
				stop: halt(),
				disabled,
				busy,
				attach: intake,
				attachments: attachments ?? [],
				suggest,
				onsuggest: onSuggest ? (query, signal) => latest.current.onSuggest?.(query, signal) ?? [] : null,
				onsubmit: message => Promise.resolve(latest.current.onSubmit?.(message)),
				onchange: text => latest.current.onChange?.(text),
				explain: explain === undefined ? undefined : error => latest.current.explain?.(error) ?? null
			}),
		[label, submit, min, max, name, labels, locale, explain === undefined, Boolean(attach), Boolean(attach?.onRetry), Boolean(onSuggest), JSON.stringify(suggest ?? null)]
	);
	// The adapter places the element itself, so the field's height is fitted once it is in the page
	useSync(box, current => current.fit(), []);
	useSync(box, current => (current.placeholder = placeholder), [placeholder]);
	useSync(box, current => (current.status = line.value), [line.key]);
	useSync(box, current => (current.tools = tools ? [slots.tools] : []), [Boolean(tools)]);
	useSync(box, current => (current.extras = extras ? [slots.extras] : []), [Boolean(extras)]);
	useSync(box, current => (current.settings = settings ? [slots.settings] : []), [Boolean(settings)]);
	useSync(box, current => (current.attachments = attachments ?? []), [attachments]);
	useSync(box, current => (current.actions = actions), [JSON.stringify(actions)]);
	useSync(box, current => (current.stop = halt()), [stop?.label ?? null, Boolean(stop?.busy)]);
	useSync(box, current => (current.disabled = disabled), [JSON.stringify(disabled ?? null)]);
	useSync(box, current => (current.busy = busy), [busy]);
	useSync(box, current => typeof value === 'string' && current.value !== value && (current.value = value), [value]);
	useImperativeHandle(ref, () => ({ focus: () => box?.focus(), submit: action => box?.submit(action) ?? Promise.resolve(false), attach: () => box?.attach(), get value() { return box?.value ?? ''; }, get busy() { return box?.busy ?? false; }, get sending() { return box?.sending ?? false; } }), [box]);
	const portal = (content, node) => (box && content ? ReactDOM.createPortal(content, node) : null);
	return h(React.Fragment, null, h('div', { ref: host, className: 'bui-host' }), portal(tools, slots.tools), portal(extras, slots.extras), portal(settings, slots.settings), portal(line.node, slots.status), portal(line.action, slots.action));
});

/**
 * A React state line as the DOM `Composer` takes it: text stays text, React content goes into a slot,
 * and `{ text, action }` keeps its text and its action (React content in a slot, or `{ label, onSelect }`
 * as the composer's own button, its `onSelect` read from the latest props). `key` changes when the DOM
 * value must be set again.
 */
class StatusLine {
	#value;
	#key;
	#node = null;
	#action = null;

	constructor(status, slots, latest) {
		const text = value => typeof value === 'string' || typeof value === 'number';
		const framed = status && typeof status === 'object' && !React.isValidElement(status) && 'text' in status;
		const body = framed ? status.text : status;
		this.#node = body !== null && body !== undefined && body !== '' && !text(body) ? body : null;
		const shown = this.#node ? slots.status : (body ?? null);
		const action = framed ? status.action : null;
		const plain = action && typeof action === 'object' && !React.isValidElement(action) && 'label' in action;
		this.#action = action && !plain ? action : null;
		this.#value = framed ? { text: shown, action: plain ? { label: action.label, run: () => latest.current.status?.action?.onSelect?.() } : action ? slots.action : null } : shown;
		this.#key = JSON.stringify([this.#node ? 'node' : shown, framed, plain ? action.label : Boolean(action)]);
	}

	get value() {
		return this.#value;
	}

	get key() {
		return this.#key;
	}

	/** React content of the sentence, or null. */
	get node() {
		return this.#node;
	}

	/** React content of the action, or null. */
	get action() {
		return this.#action;
	}
}

/**
 * Text that arrives in pieces. `text` is the text so far (a longer text that starts with the shown one
 * is appended, any other replaces it), `state` is `live`, `settled` (drawn final at once) or `abandoned`
 * (with `note`). `render(text)` returns React content, drawn at most once per animation frame; without
 * it the text is plain. The ref has `append`, `set`, `settle` and `abandon` for a product that streams
 * without rendering per piece.
 */
export const LiveText = forwardRef(function LiveText({ text = '', state = 'live', note = null, render = null, bound, labels }, ref) {
	const [holder] = useState(() => slot('div', 'bui-live-slot'));
	const [drawn, setDrawn] = useState(text);
	const [host, live] = useInstance(() => new Live({ text, bound, labels, render: render ? value => (setDrawn(value), holder) : null }), [Boolean(render), bound, labels]);
	useSync(
		live,
		current => {
			if (state === 'settled') return current.settle(text);
			if (current.state !== 'live') return;
			if (text.startsWith(current.text)) current.append(text.slice(current.text.length));
			else current.set(text);
			if (state === 'abandoned') current.abandon(note);
		},
		[text, state, note]
	);
	useImperativeHandle(ref, () => ({ append: piece => live?.append(piece), set: value => live?.set(value), settle: value => live?.settle(value), abandon: value => live?.abandon(value), get text() { return live?.text ?? ''; }, get state() { return live?.state ?? 'live'; } }), [live]);
	return h(React.Fragment, null, h('div', { ref: host, className: 'bui-host' }), live && render ? ReactDOM.createPortal(render(drawn), holder) : null);
});

/** Section records as the DOM row takes them; anything else is no body. */
function records(body) {
	return Array.isArray(body) ? () => body : null;
}

/**
 * One row of activity. `title` and `meta` are text. `body` is a function returning React content,
 * called once the row is first opened, or section records (`{ label, text, code?, lines?, copy? }`).
 * Values are applied when they change; `open` opens or closes it; `clock`, `locale` and `labels` create
 * a new row.
 */
export function ActivityRow({ glyph = 'box', title, meta = null, state = 'done', since = null, until = null, duration = null, tail = null, body = null, open = false, clock = Clock.system, locale = undefined, labels }) {
	const [holder] = useState(() => slot('div', 'bui-activity-slot'));
	const [built, setBuilt] = useState(false);
	const react = typeof body === 'function';
	const builder = () => (react ? () => (setBuilt(true), holder) : records(body));
	const [host, row] = useInstance(() => new Row({ glyph, title, meta, state, since, until, duration, tail, body: builder(), open, clock, locale, labels }), [clock, locale, labels]);
	useSync(row, current => current.update({ glyph, title, meta, state, since, until, duration, tail }), [glyph, title, meta, state, String(since), String(until), duration, tail]);
	useSync(row, current => current.update({ body: builder() }), [react, react ? null : JSON.stringify(body)]);
	useSync(row, current => (open ? current.open() : current.close()), [open]);
	return h(React.Fragment, null, h('div', { ref: host, className: 'bui-host' }), row && react && built ? ReactDOM.createPortal(body(), holder) : null);
}

/**
 * Consecutive rows folded into one ("Read 3 files"): `rows` are row values (`key`, `glyph`, `title`,
 * `meta`, `state`, times, `tail`, and `body` as section records), patched by key; `title` is text or a
 * function of the number of rows. A change of `clock`, `locale` or `labels` creates a new group.
 */
export function ActivityGroup({ glyph = 'layers', title, meta = null, rows = [], open = false, clock = Clock.system, locale = undefined, labels }) {
	const latest = useLatest(title);
	const made = useRef(new Map());
	const named = count => (typeof latest.current === 'function' ? latest.current(count) : (latest.current ?? ''));
	const [host, group] = useInstance(() => new Fold({ glyph, title: named, meta, open, labels }), [clock, locale, labels]);
	useSync(
		group,
		current => {
			const next = (rows ?? []).filter(Boolean).map((values, index) => {
				const key = String(values.key ?? index);
				// `key` is read above; a row ignores it among its values
				const { body, ...rest } = values;
				let item = living(made.current.get(key));
				if (item) item.update({ ...rest, body: records(body) });
				else made.current.set(key, (item = new Row({ ...rest, body: records(body), clock, locale, labels })));
				return item;
			});
			for (const [key, item] of made.current) if (!next.includes(item)) made.current.delete(key);
			current.rows = next;
		},
		[JSON.stringify(rows)]
	);
	useSync(group, current => current.update({ glyph, meta, title: named }), [glyph, meta, typeof title === 'function' ? null : title]);
	useSync(group, current => (open ? current.open() : current.close()), [open]);
	return h('div', { ref: host, className: 'bui-host' });
}

// The copy in English and Spanish, as on the DOM classes.
Composer.labels = Box.labels;
LiveText.labels = Live.labels;
ActivityRow.labels = Row.labels;
ActivityGroup.labels = Fold.labels;
