/**
 * English defaults of the family bar's copy; consumers replace any entry through `labels`.
 *
 * Product names are never translated: they come from the bar's `products` option. Everything else
 * here is copy a product passes in its own language (the component catalog carries a Spanish set).
 * `area` and `role` are functions of `{ product }` and `{ role }` so a language maps every value.
 */
const areas = {
	projects: 'Projects of this organization',
	workspace: 'Development environments',
	delegate: 'Delegated projects',
	cdn: 'Applications',
	snapshots: 'Captures',
	conduict: 'Environments and conversations',
	accounts: 'Members and invitations'
};

const roles = { owner: 'Owner', admin: 'Administrator', developer: 'Developer', viewer: 'Viewer', member: 'Member' };

export const defaults = {
	header: 'Beyond',
	context: 'Where you are',
	open: 'Open navigation',
	close: 'Close navigation',
	home: 'Beyond home',
	product: 'Product: {name}. Change product',
	products: 'Products',
	entries: 'This project in each product',
	overview: 'Project overview',
	entry: 'This project in {product}',
	area: ({ product }) => areas[product] ?? '',
	back: 'Your organizations and projects',
	UNCONFIGURED: 'Not set up here',
	NOT_ADMITTED: 'Not open to you yet',
	ARCHIVED: 'Project archived',
	unavailable: 'Not available',
	organization: 'Organization: {name}. Change organization',
	organizations: 'Organizations',
	role: ({ role }) => roles[role] ?? role ?? '',
	project: 'Project: {name}. Change project',
	projects: 'Projects of {organization}',
	all: 'All projects',
	location: 'Location: {place}. Change organization or project',
	loading: 'Loading where you are',
	docs: 'Docs',
	account: 'Account: {name}',
	anonymous: 'Account',
	yours: 'Your account',
	members: 'Members of this organization',
	signout: 'Sign out'
};

/** Display names of the family's products; a product passes `products` to add or rename one. */
export const names = {
	projects: 'Projects',
	workspace: 'Workspace',
	delegate: 'Delegate',
	cdn: 'CDN',
	snapshots: 'Snapshots',
	conduict: 'Conduict',
	accounts: 'Accounts',
	desktop: 'Desktop',
	docs: 'Docs'
};
