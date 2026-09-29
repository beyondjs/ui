/**
 * Fictional `beyond-family/1` descriptors as a product relay answers them: inside a project, outside
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
