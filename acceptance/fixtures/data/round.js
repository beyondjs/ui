// The round page's data (0.14.0), shared by the DOM page and the React page: `?length=long` (the default),
// `short` or `empty` for the thread's content, the sidebar's objects (Needs you, Recent) with their action
// and search, the composer's commands and a recalled message, and a dictation whose transcription answers
// in the page (`?voice=fail` rejects, `?voice=slow` never answers).
const query = new URLSearchParams(location.search);

export const shape = { length: query.get('length') ?? 'long', voice: query.get('voice') ?? 'ready', shortcut: query.get('shortcut') !== 'off' };

const entry = (key, label, extra = {}) => ({ key, label, href: `#/conversations/${key}`, ...extra });

/** The sidebar's groups: sections, then the conversations as objects; `added` adds an item that needs the person. */
export function groups({ added = false } = {}) {
	const needs = [entry('c3', 'Add product filters', { mark: { label: 'Needs you', tone: 'warning' } }), added ? entry('c9', 'Approve a command', { mark: { label: 'Needs you', tone: 'warning' } }) : null].filter(Boolean);
	return [
		{ items: [{ label: 'Overview', href: '#/overview' }, { label: 'Environments', href: '#/environments' }, { label: 'Agents', href: '#/agents' }] },
		{
			kind: 'object',
			key: 'conversations',
			heading: 'Conversations',
			action: { label: 'New', href: '#/new', row: true },
			search: { label: 'Search conversations', delay: 0, source: async ({ query: text }) => [entry('r1', `Found ${text}`)] },
			groups: [
				{ kind: 'entries', key: 'needs', heading: 'Needs you', items: needs, attention: true },
				{ kind: 'entries', key: 'recent', heading: 'Recent', count: 3, items: [entry('c1', 'Fix the checkout redirect', { current: true }), entry('c2', 'Upgrade the build'), entry('c4', 'Tidy the styles')] }
			],
			more: { label: 'All conversations', href: '#/conversations' }
		}
	];
}

const prose = [
	'I traced the redirect to the payment callback: it sends the person to the cart page before the order is marked failed, so the cart is cleared and the page reloads empty.',
	'The fix keeps the cart until the payment service answers, then redirects with the order’s state in the address so a reload shows the same.',
	'I also added a test that fails a payment on purpose and checks that the cart keeps its items and that the page says why the payment failed.'
];
const code = "export async function callback(order, answer) {\n\tif (answer.state === 'failed') return redirect(`/cart?order=${order.id}&state=failed`);\n\tawait orders.complete(order.id);\n\treturn redirect(`/orders/${order.id}`);\n}";

/** The thread's turns as data: a message, prose and code, repeated for a long thread. */
export function turns() {
	if (shape.length === 'empty') return [];
	const one = [{ kind: 'message', text: 'Fix the checkout redirect after a failed payment.' }, ...prose.map(text => ({ kind: 'prose', text })), { kind: 'code', text: code }];
	return shape.length === 'short' ? one.slice(0, 2) : Array.from({ length: 4 }, () => one).flat();
}

export const commands = log => [
	{ value: '/model', label: 'Change the model', run: () => log.push('command:model') },
	{ value: '/review', label: 'Review the changes' }
];

/** The product's side of dictation: it reads the recording and answers words, or fails, or never answers. */
export const transcribe = log => async (blob, { signal, type, seconds }) => {
	log.push(`transcribe:${type}:${blob.size > 0}:${seconds >= 1}`);
	if (shape.voice === 'fail') throw new Error('The transcription service did not answer');
	if (shape.voice === 'slow') return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
	return { text: 'and keep the cart' };
};
