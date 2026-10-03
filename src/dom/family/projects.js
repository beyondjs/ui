import { el, content } from '../core/element.js';
import { entry } from './menu.js';
import { ProjectSearch } from './search.js';

/**
 * The sections of the bar's project menu: the standard way to choose a project in every product,
 * inside a project and outside one (Q22, option a), from Projects' one catalog.
 *
 * In order: the heading "Projects of {organization}"; a search field when there are more than
 * `threshold` rows; the product's `notice`, once; the rows, the current project first and then by
 * the language's collation; the rows only this product has, under "Only in {product}"; then "Project
 * overview" (inside a project) and "All projects of {organization}" (the product's own projects page).
 *
 * A row's state comes from `here`, which the relaying product annotates: `used` shows no mark,
 * `unset` "Not set up in {product}", `denied` "No access in {product}" and `only` groups the row.
 * Without `here.state`, `here.mapped` decides (more than 0 is `used`, 0 is `unset`); without `here`
 * there is no mark. The state is text at the row's end and part of its name; the row still links to
 * the product's arrival for that project, which explains the state and offers the step.
 */
export class ProjectList {
	/** More rows than fit without scrolling at 390 × 664 px: the menu then offers a search field. */
	static threshold = 8;

	#options;

	/**
	 * @param {object} options
	 * @param {{id?: string, name: string}} options.organization the organization in view
	 * @param {Array<{id: string, name: string, here?: object}>} options.projects
	 * @param {{id: string, name: string}|null} options.project the project in view
	 * @param {string} options.product the product's display name
	 * @param {{text: string, href?: string, action?: {label: string, href?: string, run?: () => void}}|null} options.notice
	 * @param {import('./places.js').Places} options.places
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {boolean} [options.stale] the descriptor did not answer: only the project in view, as text
	 */
	constructor(options) {
		this.#options = options;
	}

	/** The state of a row from its `here` annotation: `used`, `unset`, `denied`, `only`, another product state, or null. */
	static state(here) {
		if (!here || typeof here !== 'object') return null;
		if (typeof here.state === 'string' && here.state) return here.state;
		if (typeof here.mapped === 'number') return here.mapped > 0 ? 'used' : 'unset';
		return null;
	}

	/** New sections for one menu (each call builds its own nodes and its own search). */
	sections() {
		const { organization, project, labels, places, stale } = this.#options;
		const heading = organization?.name ? labels.text('projects', { organization: organization.name }) : null;
		const catalog = organization?.id || places.links.projects ? places.catalog(organization?.id) : null;
		const all = catalog && organization?.name ? entry({ label: labels.text('all', { organization: organization.name }), href: catalog, class: 'bui-navmenu-action' }) : null;
		const notice = this.#notice();
		if (stale) return [{ heading, lead: [notice], items: project ? [entry({ label: project.name, current: 'true' })] : [] }, all ? { items: [all], class: 'bui-navmenu-more' } : null];
		const rows = this.#rows();
		const listed = rows.filter(row => row.state !== 'only');
		const only = rows.filter(row => row.state === 'only');
		const search = rows.length > ProjectList.threshold ? new ProjectSearch({ rows, catalog, organization: organization?.name ?? '', labels }) : null;
		const none = rows.length ? null : el('li', { class: 'bui-navmenu-none' }, [el('span', { class: 'bui-navmenu-label', text: labels.text('none', { organization: organization?.name ?? '' }) })]);
		const overview = project && places.overview ? entry({ label: labels.text('overview'), href: places.overview }) : null;
		return [
			{ heading, lead: [search?.element, notice], items: [...listed.map(row => row.node), none, search?.none] },
			only.length ? { heading: labels.text('only', { product: this.#options.product }), items: only.map(row => row.node), class: 'bui-family-only' } : null,
			overview || all ? { items: [overview, all], class: 'bui-navmenu-more' } : null
		];
	}

	/** The rows as list items with their name and state, the current project first, then by collation. */
	#rows() {
		const { projects = [], project, places, labels, product } = this.#options;
		const collator = new Intl.Collator(globalThis.document?.documentElement?.lang || undefined, { sensitivity: 'base' });
		const current = project?.id ?? null;
		const sorted = [...projects].filter(item => item && item.id && item.name).sort((a, b) => Number(b.id === current) - Number(a.id === current) || collator.compare(a.name, b.name));
		return sorted.map(item => {
			const state = ProjectList.state(item.here);
			const words = state === 'unset' || state === 'denied' ? labels.text(state, { product }) : null;
			const node = el('li', {}, [entry({ label: item.name, href: places.project(item.id, item.here), current: item.id === current ? 'true' : null, state: words })]);
			return { node, text: item.name, state };
		});
	}

	/** The product's one line at the top of the menu, with its action, or null. */
	#notice() {
		const notice = this.#options.notice;
		if (!notice?.text) return null;
		const text = notice.href ? el('a', { href: notice.href }, [content(notice.text)]) : el('span', {}, [content(notice.text)]);
		const action = notice.action?.label ? ProjectList.#action(notice.action) : null;
		return el('div', { class: 'bui-navmenu-notice', role: 'note' }, [text, action]);
	}

	static #action({ label, href = null, run = null }) {
		if (href) return el('a', { class: 'bui-navmenu-notice-action', href }, [content(label)]);
		return el('button', { type: 'button', class: 'bui-link-button bui-navmenu-notice-action', onclick: () => run?.() }, [content(label)]);
	}
}
