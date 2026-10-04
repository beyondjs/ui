// The layout fixture's page, shared by the DOM and React consumers: `?template=`, `?width=`, `?aside=1`,
// `?arrival=1` and `?nav=tabs` (ProductNav instead of the Sidebar) choose what the page shows.
const query = new URLSearchParams(location.search);

export const shape = {
	template: query.get('template') ?? 'detail',
	width: query.get('width') ?? 'standard',
	aside: query.get('aside') === '1',
	arrival: query.get('arrival') === '1',
	nav: query.get('nav') ?? 'sidebar'
};

export const words = {
	title: 'Storefront redesign',
	facts: 'Compute Engine · us-east4 · created 3 Oct',
	description:
		'Every repository this environment holds is cloned once and shared by its conversations, each on a branch of its own, so two conversations never edit the same files. A copy keeps its manual changes; nothing here pushes anywhere, and a removed repository keeps its worktrees until you delete them yourself.',
	rows: ['acme/web', 'acme/docs', 'acme/api'],
	facts2: ['Profile: standard', 'Disk: 100 GB', 'Cost: about $0.21 per hour']
};

export const groups = [
	{ heading: null, items: [{ label: 'Overview', href: '#/overview' }, { label: 'Environments', href: '#/environments', current: true }, { label: 'Costs', href: '#/costs' }] }
];
