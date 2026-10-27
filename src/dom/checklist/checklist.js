import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';

const defaults = { progress: '{done} of {total} done', done: 'Done', current: 'Next step', blocked: 'Blocked', todo: 'To do', step: 'Step {number}' };
const states = ['todo', 'current', 'done', 'blocked'];

/**
 * The steps that set something up, in order, with their progress (0.15.0, DQ-17: a fresh project's
 * first run as one checklist instead of empty sections). Each step has its title, an optional line of
 * detail and its one action (a button or a link); its state is `todo`, `current`, `done` or `blocked`
 * (with its `reason`). Without states the first step not done is current. A done step folds to its
 * title with a check; the current one shows its detail and action; a blocked one says why. The head says
 * "2 of 4 done" with a bar. `steps` patches by each step's `key`, and an action that held focus keeps it.
 */
export class Checklist extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ progress: '{done} de {total} hechos', done: 'Hecho', current: 'Siguiente paso', blocked: 'Bloqueado', todo: 'Pendiente', step: 'Paso {number}' }) });

	#element;
	#list = el('ol', { class: 'bui-checklist-steps' });
	#progress = el('p', { class: 'bui-checklist-progress' });
	#bar = el('span', { class: 'bui-checklist-bar', 'aria-hidden': 'true' }, [el('span', { class: 'bui-checklist-fill' })]);
	#labels;
	#steps = [];

	/**
	 * @param {object} options
	 * @param {string|Node|null} [options.title] what the steps set up
	 * @param {Array<{key: string, title: string|Node, detail?: string|Node|null, state?: 'todo'|'current'|'done'|'blocked', reason?: string|Node|null, action?: {label: string, href?: string|null, run?: (event: Event) => void}|Node|null}>} options.steps
	 * @param {2|3|4|5|6} [options.level] the title's heading level (3)
	 */
	constructor({ title = null, steps = [], level = 3, labels = {} }) {
		super();
		this.#labels = new Labels(Checklist.labels, labels);
		const id = Ids.next('bui-checklist');
		const heading = title ? el(`h${[2, 3, 4, 5, 6].includes(level) ? level : 3}`, { id, class: 'bui-checklist-title' }, [content(title)]) : null;
		this.#element = el('section', { class: 'bui-checklist', 'aria-labelledby': heading ? id : null }, [el('div', { class: 'bui-checklist-head' }, [heading, this.#progress, this.#bar]), this.#list]);
		this.steps = steps;
	}

	get element() {
		return this.#element;
	}

	/** The steps with the states drawn (the current one computed when none is given). */
	get steps() {
		return this.#steps;
	}

	/** Replaces the steps, patched by key; focus on a step's action stays on that step's action. */
	set steps(steps) {
		const given = steps.filter(Boolean).map(step => ({ ...step, state: states.includes(step.state) ? step.state : null }));
		const current = given.some(step => step.state === 'current') ? -1 : given.findIndex(step => step.state !== 'done' && step.state !== 'blocked');
		this.#steps = given.map((step, index) => ({ ...step, state: step.state ?? (index === current ? 'current' : 'todo') }));
		const document = this.#element.ownerDocument;
		const focused = this.#list.contains(document.activeElement) ? document.activeElement.closest('[data-key]')?.dataset.key : null;
		fill(this.#list, this.#steps.map((step, index) => this.#step(step, index)));
		if (focused) [...this.#list.children].find(node => node.dataset.key === focused)?.querySelector('.bui-checklist-action')?.focus({ preventScroll: true });
		const done = this.#steps.filter(step => step.state === 'done').length;
		this.#progress.textContent = this.#labels.text('progress', { done, total: this.#steps.length });
		this.#bar.style.setProperty('--bui-checklist-done', String(this.#steps.length ? done / this.#steps.length : 0));
		this.#element.toggleAttribute('data-complete', this.#steps.length > 0 && done === this.#steps.length);
	}

	#step(step, index) {
		const words = this.#labels;
		const action = step.state === 'done' ? null : Checklist.#action(step.action);
		return el('li', { class: 'bui-checklist-step', 'data-key': step.key, 'data-state': step.state, 'aria-current': step.state === 'current' ? 'step' : null }, [
			el('span', { class: 'bui-checklist-marker', 'aria-hidden': 'true' }, [step.state === 'done' ? glyph('check') : String(index + 1)]),
			el('div', { class: 'bui-checklist-body' }, [
				el('p', { class: 'bui-checklist-name' }, [content(step.title), el('span', { class: 'bui-hidden', text: ` · ${words.text(step.state)}` })]),
				step.detail && step.state !== 'done' ? el('p', { class: 'bui-checklist-detail' }, [content(step.detail)]) : null,
				step.state === 'blocked' && step.reason ? el('p', { class: 'bui-checklist-reason' }, [content(step.reason)]) : null,
				action
			])
		]);
	}

	static #action(action) {
		if (!action) return null;
		if (typeof action.nodeType === 'number') return action;
		const { label, href = null, run = null } = action;
		const node = href ? el('a', { class: 'bui-button bui-button-secondary bui-button-small bui-checklist-action', href }) : el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small bui-checklist-action' });
		node.append(el('span', { text: label }));
		if (run) node.addEventListener('click', event => run(event));
		return node;
	}
}
