/**
 * The application's entry throws while it starts, before it draws anything, and then moves anyway: a
 * callback it scheduled first draws its waiting element and, once its read settles, a useful screen.
 */
setTimeout(async () => {
	const root = document.getElementById('root');
	const pending = Object.assign(document.createElement('p'), { textContent: 'Confirmando tu sesión…' });
	pending.dataset.buiOpeningWait = 'session';
	root.append(pending);
	await fetch('/state');
	root.replaceChildren(Object.assign(document.createElement('h1'), { textContent: 'Your projects' }));
}, 1500);
throw new TypeError('A part of the application could not start');
