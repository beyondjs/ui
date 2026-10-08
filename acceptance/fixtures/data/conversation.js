// The conversation fixture's data, shared by the DOM page (English) and the React pages (Spanish): a
// project's sections and conversations as sidebar entries, a search of them (`?search=fail` refuses,
// `?search=slow` never answers within its bound), activity rows, a plan and the words of each language.
const query = new URLSearchParams(location.search);

export const shape = {
	search: query.get('search') ?? 'ready',
	panel: query.get('panel') !== 'closed',
	running: query.get('running') !== '0',
	// `element`: the page's element placed by the product itself, as Conduict does, instead of mount()
	place: query.get('place') ?? 'mount'
};

export const words = {
	en: { product: 'Conduict', section: 'Conversations', project: 'Project', overview: 'Overview', environments: 'Environments', agents: 'Agents', costs: 'Costs', needs: 'Needs you', pinned: 'Pinned', recent: 'Recent', all: 'All conversations', action: 'New conversation', search: 'Search conversations', title: 'Fix the checkout redirect', status: 'Waiting for you', facts: 'Claude Code · web · acme/web', details: 'Details', panel: 'Conversation details', message: 'Message to Claude Code', placeholder: 'Queue a message for Claude Code…', queue: 'Queue', start: 'Start and send', wait: 'Send without starting', interrupt: 'Interrupt', blocked: 'Only an owner or admin can start web.', environment: 'Environment', engine: 'AI engine', repository: 'Repository', read: count => `Read ${count} files`, plan: 'Plan', working: 'Failed', mark: 'Needs you', state: 'web is stopped. Sending starts it: about $0.21 an hour.' },
	es: { product: 'Conduict', section: 'Conversaciones', project: 'Proyecto', overview: 'Resumen', environments: 'Entornos', agents: 'Agentes', costs: 'Costos', needs: 'Te espera', pinned: 'Fijadas', recent: 'Recientes', all: 'Todas las conversaciones', action: 'Nueva conversación', search: 'Buscar conversaciones', title: 'Corregir la redirección del pago', status: 'Te espera', facts: 'Claude Code · web · acme/web', details: 'Detalles', panel: 'Detalles de la conversación', message: 'Mensaje para Claude Code', placeholder: 'Poner en cola un mensaje para Claude Code…', queue: 'Poner en cola', start: 'Iniciar y enviar', wait: 'Enviar sin iniciar', interrupt: 'Interrumpir', blocked: 'Solo un propietario o administrador puede iniciar web.', environment: 'Entorno', engine: 'Motor de IA', repository: 'Repositorio', read: count => `Leyó ${count} archivos`, plan: 'Plan', working: 'Falló', mark: 'Te espera', state: 'web está detenido. Enviar lo inicia: unos 0,21 $ por hora.' }
};

const titles = ['Fix the checkout redirect', 'Upgrade the build to the latest toolchain and explain every warning it prints along the way', 'Tidy the styles', 'Add product filters', 'Write the release notes'];

/** The sidebar's groups for a language: sections, then Needs you, Pinned and Recent. */
export function groups(copy, current = 'c1') {
	const entry = (key, index, mark = null) => ({ key, label: titles[index], href: `#/conversations/${key}`, current: key === current, mark });
	return [
		{ items: [copy.overview, copy.environments, copy.agents, copy.costs].map((label, index) => ({ label, href: `#/s${index}`, meta: index === 1 ? '1' : null })) },
		{ kind: 'entries', key: 'needs', heading: copy.needs, items: [entry('c4', 3, { label: copy.mark, tone: 'warning' })] },
		{ kind: 'entries', key: 'pinned', heading: copy.pinned, items: [entry('c1', 0)] },
		{ kind: 'entries', key: 'recent', heading: copy.recent, items: [entry('c2', 1, { label: copy.working, tone: 'danger' }), entry('c3', 2), entry('c5', 4)], more: { label: copy.all, href: '#/conversations' } }
	];
}

/** The sidebar's search: found by the beginning of a word, refused or silent by `?search=`. */
export function search(copy) {
	return {
		label: copy.search,
		delay: 50,
		bound: shape.search === 'slow' ? 1500 : 5000,
		all: text => `#/conversations?q=${encodeURIComponent(text)}`,
		source: ({ query: text }) => {
			window.fixture?.log.push(`search:${text}`);
			if (shape.search === 'fail') return Promise.reject(new Error('down'));
			if (shape.search === 'slow') return new Promise(() => {});
			const found = titles.map((label, index) => ({ key: `c${index + 1}`, label, href: `#/conversations/c${index + 1}` })).filter(item => item.label.toLowerCase().split(/\s+/).some(word => word.startsWith(text.toLowerCase())));
			return new Promise(resolve => setTimeout(() => resolve(found), 60));
		}
	};
}

/** Twenty lines of output, for a section that folds after twelve. */
export const output = Array.from({ length: 20 }, (_, index) => `ok ${index + 1} - checkout redirects after payment`).join('\n');

/** The plan of the running turn, as Steps draws it. */
export const plan = labels => [
	{ id: 'read', label: labels[0], state: 'done' },
	{ id: 'test', label: labels[1], state: 'progress' },
	{ id: 'commit', label: labels[2], state: 'waiting' }
];

/** A long answer the live text receives in pieces. */
export const answer = 'The checkout sent people back to the cart because the redirect read the old session.\n\nI changed it to read the order, added a test for a failed payment, and the whole suite passes.';
