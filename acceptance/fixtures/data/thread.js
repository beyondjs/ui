// The thread fixture's data (0.11.0), shared by the DOM page (English) and the React pages (Spanish): a
// project's conversations with ages and a count, the context panel's facts and meters, the composer's
// settings, files a suggestion lists (`?suggest=fail` refuses, `?suggest=slow` never answers within its
// bound) and the words of each language.
const query = new URLSearchParams(location.search);

export const shape = {
	suggest: query.get('suggest') ?? 'ready',
	wide: query.get('wide') === '1'
};

export const words = {
	en: { product: 'Conduict', project: 'Project', overview: 'Overview', environments: 'Environments', recent: 'Recent', pinned: 'Pinned', all: 'All conversations', action: 'New conversation', title: 'Fix the checkout redirect after a failed payment', status: 'Working', facts: 'Claude Code · My first VM · acme/web', details: 'Details', review: 'Review changes', panel: 'Conversation details', message: 'Message to Claude Code', placeholder: 'Message Claude Code…', pull: 'Create pull request', changes: 'Changes', summary: '3 files · +52 −3', pushed: 'Not pushed', branch: 'Branch', committed: 'Not committed', engine: 'AI engine', model: 'Model', effort: 'Effort', autonomy: 'Autonomy', window: '5-hour window', week: 'Weekly window', copy: 'Copy', stopped: 'My first VM is stopped · about $0.20 an hour', start: 'Start', state: 'State', since: 'Not reported since 23:10', ask: 'Ask me', folder: 'Work in its folder', readonly: 'Read only', unenforced: "This engine's route can't enforce it" },
	es: { product: 'Conduict', project: 'Proyecto', overview: 'Resumen', environments: 'Entornos', recent: 'Recientes', pinned: 'Fijadas', all: 'Todas las conversaciones', action: 'Nueva conversación', title: 'Corregir la redirección del pago tras un pago fallido', status: 'Trabajando', facts: 'Claude Code · Mi primera VM · acme/web', details: 'Detalles', review: 'Revisar cambios', panel: 'Detalles de la conversación', message: 'Mensaje para Claude Code', placeholder: 'Mensaje para Claude Code…', pull: 'Crear pull request', changes: 'Cambios', summary: '3 archivos · +52 −3', pushed: 'Sin enviar', branch: 'Rama', committed: 'Sin confirmar', engine: 'Motor de IA', model: 'Modelo', effort: 'Esfuerzo', autonomy: 'Autonomía', window: 'Ventana de 5 horas', week: 'Ventana semanal', copy: 'Copiar', stopped: 'Mi primera VM está detenida · unos 0,20 $ por hora', start: 'Iniciar', state: 'Estado', since: 'Sin datos desde 23:10', ask: 'Preguntarme', folder: 'Trabajar en su carpeta', readonly: 'Solo lectura', unenforced: 'La ruta de este motor no puede imponerlo' }
};

const titles = ['Fix the checkout redirect after a failed payment', 'Upgrade the build to the latest toolchain and explain every warning it prints along the way', 'Tidy the styles', 'Add product filters'];
const minutes = [3, 125, 60 * 24 * 3, 60 * 24 * 16];

/** The sidebar's groups for a language: sections, then Pinned and Recent with ages, Recent counted. */
export function groups(copy) {
	const entry = (index, current = false) => ({ key: `c${index}`, label: titles[index], href: `#/conversations/c${index}`, current, age: Date.now() - minutes[index] * 60_000 });
	return [
		{ items: [copy.overview, copy.environments].map((label, index) => ({ label, href: `#/s${index}` })) },
		{ kind: 'entries', key: 'pinned', heading: copy.pinned, items: [entry(0, true)] },
		{ kind: 'entries', key: 'recent', heading: copy.recent, count: 12, items: [entry(1), entry(2), entry(3)], more: { label: copy.all, href: '#/conversations' } }
	];
}

/** The Changes section's rows, with a Copy action the page supplies. */
export const rows = (copy, action) => [
	{ key: 'branch', label: copy.branch, value: 'conduict/fix-checkout-redirect-after-a-failed-payment', mono: true, action },
	{ key: 'committed', label: copy.committed, value: '1 file' },
	{ key: 'state', label: copy.state, value: 'Stopped', stale: copy.since }
];

/** The model and autonomy chips' options. */
export const models = [
	{ value: 'opus', label: 'Opus 5.5', detail: 'claude-opus-5-5', status: ['Default', 'neutral'] },
	{ value: 'sonnet', label: 'Sonnet 5', detail: 'claude-sonnet-5' }
];
export const levels = copy => [
	{ value: 'read', label: copy.readonly },
	{ value: 'ask', label: copy.ask, status: ['Default', 'neutral'] },
	{ value: 'folder', label: copy.folder, disabled: true, reason: copy.unenforced }
];

const files = ['src/checkout/redirect.js', 'src/checkout/session.js', 'src/checkout/payment.js', 'test/checkout.test.js'];

/** The composer's suggestions: files that contain the query, refused or silent by `?suggest=`. */
export function suggest(query, signal) {
	window.fixture?.log.push(`ask:${query}`);
	if (shape.suggest === 'fail') return Promise.reject(new Error('down'));
	if (shape.suggest === 'slow') return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
	const found = files.filter(path => path.includes(query)).map(path => ({ value: `@${path}`, label: path, mono: true }));
	return new Promise(resolve => setTimeout(() => resolve(found), 40));
}

/** A long thread, so the page scrolls past its header. */
export const paragraphs = Array.from({ length: 24 }, (_, index) => `Step ${index + 1}: the checkout reads the order, not the session, so a failed payment keeps the cart and shows its error.`);
