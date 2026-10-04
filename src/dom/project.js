import { Component } from './core/component.js';
import { el, fill } from './core/element.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { ChoiceMenu } from './choice/menu.js';
import { ProjectList } from './family/projects.js';

const words = {
	en: { label: 'Project', unset: 'Not set up in {product}', denied: 'No access in {product}', only: 'Only in {product}', empty: 'No projects to choose from.', search: 'Search projects', none: ({ query }) => `No projects match “${query}”.` },
	es: { label: 'Proyecto', unset: 'Sin configurar en {product}', denied: 'Sin acceso en {product}', only: 'Solo en {product}', empty: 'No hay proyectos para elegir.', search: 'Buscar proyectos', none: ({ query }) => `Ningún proyecto coincide con «${query}».` }
};

/**
 * The family bar's project list as a form control (D56, shared piece 2): the organization's projects
 * from Projects' one catalog, each with its state in this product, chosen in a `ChoiceMenu`.
 *
 * A project's state comes from `here`, as in the bar (`ProjectList.state`): `used` shows nothing,
 * `unset` says "Not set up in {product}" and can be chosen (setting a project up is what such a form
 * often does), `denied` says "No access in {product}" and cannot, and `only` says "Only in
 * {product}". `only: 'unset'` lists only the projects not set up here, for a form that adopts or sets
 * up a project. Rows are ordered by the page language's collation; more than `ProjectList.threshold`
 * open with a search field. One project that can be chosen is a statement, as in every choice.
 * Nothing is chosen for the person unless `value` says so.
 */
export class ProjectPicker extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze(words.en), es: Object.freeze(words.es) });

	#element;
	#body;
	#menu;
	#labels;
	#product;
	#only;
	#projects = [];

	/**
	 * @param {object} options
	 * @param {Array<{id: string, name: string, here?: object}>} options.projects the organization's projects
	 * @param {string} options.product this product's display name
	 * @param {string|null} [options.value] the project chosen
	 * @param {string} [options.label] what is chosen; `labels.label` by default
	 * @param {'unset'|null} [options.only] lists only the projects not set up here
	 * @param {Array<{label: string, run: () => void}>} [options.actions] after the projects ("New project…")
	 * @param {string|null} [options.name] submits the project's id with a form
	 * @param {(id: string) => void} [options.onchange]
	 */
	constructor({ projects = [], product, value = null, label = null, only = null, actions = [], name = null, onchange = null, labels = {} }) {
		super();
		this.#labels = new Labels(words.en, labels);
		this.#product = product;
		this.#only = only;
		const id = Ids.next('bui-project');
		const text = label ?? this.#labels.text('label');
		this.#menu = new ChoiceMenu({ label: text, options: [], value, actions, name, search: ProjectList.threshold, labels: { search: this.#labels.text('search'), none: ({ query }) => this.#labels.text('none', { query }) }, onchange: chosen => onchange?.(chosen) });
		this.#menu.control.id = `${id}-button`;
		this.#body = el('div', { class: 'bui-project-body' });
		this.#element = el('div', { class: 'bui-refs bui-refs-field bui-project' }, [el('label', { class: 'bui-field-label', for: `${id}-button`, text }), this.#body]);
		this.projects = projects;
	}

	get element() {
		return this.#element;
	}

	get control() {
		return this.#menu.control;
	}

	get value() {
		return this.#menu.value;
	}

	set value(value) {
		this.#menu.value = value;
	}

	/** Replaces the projects, for example after the descriptor answered again. */
	set projects(projects) {
		const collator = new Intl.Collator(this.#element.ownerDocument?.documentElement?.lang || undefined, { sensitivity: 'base' });
		const rows = [...(projects ?? [])].filter(project => project?.id && project.name).map(project => ({ project, state: ProjectList.state(project.here) }));
		this.#projects = rows.filter(row => this.#only !== 'unset' || row.state === 'unset').sort((a, b) => collator.compare(a.project.name, b.project.name));
		this.#draw();
	}

	focus() {
		this.#menu.control.focus();
	}

	destroy() {
		this.#menu.destroy();
		super.destroy();
	}

	#draw() {
		if (!this.#projects.length) return fill(this.#body, [el('p', { class: 'bui-refs-empty', role: 'status', text: this.#labels.text('empty') })]);
		const value = this.#menu.value;
		this.#menu.options = this.#projects.map(({ project, state }) => this.#option(project, state));
		this.#menu.value = this.#projects.some(row => row.project.id === value) ? value : null;
		if (this.#menu.element.parentNode !== this.#body) fill(this.#body, [this.#menu.element]);
	}

	#option(project, state) {
		const product = this.#product;
		const words = state === 'unset' || state === 'denied' || state === 'only' ? this.#labels.text(state, { product }) : null;
		return {
			value: project.id,
			label: project.name,
			search: project.name,
			status: state === 'unset' || state === 'only' ? [words, 'neutral'] : null,
			disabled: state === 'denied',
			reason: state === 'denied' ? words : null
		};
	}
}
