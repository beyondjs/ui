// The fictional words of the pressing pages (0.34.0, D183): a new conversation's composer whose branch waits
// for a repository, whose Send is held until one is chosen, and the line comments that go with the next
// message; on the React page, an invitation whose email the browser checks. English for the DOM page,
// Spanish for the React pages.
export const words = {
	en: {
		title: 'New conversation',
		label: 'Message to Claude Code',
		placeholder: 'Message Claude Code…',
		draft: 'Fix the checkout redirect',
		repository: 'Repository',
		repositories: [{ value: 'web', label: 'acme/web' }, { value: 'api', label: 'acme/api' }],
		branch: 'Branch',
		branches: [{ value: 'main', label: 'main', status: ['Default', 'neutral'] }, { value: 'fix', label: 'fix/redirect' }],
		held: 'Choose a repository first.',
		comments: 'Line comments',
		said: count => `${count} line comments go with your message: open them`,
		instructions: 'Instructions'
	},
	es: {
		title: 'Nueva conversación',
		label: 'Mensaje para Claude Code',
		placeholder: 'Escribe a Claude Code…',
		draft: 'Corrige la redirección del pago',
		repository: 'Repositorio',
		repositories: [{ value: 'web', label: 'acme/web' }, { value: 'api', label: 'acme/api' }],
		branch: 'Rama',
		branches: [{ value: 'main', label: 'main', status: ['Predeterminada', 'neutral'] }, { value: 'fix', label: 'fix/redirect' }],
		held: 'Elige primero un repositorio.',
		comments: 'Comentarios de línea',
		said: count => `${count} comentarios de línea van con tu mensaje: ábrelos`,
		instructions: 'Instrucciones',
		invite: { name: 'Nombre', email: 'Correo', send: 'Invitar' }
	}
};
