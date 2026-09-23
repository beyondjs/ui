/** Requests the fixture collections list. */
export const rows = Array.from({ length: 23 }, (_, index) => ({
	id: `r${index + 1}`,
	title: `Request ${index + 1}`,
	state: ['open', 'accepted', 'released'][index % 3],
	votes: index * 2
}));

export const states = [
	{ value: 'open', label: 'Open' },
	{ value: 'released', label: 'Released' }
];
