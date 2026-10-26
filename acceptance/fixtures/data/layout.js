// The layout fixture's page, shared by the DOM and React consumers: `?template=`, `?width=`, `?aside=1`,
// `?raised=1` (the aside as a resource page's raised panel, 0.30.0), `?arrival=1` and `?nav=tabs` (ProductNav instead of the Sidebar) choose what the page shows.
// Since 0.38.0 (D189) `?pinned=1` asks for the side panel pinned beside the main column, `?long=1` makes the page
// Start an application: a long main column of components and the page's action first in the side panel, and
// `?compact=1` gives the header its compact line.
const query = new URLSearchParams(location.search);

export const shape = {
	template: query.get('template') ?? 'detail',
	width: query.get('width') ?? 'standard',
	aside: query.get('aside') === '1' || query.get('raised') === '1',
	raised: query.get('raised') === '1',
	pinned: query.get('pinned') === '1',
	long: query.get('long') === '1',
	compact: query.get('compact') === '1',
	arrival: query.get('arrival') === '1',
	nav: query.get('nav') ?? 'sidebar'
};

export const words = {
	title: 'Storefront redesign',
	facts: 'Compute Engine · us-east4 · created 3 Oct',
	description:
		'Every repository this environment holds is cloned once and shared by its conversations, each on a branch of its own, so two conversations never edit the same files. A copy keeps its manual changes; nothing here pushes anywhere, and a removed repository keeps its worktrees until you delete them yourself.',
	kind: 'Standard',
	branch: 'main',
	rows: ['acme/web', 'acme/docs', 'acme/api'],
	nested: ['acme/api · main', 'acme/api · feature/cart'],
	columns: ['Repository', 'Branch', 'Head', 'Changes', 'Last turn', 'Cloned from', 'Access', 'Worktrees', 'Drift'].map(name => `${name} of the working copy`),
	facts2: ['Profile: standard', 'Disk: 100 GB', 'Cost: about $0.21 per hour'],
	copy: { machine: 'web', meta: ['Ready', 'main', '2 changes'], actions: ['Open files', 'Fetch'] },
	// What a copy runs when it starts (0.38.0): sixteen components, each with its command and its port
	components: ['web', 'api', 'worker', 'scheduler', 'mailer', 'search', 'billing', 'auth', 'storage', 'gateway', 'admin', 'reports', 'notifications', 'media', 'exports', 'docs'].map((name, index) => ({ name, meta: [`npm run dev:${name}`, `port ${3000 + index}`] })),
	start: {
		en: { title: 'Application', text: "Runs the copy's 16 components as they are now on web, with its 2 uncommitted changes.", action: 'Start application', components: 'Components', description: 'What the copy runs when it starts.' },
		es: { title: 'Aplicación', text: 'Ejecuta los 16 componentes de la copia tal como están ahora en web, con sus 2 cambios sin confirmar.', action: 'Iniciar aplicación', components: 'Componentes', description: 'Lo que la copia ejecuta al iniciarse.' }
	}
};

export const groups = [
	{ heading: null, items: [{ label: 'Overview', href: '#/overview' }, { label: 'Environments', href: '#/environments', current: true }, { label: 'Costs', href: '#/costs' }] }
];
