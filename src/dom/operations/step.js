import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { hidden, status } from '../feedback.js';
import { TimeWords } from '../time/words.js';
import { TechnicalDetails } from './details.js';
import { Timing } from './timing.js';

/**
 * One step of an operation as `Steps` draws it: its mark, its name, its state in words, its time, the
 * phase its source published and, when it is blocked or failed, the reason with its technical details.
 * `measure(now)` brings the time and the phase up to date without drawing the step again, and says
 * whether the step is now past its 90th percentile.
 */
export class StepView {
	static #states = ['done', 'progress', 'stalled', 'failed', 'waiting'];
	static #tones = { progress: 'progress', stalled: 'warning', failed: 'danger' };
	static #marks = { done: 'check', stalled: 'alert', failed: 'close' };

	#step;
	#labels;
	#words;
	#element;
	#time = null;
	#phase = null;
	#details = null;

	/**
	 * @param {object} step the step as given, normalized by `StepView.state`
	 * @param {number} index its place, shown as the mark of a step not begun
	 * @param {{labels: import('../core/labels.js').Labels, words: TimeWords, locale?: string, details?: object}} context
	 */
	constructor(step, index, { labels, words, locale, details = {} }) {
		this.#step = step;
		this.#labels = labels;
		this.#words = words;
		const state = step.state;
		const word = labels.text(state);
		const mark = StepView.#marks[state] ? glyph(StepView.#marks[state]) : state === 'progress' ? el('span', { class: 'bui-step-ring' }) : String(index + 1);
		if (state === 'progress' && step.since !== null) this.#time = el('span', { class: 'bui-step-time' });
		else if (state === 'done' && step.since !== null && step.until !== null) this.#time = el('span', { class: 'bui-step-time', text: labels.text('took', { duration: words.exact(step.until - step.since) }) });
		if (step.phase?.label) this.#phase = el('span', { class: 'bui-step-phase' });
		const reason = (state === 'stalled' || state === 'failed') && step.reason ? step.reason : null;
		if (reason?.details) this.#details = new TechnicalDetails({ ...reason.details, locale, labels: details });
		this.#element = el('li', { class: `bui-step bui-step-${state}`, 'data-state': state, 'aria-current': state === 'progress' ? 'step' : null }, [
			el('span', { class: 'bui-step-mark', 'aria-hidden': 'true' }, [mark]),
			el('div', { class: 'bui-step-body' }, [
				el('span', { class: 'bui-step-head' }, [
					el('span', { class: 'bui-step-label' }, [content(step.label)]),
					StepView.#tones[state] ? status(word, StepView.#tones[state]) : hidden(` · ${word}`)
				]),
				this.#time,
				this.#phase,
				reason?.text ? el('p', { class: 'bui-step-reason' }, [content(reason.text)]) : null,
				this.#details?.element
			])
		]);
	}

	/**
	 * A step as given, with its state checked and its times read: an unknown state is `waiting`, and a
	 * reason may be a text or `{ text, details }`.
	 */
	static state(step, index) {
		const state = StepView.#states.includes(step?.state) ? step.state : 'waiting';
		const reason = typeof step?.reason === 'string' ? { text: step.reason } : (step?.reason ?? null);
		const phase = step?.phase?.label ? { label: step.phase.label, since: TimeWords.moment(step.phase.since) } : null;
		return { key: String(step?.id ?? index), label: step?.label ?? '', state, since: TimeWords.moment(step?.since), until: TimeWords.moment(step?.until), expected: step?.expected ?? null, phase, reason };
	}

	get element() {
		return this.#element;
	}

	get key() {
		return this.#step.key;
	}

	get state() {
		return this.#step.state;
	}

	get label() {
		return this.#step.label;
	}

	/** Brings the running time and the phase up to date; returns whether the step is slow. */
	measure(now) {
		const step = this.#step;
		const timing = new Timing(step, now);
		const slow = step.state === 'progress' && timing.slow;
		if (this.#time && step.state === 'progress') {
			const values = { elapsed: this.#words.exact(timing.elapsed), expected: timing.median === null ? '' : this.#words.rough(timing.median) };
			const key = slow ? 'slow' : timing.median === null ? 'running' : 'usual';
			StepView.#write(this.#time, this.#labels.text(key, values));
			this.#element.classList.toggle('bui-step-slow', slow);
		}
		if (this.#phase) {
			const phase = step.phase;
			const text = step.state === 'progress'
				? this.#labels.text('phase', { phase: phase.label, elapsed: phase.since === null ? '' : this.#words.exact(Math.max(0, now - phase.since)) }).replace(/ · $/, '')
				: this.#labels.text('stopped', { phase: phase.label });
			StepView.#write(this.#phase, text);
		}
		return slow;
	}

	destroy() {
		this.#details?.destroy();
		this.#element.remove();
	}

	/** Writes text only when it changed, so a tick never disturbs a reader. */
	static #write(node, text) {
		if (node.textContent !== text) node.textContent = text;
	}
}
