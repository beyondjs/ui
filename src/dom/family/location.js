import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { hidden } from '../feedback.js';
import { NavigationMenu } from './menu.js';
import { Organizations } from './organizations.js';
import { ProjectList } from './projects.js';

/**
 * Where the person is in the family bar: the organization, then `/` and the project menu.
 *
 * Both forms are built and CSS shows one: wide, the organization (its name alone when the person has
 * one, a menu when several) and the project menu; below about 720 px one "location" menu whose button
 * shows the project name (or the organization's) and whose panel lists both. Wide, the two names share
 * the width in equal parts up to each whole name (the organization capped narrower), so neither
 * collapses while the other is shown whole.
 *
 * The project menu is the product's standard project chooser, inside a project and outside one, where
 * its button reads "Choose a project" (Q22, option a). While the descriptor loads, placeholders (or the
 * names the product passed as `fallback`) hold the place; the product's `fallback.organizations` keep
 * the organization menu working, and when the descriptor is unavailable and the product passes a
 * `notice`, the project menu opens on that notice with the project in view and "All projects".
 */
export class Location extends Component {
	#element;
	#menus = [];
	#options;
	#organizations;
	#projects;

	/**
	 * @param {object} options
	 * @param {'loading'|'unavailable'|'ready'} options.state
	 * @param {object|null} options.descriptor the descriptor when ready
	 * @param {{organization?: string|null, project?: string|null, organizations?: Array<object>|null}} options.fallback names the product knows itself
	 * @param {string} options.product the product's display name
	 * @param {object|null} [options.notice] the product's one line at the top of the project menu
	 * @param {import('./places.js').Places} options.places
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor(options) {
		super();
		this.#options = options;
		const { state, descriptor, fallback, places, labels, product, notice = null } = options;
		const ready = state === 'ready';
		this.#organizations = new Organizations({ descriptor: ready ? descriptor : null, fallback, places, labels });
		const organization = this.#organizations.current;
		const stale = !ready;
		const project = ready ? descriptor.project ?? null : fallback.project ? { name: fallback.project } : null;
		this.#projects = new ProjectList({ organization, projects: ready ? descriptor.projects ?? [] : [], project, product, notice, places, labels, stale });
		this.#element = el('div', { class: 'bui-family-location' }, [el('div', { class: 'bui-family-wide' }, this.#wide()), el('div', { class: 'bui-family-narrow' }, this.#narrow())]);
	}

	get element() {
		return this.#element;
	}

	/** Whether neither form has anything to show (no organization, project or placeholder). */
	get blank() {
		return [...this.#element.children].every(form => !form.childElementCount);
	}

	/** New copies of the location menu's sections (organizations, then projects), for another menu to carry. */
	sections() {
		return this.#chooser() ? this.#sections() : [];
	}

	/** The organization in view (`{ id?, name, role? }`), or null. */
	get organization() {
		return this.#organizations.current;
	}

	/** Whether the person has any organization. */
	get any() {
		return this.#organizations.any;
	}

	/** The menus built, wide and narrow. */
	get menus() {
		return this.#menus;
	}

	destroy() {
		for (const menu of this.#menus) menu.destroy();
		super.destroy();
	}

	get #ready() {
		return this.#options.state === 'ready';
	}

	/** The name of the project in view: the descriptor's, or the one the product passed; null outside one. */
	get #name() {
		const { descriptor, fallback } = this.#options;
		return (this.#ready ? descriptor.project?.name : fallback.project) ?? null;
	}

	/** Whether the project menu is offered: always with a descriptor, and on the product's notice without one. */
	#chooser() {
		if (!this.#organizations.current) return false;
		return this.#ready || (this.#options.state === 'unavailable' && Boolean(this.#options.notice?.text));
	}

	#keep(menu) {
		this.#menus.push(menu);
		return menu.element;
	}

	#wide() {
		const organization = this.#organizations.current;
		const { fallback } = this.#options;
		if (!organization) return this.#ready ? [] : this.#still();
		const parts = [this.#organization()];
		if (this.#chooser()) parts.push(Location.#separator(), this.#project());
		else if (fallback.project) parts.push(Location.#separator(), Location.#text(fallback.project, 'project'));
		return parts;
	}

	#narrow() {
		const organization = this.#organizations.current;
		if (!organization) return this.#ready ? [] : this.#still();
		if (!this.#chooser() && !this.#organizations.several) return [Location.#text(this.#options.fallback.project ?? organization.name, this.#options.fallback.project ? 'project' : 'organization')];
		const { labels } = this.#options;
		const project = this.#name;
		const place = project ? `${organization.name} / ${project}` : organization.name;
		return [
			this.#keep(new NavigationMenu({
				label: Location.#place(project ?? organization.name),
				name: labels.text('location', { place }),
				part: 'location',
				class: 'bui-family-places',
				sections: this.#chooser() ? this.#sections() : [this.#organizations.section()]
			}))
		];
	}

	#sections() {
		const organizations = this.#organizations;
		return [organizations.several || this.#ready ? organizations.section() : null, ...this.#projects.sections()].filter(section => section && (section.items.length || section.lead?.some(Boolean)));
	}

	/** The organization: a menu when there are several, its name otherwise. */
	#organization() {
		const organization = this.#organizations.current;
		if (!this.#organizations.several) return Location.#text(organization.name, 'organization');
		return this.#keep(new NavigationMenu({
			label: Location.#place(organization.name),
			name: this.#options.labels.text('organization', { name: organization.name }),
			part: 'organization',
			class: 'bui-family-organization',
			sections: [this.#organizations.section()]
		}));
	}

	#project() {
		const { labels } = this.#options;
		const name = this.#name;
		return this.#keep(new NavigationMenu({
			label: Location.#place(name ?? labels.text('choose')),
			name: name ? labels.text('project', { name }) : labels.text('choose'),
			part: 'project',
			class: `bui-family-project${name ? '' : ' bui-family-choose'}`,
			sections: this.#projects.sections()
		}));
	}

	/** No organization while loading or unavailable: a project name as text, or a placeholder while loading. */
	#still() {
		const { state, fallback, labels } = this.#options;
		if (fallback.project) return [Location.#text(fallback.project, 'project')];
		if (state !== 'loading') return [];
		return [el('span', { class: 'bui-family-placeholder', 'aria-hidden': 'true' }), hidden(labels.text('loading'))];
	}

	static #place(name) {
		return el('span', { class: 'bui-family-place', text: name });
	}

	/** A name shown as text; `part` (`organization` or `project`) gives it that menu's width rules. */
	static #text(name, part) {
		return el('span', { class: `bui-family-static bui-family-${part}` }, [Location.#place(name)]);
	}

	static #separator() {
		return el('span', { class: 'bui-family-separator', 'aria-hidden': 'true', text: '/' });
	}
}
