import { Component } from '../core/component.js';
import { el } from '../core/element.js';
import { hidden } from '../feedback.js';
import { NavigationMenu, entry } from './menu.js';

/**
 * Where the person is in the family bar: the organization menu, then `/` and the project menu.
 *
 * Both forms are built and CSS shows one: wide, the two menus; below about 720 px one "location"
 * menu whose button shows the project name (or the organization's) and whose panel lists both
 * sections. Wide, the two names share the width in equal parts up to each whole name (the
 * organization capped narrower), so neither collapses while the other is shown whole. There is no project menu outside a project. While the descriptor loads, placeholders
 * (or the names the product passed as `fallback`) hold the place without menus; when it is
 * unavailable, the fallback names are shown as text so the bar still says where you are.
 */
export class Location extends Component {
	#element;
	#menus = [];
	#options;

	/**
	 * @param {object} options
	 * @param {'loading'|'unavailable'|'ready'} options.state
	 * @param {object|null} options.descriptor the descriptor when ready
	 * @param {{organization?: string|null, project?: string|null}} options.fallback names the product knows itself
	 * @param {import('./places.js').Places} options.places
	 * @param {import('../core/labels.js').Labels} options.labels
	 */
	constructor(options) {
		super();
		this.#options = options;
		const ready = options.state === 'ready';
		this.#element = el('div', { class: 'bui-family-location' }, [
			el('div', { class: 'bui-family-wide' }, ready ? this.#wide() : this.#still()),
			el('div', { class: 'bui-family-narrow' }, ready ? this.#narrow() : this.#still(true))
		]);
	}

	get element() {
		return this.#element;
	}

	/** Whether neither form has anything to show (no organization, project or placeholder). */
	get blank() {
		return [...this.#element.children].every(form => !form.childElementCount);
	}

	/** The menus built, wide and narrow. */
	get menus() {
		return this.#menus;
	}

	destroy() {
		for (const menu of this.#menus) menu.destroy();
		super.destroy();
	}

	#keep(menu) {
		this.#menus.push(menu);
		return menu.element;
	}

	#wide() {
		const { descriptor, labels } = this.#options;
		const { organization, project } = descriptor;
		if (!organization) return [];
		const parts = [
			this.#keep(new NavigationMenu({
				label: Location.#place(organization.name),
				name: labels.text('organization', { name: organization.name }),
				part: 'organization',
				class: 'bui-family-organization',
				sections: [this.#organizations()]
			}))
		];
		if (project)
			parts.push(Location.#separator(), this.#keep(new NavigationMenu({
				label: Location.#place(project.name),
				name: labels.text('project', { name: project.name }),
				part: 'project',
				class: 'bui-family-project',
				sections: [this.#projects()]
			})));
		return parts;
	}

	#narrow() {
		const { descriptor, labels } = this.#options;
		const { organization, project } = descriptor;
		if (!organization) return [];
		const place = project ? `${organization.name} / ${project.name}` : organization.name;
		return [
			this.#keep(new NavigationMenu({
				label: Location.#place(project?.name ?? organization.name),
				name: labels.text('location', { place }),
				part: 'location',
				class: 'bui-family-places',
				sections: [this.#organizations(), project ? this.#projects() : null]
			}))
		];
	}

	#organizations() {
		const { descriptor, places, labels } = this.#options;
		const current = descriptor.organization?.id;
		return {
			heading: labels.text('organizations'),
			items: (descriptor.organizations ?? []).map(item =>
				entry({ label: item.name, meta: item.role ? labels.text('role', { role: item.role }) : null, href: places.organization(item.id), current: item.id === current ? 'true' : null })
			)
		};
	}

	#projects() {
		const { descriptor, places, labels } = this.#options;
		const current = descriptor.project?.id;
		const items = (descriptor.projects ?? []).map(item => entry({ label: item.name, href: places.project(item.id), current: item.id === current ? 'true' : null }));
		items.push(entry({ label: labels.text('all'), href: places.organization(descriptor.organization.id), class: 'bui-navmenu-action' }));
		return { heading: labels.text('projects', { organization: descriptor.organization.name }), items };
	}

	/** Loading or unavailable: the fallback names as text, or placeholders while loading. */
	#still(narrow = false) {
		const { state, fallback, labels } = this.#options;
		const { organization = null, project = null } = fallback;
		if (narrow && (organization || project)) return [Location.#text(project ?? organization, project ? 'project' : 'organization')];
		const parts = [];
		if (organization) parts.push(Location.#text(organization, 'organization'));
		else if (state === 'loading') parts.push(el('span', { class: 'bui-family-placeholder', 'aria-hidden': 'true' }), hidden(labels.text('loading')));
		if (project && !narrow) parts.push(...(parts.length ? [Location.#separator()] : []), Location.#text(project, 'project'));
		return parts;
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
