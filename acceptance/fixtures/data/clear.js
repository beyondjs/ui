// The clear fixture's page, shared by the DOM and React consumers (0.36.0): a machine's Settings whose two rows
// of tabs hold more than a phone shows, under the family bar beside the Sidebar, with long sections an address
// points at (`#inbound`, `#outbound`, `#docker`). `?at=` chooses the current Settings tab (`network` by default),
// `?compact=1` gives the header its compact line with one action, `?merged=1` merges the Sidebar with the bar, as Conduict does on
// a phone, and `?nav=row` puts the product's sections in a ProductNav under the bar instead of the Sidebar.
const query = new URLSearchParams(location.search);

export const shape = {
	at: query.get('at') ?? 'network',
	compact: query.get('compact') === '1',
	merged: query.get('merged') === '1',
	nav: query.get('nav') ?? 'sidebar'
};

// Text long enough that each section runs past a window, so an address can bring any of them to the top
const long = (...sentences) => Array.from({ length: 4 }, () => sentences.join(' '));

export const words = {
	en: {
		product: 'Conduict',
		project: { label: 'Project', name: 'Storefront' },
		places: [['home', 'Home'], ['conversations', 'Conversations'], ['repositories', 'Repositories'], ['live', 'Live'], ['machines', 'Machines'], ['usage', 'Usage'], ['settings', 'Settings']],
		place: 'machines',
		machines: 'Machines',
		title: 'web-1',
		ready: 'Ready',
		restart: 'Restart',
		areas: [['overview', 'Overview'], ['conversations', 'Conversations'], ['files', 'Files'], ['live', 'Live'], ['settings', 'Settings']],
		area: 'settings',
		manage: 'Settings',
		settings: [['use', 'Who uses it'], ['repositories', 'Repository access'], ['capacity', 'Capacity'], ['shutdown', 'Automatic sleep'], ['network', 'Network'], ['secrets', 'Secrets']],
		parts: [
			['inbound', 'Inbound', long('An address opens one of this machine\'s ports to your browser.', 'Only you open it, and it closes when the machine sleeps.')],
			['outbound', 'Outbound', long('What this machine reaches on the internet follows its network level.', 'A destination it may not reach is refused and said here.')],
			['docker', 'Docker', long('Containers run as the machine\'s own user, with no daemon of the system.', 'Their connections leave through the same network level.')]
		]
	},
	es: {
		product: 'Conduict',
		project: { label: 'Proyecto', name: 'Storefront' },
		places: [['home', 'Inicio'], ['conversations', 'Conversaciones'], ['repositories', 'Repositorios'], ['live', 'Live'], ['machines', 'Máquinas'], ['usage', 'Uso'], ['settings', 'Ajustes']],
		place: 'machines',
		machines: 'Máquinas',
		title: 'web-1',
		ready: 'Lista',
		restart: 'Reiniciar',
		areas: [['overview', 'Resumen'], ['conversations', 'Conversaciones'], ['files', 'Archivos'], ['live', 'Live'], ['settings', 'Ajustes']],
		area: 'settings',
		manage: 'Ajustes',
		settings: [['use', 'Quién la usa'], ['repositories', 'Acceso a repositorios'], ['capacity', 'Capacidad'], ['shutdown', 'Suspensión automática'], ['network', 'Red'], ['secrets', 'Secretos']],
		parts: [
			['inbound', 'Entrante', long('Una dirección abre a tu navegador uno de los puertos de esta máquina.', 'Solo tú la abres, y se cierra cuando la máquina se suspende.')],
			['outbound', 'Saliente', long('Lo que esta máquina alcanza en internet sigue su nivel de red.', 'Un destino que no puede alcanzar se rechaza y se dice aquí.')],
			['docker', 'Docker', long('Los contenedores corren como el usuario de la máquina, sin un daemon del sistema.', 'Sus conexiones salen por el mismo nivel de red.')]
		]
	}
};

/** Entries as rows of tabs take them: `[key, label]` pairs with the one `current` key marked. */
export const entries = (pairs, current, href = key => `?at=${key}`) => pairs.map(([key, label]) => ({ label, href: href(key), current: key === current }));
