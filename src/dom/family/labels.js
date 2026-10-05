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
	UNCONFIGURED: 'Not offered here',
	NOT_ADMITTED: 'Not open to you yet',
	ARCHIVED: 'Project archived',
	unavailable: 'Not available',
	organization: 'Organization: {name}. Change organization',
	organizations: 'Organizations',
	single: 'Organization',
	role: ({ role }) => roles[role] ?? role ?? '',
	beyond: 'Opens in Beyond Projects',
	project: 'Project: {name}. Change project',
	choose: 'Choose a project',
	projects: 'Projects of {organization}',
	all: 'All projects of {organization}',
	none: '{organization} has no projects yet',
	search: 'Search projects',
	nomatch: 'No projects match "{query}"',
	find: 'Search all projects of {organization}',
	unset: 'Not set up in {product}',
	denied: 'No access in {product}',
	only: 'Only in {product}',
	location: 'Location: {place}. Change organization or project',
	loading: 'Loading where you are',
	docs: 'Docs',
	account: 'Account: {name}',
	anonymous: 'Account',
	access: 'Account and sign-in',
	mine: 'Your organizations',
	create: 'Create an organization',
	group: '{organization} · {role}',
	team: 'Members and invitations',
	settings: 'Organization settings',
	yours: 'Your account',
	members: 'Members of this organization',
	preferences: 'Language and appearance',
	signout: 'Sign out of Beyond',
	leaving: 'Signing out…'
};

/** The Spanish names of the areas and roles, which `spanish` maps by key. */
const translated = {
	areas: {
		projects: 'Proyectos de esta organización',
		workspace: 'Entornos de desarrollo',
		delegate: 'Proyectos delegados',
		cdn: 'Aplicaciones',
		snapshots: 'Capturas',
		conduict: 'Entornos y conversaciones',
		accounts: 'Miembros e invitaciones'
	},
	roles: { owner: 'Propietario', admin: 'Administrador', developer: 'Desarrollo', viewer: 'Lectura', member: 'Miembro' }
};

/** The family bar's copy in Spanish (0.7.2; `FamilyBar.labels.es`), the set the component catalog carried before. */
export const spanish = {
	header: 'Beyond',
	context: 'Dónde estás',
	open: 'Abrir navegación',
	close: 'Cerrar navegación',
	home: 'Inicio de Beyond',
	product: 'Producto: {name}. Cambiar de producto',
	products: 'Productos',
	entries: 'Este proyecto en cada producto',
	overview: 'Resumen del proyecto',
	entry: 'Este proyecto en {product}',
	area: ({ product }) => translated.areas[product] ?? '',
	back: 'Tus organizaciones y proyectos',
	UNCONFIGURED: 'No se ofrece aquí',
	NOT_ADMITTED: 'Aún no está abierto para ti',
	ARCHIVED: 'Proyecto archivado',
	unavailable: 'No disponible',
	organization: 'Organización: {name}. Cambiar de organización',
	organizations: 'Organizaciones',
	single: 'Organización',
	role: ({ role }) => translated.roles[role] ?? role ?? '',
	beyond: 'Se abre en Beyond Projects',
	project: 'Proyecto: {name}. Cambiar de proyecto',
	choose: 'Elegir un proyecto',
	projects: 'Proyectos de {organization}',
	all: 'Todos los proyectos de {organization}',
	none: '{organization} todavía no tiene proyectos',
	search: 'Buscar proyectos',
	nomatch: 'Ningún proyecto coincide con «{query}»',
	find: 'Buscar en todos los proyectos de {organization}',
	unset: 'Sin configurar en {product}',
	denied: 'Sin acceso en {product}',
	only: 'Solo en {product}',
	location: 'Ubicación: {place}. Cambiar de organización o proyecto',
	loading: 'Cargando dónde estás',
	docs: 'Documentación',
	account: 'Cuenta: {name}',
	anonymous: 'Cuenta',
	access: 'Cuenta y acceso',
	mine: 'Tus organizaciones',
	create: 'Crear una organización',
	group: '{organization} · {role}',
	team: 'Miembros e invitaciones',
	settings: 'Ajustes de la organización',
	yours: 'Tu cuenta',
	members: 'Miembros de esta organización',
	preferences: 'Idioma y apariencia',
	signout: 'Cerrar sesión en Beyond',
	leaving: 'Cerrando sesión…'
};

/**
 * Display names of the family's products, never translated. Public as `productNames` (since 0.4.1),
 * so a product names another one (a notice's product, a link) the way the bar does instead of keeping
 * its own copy; a product passes the bar's `products` option to add or rename one.
 */
export const names = Object.freeze({
	projects: 'Projects',
	workspace: 'Workspace',
	delegate: 'Delegate',
	cdn: 'CDN',
	snapshots: 'Snapshots',
	conduict: 'Conduict',
	accounts: 'Accounts',
	desktop: 'Desktop',
	docs: 'Docs'
});
