/**
 * Framed choices (0.46.0): fictional permissions an app might ask for, each with what it gives and a state tag, and
 * a chooser of where they apply. Shared by the DOM and React consumers.
 */
export const permissions = [
	{ value: 'read', label: 'Read your projects', hint: 'See your projects, their members and their settings.', status: ['Read only', 'neutral'] },
	{ value: 'run', label: 'Start machines for you', hint: 'Create, start and stop machines in your projects. A machine that runs is measured as usage.', status: ['Can incur costs', 'warning'] },
	{ value: 'delete', label: 'Delete projects', disabled: true, reason: 'Only an owner of the organization can allow this.' },
	{ value: 'notes', label: 'Write notes on your conversations', status: ['Changes your work', 'neutral'] }
];
export const chosen = ['run'];
export const reach = [
	{ value: 'one', label: 'This project only', hint: 'Storefront, and nothing else in the organization.' },
	{ value: 'all', label: 'Every project', hint: 'Including the projects created later.', status: ['Wider access', 'warning'] }
];
