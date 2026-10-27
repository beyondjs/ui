// The fictional page of the 0.24.0 recovery fixtures (D163): a project's Home whose four reads did not
// answer on one cause. English, and Spanish with `?lang=es`.
export const words = {
	en: {
		title: 'Home',
		project: 'My first project',
		cause: 'Beyond Accounts did not answer',
		said: 'Beyond Accounts is unavailable (UNAVAILABLE)',
		reads: [['project', 'The project'], ['machines', 'Machines'], ['work', 'Your conversations'], ['attention', 'Requests']],
		machines: 'Machines',
		work: 'Recent conversations',
		attention: 'Needs you',
		kept: ['Fix the checkout redirect', 'Add the release notes'],
		answered: 'Your machines'
	},
	es: {
		title: 'Inicio',
		project: 'Mi primer proyecto',
		cause: 'Beyond Accounts no respondió',
		said: 'Beyond Accounts no está disponible (UNAVAILABLE)',
		reads: [['project', 'El proyecto'], ['machines', 'Máquinas'], ['work', 'Tus conversaciones'], ['attention', 'Solicitudes']],
		machines: 'Máquinas',
		work: 'Conversaciones recientes',
		attention: 'Te necesita',
		kept: ['Corregir la redirección del pago', 'Añadir las notas de la versión'],
		answered: 'Tus máquinas'
	}
};

/** The page's language and form from its address: `?lang=es`, `?whole=1`, and `?bare=1` for reads with no evidence (0.44.0). */
export function shape(search = location.search) {
	const query = new URLSearchParams(search);
	return { language: query.get('lang') === 'es' ? 'es' : 'en', whole: query.has('whole'), bare: query.has('bare') };
}
