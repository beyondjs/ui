// Fictional `beyond-family/1` descriptors for the family bar page, selected by `?family=`:
// `inside` (a project), `outside` (an organization), `loading` (null) and `unavailable`.
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

export const fallback = { person: 'Ana Pérez', organization: 'Northwind Studio', project: 'Storefront redesign' };

export const descriptors = { inside, outside, loading: null, unavailable: { unavailable: true } };

/** The descriptor the address asks for (`inside` by default). */
export function chosen() {
	const name = new URLSearchParams(location.search).get('family') ?? 'inside';
	return name in descriptors ? descriptors[name] : inside;
}
