/** Fictional members with a long first metadata line, including a row without actions. */
export const rows = [
	{ id: 'sam', name: 'Sam Example', email: 'sam@example.test', role: 'Administrator' },
	{ id: 'dani', name: 'Dani Example', email: 'dani@example.test', role: 'Developer' },
	{ id: 'alex', name: 'Alex with a deliberately long name that wraps', email: 'alex@example.test', role: 'Owner' },
	{ id: 'none', name: 'No available actions', email: 'none@example.test', role: 'Viewer' }
];
export const columns = [
	{ key: 'name', label: 'Name', primary: true },
	{ key: 'email', label: 'Address' },
	{ key: 'role', label: 'Role' }
];
