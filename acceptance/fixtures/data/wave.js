// The 0.16.0 fixture's data, shared by the DOM and React consumers.
export const sizes = [
	{ value: 'small', title: 'Small', detail: 'One conversation at a time', facts: ['2 cores', '4 GB'] },
	{ value: 'standard', title: 'Standard', facts: ['4 cores', '16 GB'] },
	{ value: 'large', title: 'Large', facts: ['8 cores', '32 GB'], disabled: true, reason: 'Your organization allows Small and Standard' }
];

export const sources = log => [
	{ key: 'machines', label: 'Machines', search: query => ['web', 'lab', 'api'].filter(name => name.includes(query)).map(name => ({ id: `m-${name}`, label: name, detail: 'Machine', glyph: 'box', href: `#/machines/${name}` })) },
	{ key: 'actions', label: 'Actions', empty: true, search: query => [{ id: 'new', label: 'New conversation', keys: 'N', run: () => log.push('palette:new') }].filter(item => item.label.toLowerCase().includes(query.toLowerCase())) }
];

export const decisions = [
	{ value: 'once', label: 'Allow once', kind: 'allow' },
	{ value: 'conversation', label: 'Allow for this conversation', kind: 'allow' },
	{ value: 'note', label: 'Deny and say why', kind: 'deny', note: true },
	{ value: 'deny', label: 'Deny', kind: 'deny' }
];
