/**
 * Fictional `beyond-family/1` descriptors as a product relay answers them. `inside`, `outside` and `alone` are
 * the 0.3.x shape (no `here`, organization `url` or `manage`): inside a project, outside
 * one, and with a person who has no organization. Addresses are on example hosts except Projects,
 * which is on the test page's own origin so `onnavigate` can take over its links.
 */
const projects = 'http://localhost/projects/';

export const inside = {
	protocol: 'beyond-family/1',
	person: { id: 'acc_1', name: 'Ana Pérez', email: 'ana@example.test', locale: 'es' },
	organizations: [
		{ id: 'org_north', name: 'Northwind', role: 'owner', current: true },
		{ id: 'org_south', name: 'Southwind', role: 'developer', current: false }
	],
	organization: { id: 'org_north', name: 'Northwind', role: 'owner' },
	projects: [
		{ id: 'prj_shop', name: 'Storefront', current: true },
		{ id: 'prj_docs', name: 'Handbook', current: false }
	],
	project: { id: 'prj_shop', name: 'Storefront' },
	products: [
		{ product: 'projects', url: `${projects}?project=prj_shop`, available: true },
		{ product: 'workspace', url: 'https://workspace.example.test/?project=prj_shop', available: false, reason: 'NOT_ADMITTED' },
		{ product: 'delegate', url: 'https://delegate.example.test/?project=prj_shop', available: true, mapped: 1 },
		{ product: 'cdn', available: false, reason: 'UNCONFIGURED' },
		{ product: 'snapshots', url: 'https://snapshots.example.test/?project=prj_shop', available: false, reason: 'ARCHIVED' }
	],
	links: {
		home: projects,
		account: 'https://accounts.example.test/account',
		members: 'https://accounts.example.test/v1/organizations/manage?view=members&organization=org_north',
		docs: 'https://docs.example.test/'
	}
};

export const outside = {
	...inside,
	projects: inside.projects.map(project => ({ ...project, current: false })),
	project: null,
	products: [
		{ product: 'projects', url: `${projects}?organization=org_north`, available: true },
		{ product: 'delegate', url: 'https://delegate.example.test/', available: true },
		{ product: 'cdn', available: false, reason: 'UNCONFIGURED' },
		{ product: 'accounts', url: 'https://accounts.example.test/', available: true }
	],
	links: { home: projects, account: 'https://accounts.example.test/account' }
};

export const alone = {
	protocol: 'beyond-family/1',
	person: { id: 'acc_2', name: 'Bruno', email: 'bruno@example.test', locale: 'en' },
	organizations: [],
	organization: null,
	projects: [],
	project: null,
	products: [],
	links: { home: projects }
};

/** Spanish copy as a product passes it. */
export const spanish = {
	home: 'Inicio de Beyond',
	product: 'Producto: {name}. Cambiar de producto',
	organization: 'Organización: {name}. Cambiar de organización',
	project: 'Proyecto: {name}. Cambiar de proyecto',
	NOT_ADMITTED: 'Aún no está abierto para ti',
	signout: 'Cerrar sesión'
};

/**
 * A 0.4.0 descriptor as Delegate relays it inside a project: rows annotated with `here` (Projects'
 * `mapped` and `url`, and the state the product wrote), a row only Delegate has, organizations with
 * the product's own arrival for one of them, and Accounts' management addresses.
 */
export const annotated = {
	...inside,
	organizations: [
		{ id: 'org_north', name: 'Northwind', role: 'owner', current: true, url: 'https://delegate.example.test/?organization=org_north' },
		{ id: 'org_south', name: 'Southwind', role: 'developer', current: false }
	],
	projects: [
		{ id: 'prj_shop', name: 'Storefront', current: true, here: { mapped: 1, url: 'https://delegate.example.test/?project=prj_shop' } },
		{ id: 'prj_docs', name: 'Handbook', here: { mapped: 0, url: 'https://delegate.example.test/?project=prj_docs' } },
		{ id: 'prj_ads', name: 'Ads', here: { mapped: 1, state: 'denied', url: 'https://delegate.example.test/?project=prj_ads' } },
		{ id: 'prj_zeta', name: 'Zeta', here: { mapped: 2 } },
		{ id: 'prj_bare', name: 'Ármadillo' },
		{ id: 'dlg_nora', name: 'Nora sample', here: { state: 'only', url: 'https://delegate.example.test/?project=dlg_nora' } }
	],
	links: {
		...inside.links,
		manage: {
			account: 'https://accounts.example.test/account',
			organizations: 'https://accounts.example.test/organizations',
			create: 'https://accounts.example.test/organizations?view=create',
			members: 'https://accounts.example.test/organizations/org_north?view=members',
			invitations: 'https://accounts.example.test/organizations/org_north?view=invitations',
			settings: 'https://accounts.example.test/organizations/org_north?view=settings'
		}
	}
};

/** The same organization outside a project, with twelve projects: enough for the menu's search. */
export const many = {
	...annotated,
	project: null,
	projects: ['Atlas', 'Beacon', 'Comet', 'Delta', 'Échelle', 'Forge', 'Garnet', 'Harbor', 'Iris', 'Juniper', 'Kestrel', 'Lumen'].map((name, index) => ({ id: `prj_${index}`, name, here: { mapped: index % 3 ? 1 : 0 } })),
	products: outside.products
};

/** A person with one organization, which they do not administer. */
export const member = {
	...annotated,
	organizations: [{ id: 'org_north', name: 'Northwind', role: 'member', current: true }],
	organization: { id: 'org_north', name: 'Northwind', role: 'member' },
	links: { ...annotated.links, manage: { account: annotated.links.manage.account, organizations: annotated.links.manage.organizations, create: annotated.links.manage.create, members: annotated.links.manage.members } }
};

/** A person with no organization, with Accounts' addresses. */
export const nobody = { ...alone, links: { home: alone.links.home, manage: { account: 'https://accounts.example.test/account', organizations: 'https://accounts.example.test/organizations', create: 'https://accounts.example.test/organizations?view=create' } } };

/** The organizations a product reads from Accounts, for the bar while the descriptor is unavailable. */
export const standing = [
	{ id: 'org_north', name: 'Northwind', role: 'owner', url: 'https://cdn.example.test/?organization=org_north', current: true },
	{ id: 'org_south', name: 'Southwind', role: 'admin', url: 'https://cdn.example.test/?organization=org_south', current: false }
];

/** 0.5.0: Projects names Accounts' `/leave` (Q09), the absolute address with no query. */
export const leaving = { ...annotated, links: { ...annotated.links, leave: 'https://accounts.example.test/leave' } };

/** The same place under long, user-written names, which the location cuts to its width (D44). */
export const lengthy = {
	...inside,
	organizations: [{ ...inside.organizations[0], name: 'Northwind Creative Studio and Partners' }, inside.organizations[1]],
	organization: { ...inside.organization, name: 'Northwind Creative Studio and Partners' },
	projects: [{ ...inside.projects[0], name: 'Storefront redesign for the spring catalogue' }, inside.projects[1]],
	project: { ...inside.project, name: 'Storefront redesign for the spring catalogue' }
};
