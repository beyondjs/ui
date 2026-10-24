// The settling page's data (0.32.0), shared by the DOM page (English) and the React page (Spanish). `?page=thread`,
// the default, docks the composer in a thread; `?page=plain` holds it in a plain page's section. Both pages stand
// beside the Sidebar under the family bar, with a panel kept in view from a 73rem region, and the composer is a
// running Codex turn's: the + with a product's entry, a long model chip and autonomy with its state, Interrupt and
// Queue, so its toolbar keeps every word on a wide screen, says the chips' values on a tablet and folds them
// behind Options on a phone.
const query = new URLSearchParams(location.search);

export const shape = { page: query.get('page') === 'plain' ? 'plain' : 'thread' };

export const words = {
	en: { product: 'Conduict', project: 'Project', overview: 'Overview', machines: 'Machines', title: 'Fix the checkout redirect after a failed payment', details: 'Details', panel: 'Conversation details', message: 'Message to Codex', placeholder: 'Message Codex…', mention: 'Mention a file', model: 'Model', autonomy: 'Autonomy', readonly: 'Read only', folder: 'Work in its folder', unverified: 'Not verified', interrupt: 'Interrupt', queue: 'Queue', now: 'Send now', changes: 'Changes', summary: '3 files · +52 −3', engine: 'AI engine', section: 'New message' },
	es: { product: 'Conduict', project: 'Proyecto', overview: 'Resumen', machines: 'Máquinas', title: 'Corregir la redirección del pago tras un pago fallido', details: 'Detalles', panel: 'Detalles de la conversación', message: 'Mensaje para Codex', placeholder: 'Mensaje para Codex…', mention: 'Mencionar un archivo', model: 'Modelo', autonomy: 'Autonomía', readonly: 'Solo lectura', folder: 'Trabajar en su carpeta', unverified: 'Sin verificar', interrupt: 'Interrumpir', queue: 'Poner en cola', now: 'Enviar ahora', changes: 'Cambios', summary: '3 archivos · +52 −3', engine: 'Motor de IA', section: 'Mensaje nuevo' }
};

/** The Sidebar's sections. */
export const groups = copy => [{ items: [copy.overview, copy.machines].map((label, index) => ({ key: `s${index}`, label, href: `#/s${index}` })) }];

/** The model's and autonomy's options, and what sending uses, said by Options while folded. */
export const models = [
	{ value: 'sol', label: 'GPT-6.1 Sol (default) · Medium', detail: 'gpt-6.1-sol', status: ['Default', 'neutral'] },
	{ value: 'sol-high', label: 'GPT-6.1 Sol · High' }
];
export const levels = copy => [
	{ value: 'read', label: copy.readonly },
	{ value: 'folder', label: copy.folder, status: [copy.unverified, 'neutral'] }
];
export const summary = 'GPT-6.1 Sol';
export const actions = copy => [{ id: 'queue', label: copy.queue, primary: true }, { id: 'now', label: copy.now }];

/** The thread's answer: enough paragraphs to scroll past the header, so the dock stands over content. */
export const paragraphs = Array.from({ length: 6 }, (_, index) => `${index + 1}. The provider calls back on another site, so the browser treats the session cookie as a third-party cookie and drops it when SameSite is strict. The redirect then finds no session and sends the person to the cart.`);
