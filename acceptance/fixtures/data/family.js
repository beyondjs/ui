// Fictional `beyond-family/1` descriptors for the family bar page, selected by `?family=`:
// `inside` (a project), `outside` (an organization), `loading` (null), `unavailable`, and `long` and
// `nandu`, whose long names share the location's width (`nandu` is the Projects adoption's case).
// Projects is on the page's own origin so `onnavigate` takes its links over.
const projects = `${location.origin}/projects/`;

const inside = {
	protocol: 'beyond-family/1',
	person: { id: 'acc_1', name: 'Ana Pérez', email: 'ana@example.test', locale: 'es' },
	organizations: [
		{ id: 'org_north', name: 'Northwind Studio', role: 'owner', current: true },
		{ id: 'org_south', name: 'Southwind', role: 'developer', current: false }
	],
	organization: { id: 'org_north', name: 'Northwind Studio', role: 'owner' },
	projects: [
		{ id: 'prj_shop', name: 'Storefront redesign', current: true },
		{ id: 'prj_docs', name: 'Handbook', current: false }
	],
	project: { id: 'prj_shop', name: 'Storefront redesign' },
	products: [
		{ product: 'projects', url: `${projects}?project=prj_shop`, available: true },
		{ product: 'workspace', url: 'https://workspace.example.test/?project=prj_shop', available: false, reason: 'NOT_ADMITTED' },
		{ product: 'delegate', url: 'https://delegate.example.test/?project=prj_shop', available: true, mapped: 1 },
		{ product: 'cdn', available: false, reason: 'UNCONFIGURED' },
		{ product: 'snapshots', url: 'https://snapshots.example.test/?project=prj_shop', available: true },
		{ product: 'conduict', url: 'https://conduict.example.test/?project=prj_shop', available: true }
	],
	links: { home: projects, account: 'https://accounts.example.test/account', members: 'https://accounts.example.test/members', docs: 'https://docs.example.test/' }
};

const outside = { ...inside, project: null, products: inside.products.filter(item => item.product !== 'snapshots').map(item => ({ ...item, url: item.url?.replace(/\?project=prj_shop$/, '') })) };

/** The same place under other names: long organization and project names share the location's width. */
function named(organization, project) {
	return {
		...inside,
		organizations: [{ ...inside.organizations[0], name: organization }, inside.organizations[1]],
		organization: { ...inside.organization, name: organization },
		projects: [{ ...inside.projects[0], name: project }, inside.projects[1]],
		project: { ...inside.project, name: project }
	};
}

const long = named('Northwind Creative Studio and Partners', 'Storefront redesign for the spring catalogue');
const nandu = named('Estudio Ñandú', 'Rediseño de la tienda en línea y del catálogo de primavera');

// What the product knows itself, selected by `?fallback=`: the names and addresses (default), or
// `bare`, the person and addresses without an organization or project (a product outside one).
const addresses = { home: projects, account: 'https://accounts.example.test/account', docs: 'https://docs.example.test/' };
const fallbacks = {
	names: { person: 'Ana Pérez', organization: 'Northwind Studio', project: 'Storefront redesign', links: addresses },
	bare: { person: 'Ana Pérez', links: addresses }
};

export const fallback = { ...(fallbacks[new URLSearchParams(location.search).get('fallback')] ?? fallbacks.names) };
fallback.links = { ...fallback.links, projects: `${location.origin}${location.pathname}#/projects` };

/** The product's sections, shown with `?sidebar=<cut>` (the width in px from which the sidebar is permanent). */
export const sidebar = new URLSearchParams(location.search).get('sidebar');
export const sections = (words = ['Projects', 'Project', 'Requests', 'Versions', 'Environments', 'Services', 'Consumption', 'Settings']) => [
	{ items: [{ label: words[0], href: '#/projects' }] },
	{ heading: words[1], items: words.slice(2).map((label, index) => ({ label, href: `#/${index}`, current: index === 0, meta: index === 0 ? 3 : null })) }
];

// 0.4.0 shapes: rows annotated with `here` (Projects' `mapped` and `url`, the state the product
// wrote), a row only Delegate has, organizations with the product's own arrival, Accounts' pages.
const manage = {
	account: 'https://accounts.example.test/account',
	organizations: 'https://accounts.example.test/organizations',
	create: 'https://accounts.example.test/organizations?view=create',
	members: 'https://accounts.example.test/organizations/org_north?view=members',
	settings: 'https://accounts.example.test/organizations/org_north?view=settings'
};
const here = id => `${location.origin}${location.pathname}?family=annotated&project=${id}`;
const annotated = {
	...inside,
	organizations: [{ ...inside.organizations[0], url: `${location.origin}${location.pathname}?family=annotated&organization=org_north` }, inside.organizations[1]],
	projects: [
		{ id: 'prj_shop', name: 'Storefront redesign', current: true, here: { mapped: 1, url: here('prj_shop') } },
		{ id: 'prj_docs', name: 'Handbook', here: { mapped: 0, url: here('prj_docs') } },
		{ id: 'prj_ads', name: 'Advertising campaign for the spring catalogue', here: { mapped: 1, state: 'denied', url: here('prj_ads') } },
		{ id: 'dlg_nora', name: 'Nora sample', here: { state: 'only', url: here('dlg_nora') } }
	],
	// Projects' GitHub section of the organization in view (0.7.4, PRJ-14), complete as given
	links: { ...inside.links, manage, github: 'https://projects.example.test/?organization=org_north&view=github' }
};
const names = ['Atlas', 'Beacon', 'Comet', 'Delta', 'Échelle', 'Forge', 'Garnet', 'Harbor', 'Iris', 'Juniper', 'Kestrel', 'Lumen'];
const many = { ...annotated, project: null, products: outside.products, projects: names.map((name, index) => ({ id: `prj_${index}`, name, here: { mapped: index % 3 ? 1 : 0, url: here(`prj_${index}`) } })) };

export const descriptors = { inside, outside, loading: null, unavailable: { unavailable: true }, long, nandu, annotated, many };

/** The product the bar is in, named by `?product=` (`delegate` by default), to measure other product names. */
export const product = new URLSearchParams(location.search).get('product') ?? 'delegate';

/** The descriptor the address asks for (`inside` by default). */
export function chosen() {
	const name = new URLSearchParams(location.search).get('family') ?? 'inside';
	return name in descriptors ? descriptors[name] : inside;
}
