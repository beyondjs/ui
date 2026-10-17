// The 0.15.0 audit fixture's data, shared by the DOM and React consumers.
export const machines = Array.from({ length: 6 }, (_, index) => ({ id: `m${index}`, name: ['web', 'lab', 'api', 'docs', 'jobs', 'cache'][index], size: index % 2 ? 'Small' : 'Standard', conversations: index, state: ['ready', 'busy', 'asleep', 'attention', 'failed', 'waking'][index] }));

export const options = [
	{ value: 'default', label: 'Default' },
	...Array.from({ length: 9 }, (_, index) => ({ value: `m${index}`, label: `Model ${index + 1}`, detail: 'A model with a long description that takes a second line in the menu' }))
];

export const tones = ['ready', 'busy', 'attention', 'failed', 'asleep', 'unknown'];

export const command = 'npm run test -- --filter "addresses in the address bar" && git status --short';
