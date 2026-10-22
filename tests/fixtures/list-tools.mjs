/** Small records whose query and ownership filters have different results. */
export const rows = [
	{ id: 'cedar', name: 'Cedar', owner: 'mine' },
	{ id: 'birch', name: 'Birch', owner: 'other' },
	{ id: 'elm', name: 'Elm', owner: 'mine' }
];
export const columns = [{ key: 'name', label: 'Machine', primary: true }];
export const filters = [{ name: 'owner', label: 'Whose', all: 'Everyone', options: [{ value: 'mine', label: 'Mine' }, { value: 'other', label: 'Others' }] }];

export class ToolsSource {
	#requests = [];
	get requests() { return this.#requests; }
	read = async request => {
		this.#requests.push(request);
		const found = rows.filter(row => (!request.query || row.name.toLowerCase().includes(request.query.toLowerCase())) && (!request.filters.owner || row.owner === request.filters.owner));
		return { rows: found, total: found.length };
	};
}
