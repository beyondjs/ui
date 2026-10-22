/** Comparable dates keep distinct meanings; summaries name their own value. */
export const records = [{ id: 'ada', name: 'Ada', joined: '12 October 2026', active: '20 October 2026', work: '3 conversations', missing: '' }];
export const columns = [
	{ key: 'name', label: 'Member', primary: true },
	{ key: 'joined', label: 'Joined', sort: true },
	{ key: 'active', label: 'Last active', sort: true },
	{ key: 'work', label: 'Work', summary: true },
	{ key: 'missing', label: 'Missing' }
];
export const object = {
	title: 'Storefront',
	href: '/repositories/storefront',
	meta: 'Machine: Build server',
	facts: ['12 working copies', 'Last used: 20 October 2026', 'A-long-fact-without-any-break-spaces'],
	actions: [{ label: 'Open files', run() {} }]
};
