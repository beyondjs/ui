// The fictional page of the 0.33.0 fixtures (D163, D186): a project list whose work column, a repository
// picker and a rename form share one outage of Beyond Projects; `?inbox=1` is the notification inbox whose
// relay did not answer. Every read fails until `window.fixture.read.answer` is true.
export const words = {
	cause: 'Beyond Projects did not answer',
	title: 'Projects',
	projects: [{ id: 'atlas', name: 'Atlas' }, { id: 'borealis', name: 'Borealis' }],
	name: 'Project',
	work: 'Your work',
	repositories: 'Repositories',
	rename: 'Rename',
	field: 'Name',
	answered: 'atlas-web'
};

/** The page's form from its address: `?inbox=1`. */
export function shape(search = location.search) {
	return { inbox: new URLSearchParams(search).has('inbox') };
}

/** A read of Beyond Projects that fails with its outage until it answers. */
export class Reads {
	answer = false;
	tries = 0;

	failure() {
		return Object.assign(new Error('Beyond Projects is unavailable (UNAVAILABLE)'), { outage: true, request: `req_${(this.tries += 1)}_7Hq2` });
	}

	/** A picker's source over one repository. */
	source = async () => {
		if (!this.answer) throw this.failure();
		return { items: [{ id: 'atlas-web', label: words.answered }] };
	};

	/** The notification relay, unavailable until it answers. */
	adapter = {
		summary: async () => ({ unread: 0 }),
		list: async () => (this.answer ? { items: [], next: null } : { available: false, reason: 'projects_unavailable', request: 'req_inbox_7Hq2' }),
		read: async () => ({}),
		unread: async () => ({}),
		open: async () => ({})
	};
}
